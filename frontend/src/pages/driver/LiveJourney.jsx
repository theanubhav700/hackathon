import { useState, useEffect, useRef } from 'react';
import DriverLayout from '../../layouts/DriverLayout';
import { motion } from 'framer-motion';

const ORS_KEY = import.meta.env.VITE_ORS_KEY;

// ── Haversine ────────────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDuration(sec) {
  if (!sec) return '—';
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

async function fetchORSRoute(fromLat, fromLon, toLat, toLon) {
  const res = await fetch(
    'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
    {
      method: 'POST',
      headers: { Authorization: ORS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: [[fromLon, fromLat], [toLon, toLat]],
        instructions: true,
        language: 'en',
      }),
    }
  );
  if (!res.ok) throw new Error(`ORS ${res.status}`);
  const data    = await res.json();
  const feat    = data.features[0];
  const coords  = feat.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
  const summary = feat.properties.summary;
  return {
    coords,
    distanceKm:  (summary.distance / 1000).toFixed(2),
    durationSec: summary.duration,
  };
}

export default function LiveJourney() {
  const booking      = JSON.parse(localStorage.getItem('resq_active_booking') || 'null');
  const patient      = JSON.parse(localStorage.getItem('resq_patient_info')   || 'null');
  const vitals       = JSON.parse(localStorage.getItem('resq_patient_vitals') || 'null');
  const driver       = JSON.parse(localStorage.getItem('resq_user')           || '{}');
  const destHospital = JSON.parse(localStorage.getItem('resq_dest_hospital')  || 'null');

  const [driverPos,    setDriverPos]    = useState(() => {
    const s = JSON.parse(localStorage.getItem('resq_driver_location') || 'null');
    return s ? [s.lat, s.lon] : null;
  });
  const [hospitalPos, setHospitalPos]   = useState(() =>
    destHospital?.lat ? [parseFloat(destHospital.lat), parseFloat(destHospital.lon)] : null
  );
  const [routeCoords,  setRouteCoords]  = useState([]);
  const [distanceKm,   setDistanceKm]   = useState(null);
  const [durationSec,  setDurationSec]  = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [gpsError,     setGpsError]     = useState('');
  const [elapsed,      setElapsed]      = useState(0);  // seconds since boarded
  const [signalCount,  setSignalCount]  = useState(() =>
    parseInt(localStorage.getItem('resq_corridor_signal_count') || '0', 10)
  );

  const [boardedAt] = useState(() =>
    localStorage.getItem('resq_boarded_at') || new Date().toISOString()
  );

  const watchRef     = useRef(null);
  const routeFetched = useRef(false);
  const timerRef     = useRef(null);

  // Save boarded time once
  useEffect(() => {
    if (!localStorage.getItem('resq_boarded_at'))
      localStorage.setItem('resq_boarded_at', new Date().toISOString());
  }, []);

  // Elapsed timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const diff = Math.floor((Date.now() - new Date(boardedAt).getTime()) / 1000);
      setElapsed(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [boardedAt]);

  // Fetch ORS route
  useEffect(() => {
    if (!driverPos || !hospitalPos || routeFetched.current) return;
    routeFetched.current = true;
    setRouteLoading(true);
    fetchORSRoute(driverPos[0], driverPos[1], hospitalPos[0], hospitalPos[1])
      .then(({ coords, distanceKm, durationSec }) => {
        setRouteCoords(coords);
        setDistanceKm(distanceKm);
        setDurationSec(durationSec);
      })
      .catch(() => {
        setRouteCoords([driverPos, hospitalPos]);
        const d = haversineKm(driverPos[0], driverPos[1], hospitalPos[0], hospitalPos[1]);
        setDistanceKm(d.toFixed(2));
        setDurationSec(Math.round((d / 40) * 3600));
      })
      .finally(() => setRouteLoading(false));
  }, [driverPos, hospitalPos]);

  // GPS watch
  useEffect(() => {
    if (!navigator.geolocation) { setGpsError('GPS not supported'); return; }
    watchRef.current = navigator.geolocation.watchPosition(
      ({ coords: { latitude: lat, longitude: lon } }) => {
        setDriverPos([lat, lon]);
        setGpsError('');
        localStorage.setItem('resq_driver_location', JSON.stringify({ lat, lon }));
        if (hospitalPos) {
          const d = haversineKm(lat, lon, hospitalPos[0], hospitalPos[1]);
          setDistanceKm(d.toFixed(2));
        }
      },
      () => setGpsError('Using last known location'),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchRef.current);
  }, [hospitalPos]);

  // Derived
  const boardedTime = (() => {
    try { return new Date(boardedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
    catch { return '—'; }
  })();

  const elapsedStr = (() => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  })();

  const situationLabel = (() => {
    const m = { critical: 'Critical', serious: 'Serious', stable: 'Stable', normal: 'Normal' };
    return m[vitals?.situation] || (patient?.emergencyType ? patient.emergencyType : 'Unknown');
  })();

  const situationColor = (() => {
    const m = { critical: '#ff3333', serious: '#ff8800', stable: '#ffcc00', normal: '#00cc66' };
    return m[vitals?.situation] || '#ff8800';
  })();

  const situationBg = (() => {
    const m = { critical: 'rgba(255,51,51,0.12)', serious: 'rgba(255,136,0,0.12)', stable: 'rgba(255,204,0,0.1)', normal: 'rgba(0,204,102,0.1)' };
    return m[vitals?.situation] || 'rgba(255,136,0,0.1)';
  })();

  const googleMapsUrl = driverPos && hospitalPos
    ? `https://www.google.com/maps/dir/?api=1&origin=${driverPos[0]},${driverPos[1]}&destination=${hospitalPos[0]},${hospitalPos[1]}&travelmode=driving`
    : hospitalPos
      ? `https://www.google.com/maps/dir/?api=1&destination=${hospitalPos[0]},${hospitalPos[1]}&travelmode=driving`
      : null;

  // Speed estimate (rough)
  const speedKmh = driverPos ? 40 : 0; // placeholder

  return (
    <DriverLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: 'calc(100vh - 116px)', minHeight: 600 }}>

        {/* ── TOP HEADER BAR ───────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14, flexWrap: 'wrap', gap: 10,
        }}>
          {/* Left — title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg,#00cc66,#009944)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, boxShadow: '0 0 16px rgba(0,204,102,0.35)',
            }}>🗺️</div>
            <div>
              <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 18, margin: 0, lineHeight: 1.2 }}>
                Live Emergency Journey
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ width: 7, height: 7, borderRadius: '50%', background: '#00cc66', display: 'inline-block', boxShadow: '0 0 8px #00cc66' }}
                />
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                  En route to hospital · Patient on board
                  {routeLoading && <span style={{ color: '#ffaa00', marginLeft: 8 }}>⏳ Calculating route...</span>}
                  {gpsError && <span style={{ color: '#ffaa00', marginLeft: 8 }}>⚠️ {gpsError}</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Right — quick stats pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatPill icon="⏱️" label="Trip Time" value={elapsedStr} color="#3399ff" />
            <StatPill icon="📍" label="Distance" value={distanceKm ? `${distanceKm} km` : '—'} color="#00cc66" />
            <StatPill icon="🕐" label="ETA" value={durationSec !== null ? formatDuration(durationSec) : '—'} color="#ff8800" />
            <StatPill
              icon="🚦"
              label="Signals"
              value={signalCount > 0 ? `${signalCount}` : '—'}
              color="#ffcc00"
            />
          </div>
        </div>

        {/* ── MAIN BODY — map + side panel ─────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 14, flex: 1, minHeight: 0 }}>

          {/* ── MAP ───────────────────────────────────────── */}
          <div style={{
            borderRadius: 18, overflow: 'hidden',
            border: '1px solid rgba(0,204,102,0.18)',
            boxShadow: '0 0 40px rgba(0,204,102,0.05)',
            position: 'relative',
            background: 'rgba(255,255,255,0.02)',
          }}>
            {/* Live badge */}
            <div style={{
              position: 'absolute', top: 14, left: 14, zIndex: 10,
              background: 'rgba(5,5,15,0.88)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,204,102,0.4)',
              padding: '6px 14px', borderRadius: 20,
              display: 'flex', alignItems: 'center', gap: 7,
              pointerEvents: 'none',
            }}>
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: '50%', background: '#00cc66', display: 'inline-block' }}
              />
              <span style={{ color: '#00cc66', fontSize: 11, fontWeight: 800, letterSpacing: 0.8 }}>🚑 EN ROUTE TO HOSPITAL</span>
            </div>

            {/* ETA badge */}
            {durationSec !== null && (
              <div style={{
                position: 'absolute', top: 14, right: 14, zIndex: 10,
                background: 'rgba(5,5,15,0.88)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,136,0,0.35)',
                borderRadius: 14, padding: '10px 16px', textAlign: 'center',
                pointerEvents: 'none',
                boxShadow: '0 4px 20px rgba(255,136,0,0.15)',
              }}>
                <div style={{ color: '#ff8800', fontWeight: 900, fontSize: 22, lineHeight: 1 }}>
                  {formatDuration(durationSec)}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 3, letterSpacing: 1, fontWeight: 700 }}>ETA</div>
              </div>
            )}

            {/* Condition badge */}
            <div style={{
              position: 'absolute', bottom: 14, left: 14, zIndex: 10,
              background: situationBg, backdropFilter: 'blur(10px)',
              border: `1px solid ${situationColor}40`,
              padding: '7px 14px', borderRadius: 20,
              pointerEvents: 'none',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: situationColor, display: 'inline-block', boxShadow: `0 0 6px ${situationColor}` }} />
              <span style={{ color: situationColor, fontSize: 11, fontWeight: 800 }}>
                PATIENT: {situationLabel.toUpperCase()}
              </span>
            </div>

            {/* Map iframe */}
            {hospitalPos ? (
              <iframe
                title="Google Maps Navigation"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ display: 'block', minHeight: 400 }}
                referrerPolicy="no-referrer-when-downgrade"
                src={
                  driverPos
                    ? `https://maps.google.com/maps?saddr=${driverPos[0]},${driverPos[1]}&daddr=${hospitalPos[0]},${hospitalPos[1]}&output=embed&t=k`
                    : `https://maps.google.com/maps?q=${hospitalPos[0]},${hospitalPos[1]}&output=embed&t=k`
                }
                allowFullScreen
              />
            ) : (
              <div style={{
                height: '100%', minHeight: 400,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 12,
              }}>
                <div style={{ fontSize: 48, opacity: 0.08 }}>🏥</div>
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600 }}>No hospital selected</div>
                <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>
                  Go to Hospital Info → select a hospital → Navigate
                </div>
              </div>
            )}
          </div>

          {/* ── SIDE PANEL ─────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>

            {/* 1 — Destination */}
            <InfoCard title="🏥 Destination" accent="#3399ff">
              <InfoRow label="Hospital"      value={destHospital?.name || 'Not set'}    color={destHospital ? '#fff' : undefined} />
              <InfoRow label="Address"       value={destHospital?.address || '—'}       color="rgba(255,255,255,0.45)" small />
              <Divider />
              <InfoRow label="ETA"           value={durationSec !== null ? formatDuration(durationSec) : '—'} color="#ff8800" />
              <InfoRow label="Distance"      value={distanceKm !== null ? `${distanceKm} km` : '—'}           color="#3399ff" />
              <InfoRow label="Total Signals" value={signalCount > 0 ? `🚦 ${signalCount}` : '—'}              color="#ffcc00" />
            </InfoCard>

            {/* 2 — Patient */}
            <InfoCard title="👤 Patient Status" accent="#ff4466">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: situationBg, border: `1px solid ${situationColor}30`,
                borderRadius: 10, padding: '9px 12px', marginBottom: 10,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: `${situationColor}20`, border: `2px solid ${situationColor}60`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>
                  {vitals?.situation === 'critical' ? '🔴' : vitals?.situation === 'serious' ? '🟠' : vitals?.situation === 'stable' ? '🟡' : '🟢'}
                </div>
                <div>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>{patient?.name || booking?.customerName || '—'}</div>
                  <div style={{ color: situationColor, fontSize: 11, fontWeight: 700, marginTop: 1 }}>{situationLabel}</div>
                </div>
              </div>
              <InfoRow label="Emergency"     value={patient?.emergencyType || booking?.emergencyType || '—'} color="#ff8800" />
              <InfoRow label="Phone"         value={patient?.mobile || booking?.customerPhone || '—'}        color="rgba(255,255,255,0.55)" />
              <InfoRow label="On Board"      value={boardedTime}                                              color="rgba(255,255,255,0.4)" />
              <InfoRow label="Trip Time"     value={elapsedStr}                                               color="#3399ff" />
              {vitals && (
                <>
                  <Divider />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 2 }}>
                    <VitalBox label="HR" value={vitals.hr ? `${vitals.hr} bpm` : '—'} color="#ff4466" />
                    <VitalBox label="SpO₂" value={vitals.spo2 ? `${vitals.spo2}%` : '—'} color="#3399ff" />
                    <VitalBox label="BP" value={vitals.bp || '—'} color="#ffaa00" />
                    <VitalBox label="Temp" value={vitals.temp ? `${vitals.temp}°C` : '—'} color="#00cc66" />
                  </div>
                </>
              )}
            </InfoCard>

            {/* 3 — GPS & Route */}
            <InfoCard title="🛰️ GPS & Route" accent="#00cc66">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <motion.div
                  animate={{ opacity: driverPos ? [0.5, 1, 0.5] : 1 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: '50%', background: driverPos ? '#00cc66' : '#888', boxShadow: driverPos ? '0 0 8px #00cc66' : 'none', flexShrink: 0 }}
                />
                <span style={{ color: driverPos ? '#00cc66' : '#888', fontSize: 12, fontWeight: 700 }}>
                  {driverPos ? 'GPS Active' : 'Acquiring GPS...'}
                </span>
                {driverPos && (
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginLeft: 'auto' }}>
                    {driverPos[0].toFixed(4)}, {driverPos[1].toFixed(4)}
                  </span>
                )}
              </div>
              <InfoRow label="Route"     value={routeCoords.length > 1 ? '✅ ORS Route Ready' : routeLoading ? '⏳ Calculating...' : 'Pending'} color={routeCoords.length > 1 ? '#00cc66' : '#ffaa00'} />
              <InfoRow label="Speed"     value={driverPos ? '~40 km/h' : '—'}     color="rgba(255,255,255,0.5)" />
              <InfoRow label="Waypoints" value={routeCoords.length > 0 ? `${routeCoords.length} pts` : '—'} color="rgba(255,255,255,0.4)" />
            </InfoCard>

            {/* 4 — Open in Maps */}
            {googleMapsUrl && (
              <a href={googleMapsUrl} target="_blank" rel="noreferrer" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                padding: '13px', borderRadius: 13, textDecoration: 'none',
                background: 'linear-gradient(135deg,#4285F4,#1a73e8)',
                color: '#fff', fontWeight: 800, fontSize: 13,
                boxShadow: '0 6px 24px rgba(66,133,244,0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                flexShrink: 0,
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(66,133,244,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(66,133,244,0.35)'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                Open in Google Maps
              </a>
            )}

          </div>
        </div>
      </div>
    </DriverLayout>
  );
}

// ── Sub-components ───────────────────────────────────────

function StatPill({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${color}25`,
      borderRadius: 10, padding: '7px 13px',
      display: 'flex', alignItems: 'center', gap: 7,
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <div>
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ color, fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  );
}

function InfoCard({ title, accent, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid ${accent}18`,
      borderRadius: 14, padding: '13px 15px',
      flexShrink: 0,
    }}>
      <div style={{
        color: accent, fontWeight: 800, fontSize: 11,
        marginBottom: 11, textTransform: 'uppercase', letterSpacing: 1,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>{title}</div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, color, small }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
      <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: small ? 11 : 12 }}>{label}</span>
      <span style={{
        color: color || (value === '—' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)'),
        fontSize: small ? 11 : 12, fontWeight: 600,
        textAlign: 'right', maxWidth: '65%',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{value}</span>
    </div>
  );
}

function VitalBox({ label, value, color }) {
  return (
    <div style={{
      background: `${color}0d`, border: `1px solid ${color}22`,
      borderRadius: 9, padding: '7px 10px', textAlign: 'center',
    }}>
      <div style={{ color, fontWeight: 800, fontSize: 13 }}>{value}</div>
      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />;
}
