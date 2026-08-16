import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../layouts/DriverLayout';
import { motion, AnimatePresence } from 'framer-motion';

// ── Haversine distance (km) ───────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── ETA assuming avg ambulance speed 40 km/h in city ─────
function etaMinutes(km) {
  return Math.max(1, Math.round((km / 40) * 60));
}

function formatEta(mins) {
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ── Fetch nearby hospitals via Overpass API ───────────────
async function fetchNearbyHospitals(lat, lon, radiusKm = 10) {
  const radius = radiusKm * 1000; // metres
  const query = `
    [out:json][timeout:20];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lon});
      way["amenity"="hospital"](around:${radius},${lat},${lon});
      node["amenity"="clinic"](around:${radius},${lat},${lon});
      node["healthcare"="hospital"](around:${radius},${lat},${lon});
    );
    out center;
  `;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  });
  if (!res.ok) throw new Error('Overpass API error');
  const data = await res.json();

  return data.elements
    .map(el => {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (!elLat || !elLon) return null;
      const name = el.tags?.name || el.tags?.['name:en'] || 'Unnamed Hospital';
      const dist = haversineKm(lat, lon, elLat, elLon);
      return {
        id:      el.id,
        name,
        lat:     elLat,
        lon:     elLon,
        dist:    dist,
        eta:     etaMinutes(dist),
        phone:   el.tags?.phone || el.tags?.['contact:phone'] || null,
        addr:    el.tags?.['addr:full'] || el.tags?.['addr:street'] || null,
        type:    el.tags?.amenity === 'clinic' ? 'Clinic' : 'Hospital',
        emergency: el.tags?.emergency === 'yes' ? true : false,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 15);
}

// ── Distance color ────────────────────────────────────────
function distColor(km) {
  if (km <= 2)  return '#00cc66';
  if (km <= 5)  return '#ffaa00';
  if (km <= 10) return '#ff8800';
  return '#ff4444';
}

export default function HospitalInfo() {
  const navigate = useNavigate();

  const [driverPos, setDriverPos]   = useState(null);
  const [hospitals, setHospitals]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [gpsStatus, setGpsStatus]   = useState('getting'); // getting | ok | fallback
  const [expanded, setExpanded]     = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchedRef = useRef(false);

  // ── Get GPS then fetch hospitals ──────────────────────
  useEffect(() => {
    if (fetchedRef.current) return;

    // Try stored location first for instant load
    const stored = JSON.parse(localStorage.getItem('resq_driver_location') || 'null');

    const doFetch = async (lat, lon, isFallback = false) => {
      fetchedRef.current = true;
      setDriverPos([lat, lon]);
      setGpsStatus(isFallback ? 'fallback' : 'ok');
      setLoading(true);
      setError('');
      try {
        const results = await fetchNearbyHospitals(lat, lon, 15);
        if (results.length === 0) {
          setError('No hospitals found within 15 km. Try a wider area.');
        }
        setHospitals(results);
        setLastUpdated(new Date());
      } catch (e) {
        setError('Could not fetch hospitals. Check internet connection.');
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      setGpsStatus('getting');
      navigator.geolocation.getCurrentPosition(
        (pos) => doFetch(pos.coords.latitude, pos.coords.longitude, false),
        () => {
          if (stored) {
            doFetch(stored.lat, stored.lon, true);
          } else {
            setGpsStatus('fallback');
            // Default: New Delhi
            doFetch(28.6139, 77.2090, true);
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    } else if (stored) {
      doFetch(stored.lat, stored.lon, true);
    } else {
      doFetch(28.6139, 77.2090, true);
    }
  }, []);

  const handleRefresh = () => {
    fetchedRef.current = false;
    setHospitals([]);
    setError('');
    // Re-run effect by resetting state
    setGpsStatus('getting');
    setLoading(true);

    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setDriverPos([lat, lon]);
        setGpsStatus('ok');
        try {
          const results = await fetchNearbyHospitals(lat, lon, 15);
          setHospitals(results);
          setLastUpdated(new Date());
        } catch {
          setError('Refresh failed. Try again.');
        } finally {
          setLoading(false);
        }
      },
      () => setLoading(false)
    );
  };

  return (
    <DriverLayout>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 22, margin: '0 0 4px' }}>🏥 Nearby Hospitals</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
            {gpsStatus === 'getting' && '📡 Getting your location...'}
            {gpsStatus === 'ok' && driverPos && `📍 ${driverPos[0].toFixed(4)}, ${driverPos[1].toFixed(4)} — GPS Active`}
            {gpsStatus === 'fallback' && '⚠️ Using last known / default location'}
            {lastUpdated && (
              <span style={{ marginLeft: 10, color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            padding: '8px 18px', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
            background: 'rgba(51,153,255,0.1)', border: '1px solid rgba(51,153,255,0.3)',
            color: '#3399ff', fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {/* ── GPS / Error notice ── */}
      {error && (
        <div style={{ background: 'rgba(255,85,85,0.08)', border: '1px solid rgba(255,85,85,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#ff5555', fontSize: 12 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '18px 20px', height: 72,
              animation: 'pulse 1.4s ease-in-out infinite',
            }}>
              <div style={{ width: '40%', height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 6, marginBottom: 8 }} />
              <div style={{ width: '60%', height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} />
            </div>
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
      )}

      {/* ── Hospital list ── */}
      {!loading && hospitals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Summary bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              {hospitals.length} hospitals/clinics found within 15 km
            </span>
            <span style={{ color: '#00cc66', fontSize: 12, fontWeight: 700 }}>
              · Nearest: {hospitals[0]?.dist.toFixed(1)} km
            </span>
          </div>

          <AnimatePresence>
            {hospitals.map((h, i) => {
              const isExp = expanded === h.id;
              const dc    = distColor(h.dist);
              return (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    background: isExp ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isExp ? dc + '40' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 14, overflow: 'hidden',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                >
                  {/* ── Card header ── */}
                  <div
                    onClick={() => setExpanded(isExp ? null : h.id)}
                    style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
                  >
                    {/* Rank badge */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: i === 0 ? 'rgba(0,204,102,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${i === 0 ? 'rgba(0,204,102,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: i === 0 ? 14 : 12,
                      color: i === 0 ? '#00cc66' : 'rgba(255,255,255,0.3)',
                      fontWeight: 900,
                    }}>
                      {i === 0 ? '★' : i + 1}
                    </div>

                    {/* Name + type */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, lineHeight: 1.3 }}>{h.name}</span>
                        {h.emergency && (
                          <span style={{ background: 'rgba(255,51,51,0.15)', border: '1px solid rgba(255,51,51,0.3)', color: '#ff5555', fontSize: 9, fontWeight: 800, padding: '1px 7px', borderRadius: 10 }}>24/7 EMERGENCY</span>
                        )}
                        <span style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 10 }}>{h.type.toUpperCase()}</span>
                      </div>
                      {h.addr && (
                        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          📍 {h.addr}
                        </div>
                      )}
                    </div>

                    {/* Distance + ETA */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                      {/* Distance pill */}
                      <div style={{
                        background: `${dc}15`, border: `1px solid ${dc}35`,
                        borderRadius: 10, padding: '5px 10px', textAlign: 'center', minWidth: 58,
                      }}>
                        <div style={{ color: dc, fontWeight: 900, fontSize: 14, lineHeight: 1 }}>
                          {h.dist.toFixed(1)} km
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, marginTop: 2 }}>distance</div>
                      </div>

                      {/* ETA pill */}
                      <div style={{
                        background: 'rgba(255,136,0,0.1)', border: '1px solid rgba(255,136,0,0.25)',
                        borderRadius: 10, padding: '5px 10px', textAlign: 'center', minWidth: 52,
                      }}>
                        <div style={{ color: '#ff8800', fontWeight: 900, fontSize: 14, lineHeight: 1 }}>
                          {formatEta(h.eta)}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, marginTop: 2 }}>ETA</div>
                      </div>

                      {/* Chevron */}
                      <motion.span
                        animate={{ rotate: isExp ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginLeft: 2 }}
                      >▼</motion.span>
                    </div>
                  </div>

                  {/* ── Expanded detail ── */}
                  <AnimatePresence>
                    {isExp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                          {/* Detail rows */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
                            {[
                              ['Distance',    `${h.dist.toFixed(2)} km`],
                              ['Est. Drive Time', formatEta(h.eta)],
                              ['Type',        h.type],
                              ['Emergency',   h.emergency ? 'Yes — 24/7' : 'Not listed'],
                              ['GPS',         `${h.lat.toFixed(5)}, ${h.lon.toFixed(5)}`],
                              ['Phone',       h.phone || 'Not available'],
                            ].map(([l, v]) => (
                              <div key={l}>
                                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>{l}</div>
                                <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, marginTop: 2 }}>{v}</div>
                              </div>
                            ))}
                          </div>

                          {/* Action buttons */}
                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            <button
                              onClick={() => {
                                // Save destination hospital for LiveJourney
                                localStorage.setItem('resq_dest_hospital', JSON.stringify({
                                  name: h.name,
                                  lat:  h.lat,
                                  lon:  h.lon,
                                  dist: h.dist,
                                  eta:  h.eta,
                                  type: h.type,
                                  phone: h.phone || null,
                                }));
                                navigate('/driver/journey');
                              }}
                              style={{
                                flex: 1, padding: '9px', borderRadius: 9,
                                background: 'rgba(51,153,255,0.1)', border: '1px solid rgba(51,153,255,0.3)',
                                color: '#3399ff', fontWeight: 700, fontSize: 12,
                                cursor: 'pointer', fontFamily: 'inherit',
                              }}
                            >
                              🗺️ Navigate
                            </button>
                            {h.phone && (
                              <a
                                href={`tel:${h.phone}`}
                                style={{
                                  flex: 1, padding: '9px', borderRadius: 9, textDecoration: 'none',
                                  background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.3)',
                                  color: '#00cc66', fontWeight: 700, fontSize: 12, textAlign: 'center',
                                }}
                              >
                                📞 Call
                              </a>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && hospitals.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, opacity: 0.1, marginBottom: 12 }}>🏥</div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>Searching for hospitals...</div>
        </div>
      )}


    </DriverLayout>
  );
}
