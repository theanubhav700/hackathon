import { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import {
  MapContainer, TileLayer, Marker, Popup,
  Polyline, useMap, ZoomControl, Circle,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DriverLayout from '../../layouts/DriverLayout';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const ORS_KEY = import.meta.env.VITE_ORS_KEY;

// ── Icons ────────────────────────────────────────────────
function makeIcons() {
  const ambulanceIcon = new L.DivIcon({
    html: `<div style="background:linear-gradient(135deg,#ff8800,#cc5500);border:3px solid #fff;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 0 22px rgba(255,136,0,1);">🚑</div>
           <div style="position:absolute;top:-7px;left:50%;transform:translateX(-50%);background:#ff8800;color:#fff;font-size:9px;font-weight:900;padding:2px 7px;border-radius:8px;white-space:nowrap;">AMBULANCE</div>`,
    className: '', iconSize: [44, 44], iconAnchor: [22, 22],
  });
  const hospitalIcon = new L.DivIcon({
    html: `<div style="background:linear-gradient(135deg,#00cc66,#009944);border:3px solid #fff;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 0 22px rgba(0,204,102,1);">🏥</div>
           <div style="position:absolute;top:-7px;left:50%;transform:translateX(-50%);background:#00cc66;color:#fff;font-size:9px;font-weight:900;padding:2px 7px;border-radius:8px;white-space:nowrap;">HOSPITAL</div>`,
    className: '', iconSize: [44, 44], iconAnchor: [22, 44],
  });
  return { ambulanceIcon, hospitalIcon };
}

function signalIcon(state) {
  const colors = { green: '#00cc66', yellow: '#ffcc00', red: '#ff3333' };
  const glow   = { green: 'rgba(0,204,102,0.8)', yellow: 'rgba(255,204,0,0.8)', red: 'rgba(255,51,51,0.8)' };
  const c = colors[state] || '#ff3333';
  const g = glow[state]   || 'rgba(255,51,51,0.8)';
  return new L.DivIcon({
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${c};border:3px solid #fff;
      box-shadow:0 0 16px ${g},0 0 6px rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;
      font-size:13px;
    ">🚦</div>`,
    className: '', iconSize: [28, 28], iconAnchor: [14, 14],
  });
}

// ── Fit bounds ───────────────────────────────────────────
function FitBounds({ from, to }) {
  const map  = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (from && to && !done.current) {
      map.fitBounds([from, to], { padding: [80, 80], animate: true, duration: 1.2 });
      done.current = true;
    }
  }, [from, to]);
  return null;
}

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

function formatDur(sec) {
  if (!sec) return '—';
  const m = Math.round(sec / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

async function fetchORSRoute(fromLat, fromLon, toLat, toLon) {
  const res = await fetch(
    'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
    {
      method: 'POST',
      headers: { Authorization: ORS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates: [[fromLon, fromLat], [toLon, toLat]] }),
    }
  );
  if (!res.ok) throw new Error('ORS error');
  const data = await res.json();
  const feat = data.features[0];
  return {
    coords:      feat.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    distanceKm:  (feat.properties.summary.distance / 1000).toFixed(2),
    durationSec: feat.properties.summary.duration,
  };
}

const SIGNAL_COLORS = { green: '#00cc66', yellow: '#ffcc00', red: '#ff3333' };

export default function GreenCorridor() {
  const driver      = JSON.parse(localStorage.getItem('resq_user') || '{}');
  const booking     = JSON.parse(localStorage.getItem('resq_active_booking') || 'null');
  const destHosp    = JSON.parse(localStorage.getItem('resq_dest_hospital')  || 'null');

  const [driverPos,    setDriverPos]    = useState(() => {
    const s = JSON.parse(localStorage.getItem('resq_driver_location') || 'null');
    return s ? [s.lat, s.lon] : null;
  });
  const [hospitalPos,  setHospitalPos]  = useState(() =>
    destHosp?.lat ? [parseFloat(destHosp.lat), parseFloat(destHosp.lon)] : null
  );
  const [routeCoords,  setRouteCoords]  = useState([]);
  const [distanceKm,   setDistanceKm]   = useState(null);
  const [durationSec,  setDurationSec]  = useState(null);
  const [signals,      setSignals]      = useState([]);
  const [corridorId,   setCorridorId]   = useState(null);
  const [corridorActive, setCorridorActive] = useState(false);
  const [activating,   setActivating]   = useState(false);
  const [greenCount,   setGreenCount]   = useState(0);
  const [socketConn,   setSocketConn]   = useState(false);
  const [log,          setLog]          = useState([]);

  const socketRef    = useRef(null);
  const watchRef     = useRef(null);
  const routeFetched = useRef(false);

  const { ambulanceIcon, hospitalIcon } = useMemo(() => makeIcons(), []);
  const signalIcons = useMemo(() => ({
    green:  signalIcon('green'),
    yellow: signalIcon('yellow'),
    red:    signalIcon('red'),
  }), []);

  const addLog = (msg, color = '#fff') => {
    setLog(prev => [{ msg, color, t: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
  };

  // ── Socket ─────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConn(true);
      socket.emit('driver:register', { driverId: driver._id, driverName: driver.fullName });
    });
    socket.on('disconnect', () => setSocketConn(false));

    socket.on('corridor:activated', ({ corridorId: cId, signals: sigs }) => {
      setCorridorId(cId);
      setSignals(sigs);
      setCorridorActive(true);
      setActivating(false);
      localStorage.setItem('resq_corridor_signal_count', String(sigs?.length || 0));
      addLog('🟢 Green Corridor ACTIVATED', '#00cc66');
    });

    socket.on('corridor:signals_update', ({ signals: sigs, ambLat, ambLon }) => {
      setSignals(sigs);
      const gc = sigs.filter(s => s.state === 'green').length;
      setGreenCount(gc);
      localStorage.setItem('resq_corridor_signal_count', String(sigs?.length || 0));
      if (gc > 0) addLog(`🚦 ${gc} signal(s) turned GREEN`, '#00cc66');
    });

    return () => socket.disconnect();
  }, []);

  // ── GPS watch ─────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      ({ coords: { latitude: lat, longitude: lon } }) => {
        setDriverPos([lat, lon]);
        localStorage.setItem('resq_driver_location', JSON.stringify({ lat, lon }));
        socketRef.current?.emit('driver:location_broadcast', {
          driverId: driver._id, lat, lon, status: 'Busy',
        });
        // Update corridor signals
        if (corridorId && corridorActive) {
          socketRef.current?.emit('corridor:location_update', { corridorId, lat, lon });
        }
        // Live distance
        if (hospitalPos) {
          const d = haversineKm(lat, lon, hospitalPos[0], hospitalPos[1]);
          setDistanceKm(d.toFixed(2));
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchRef.current);
  }, [corridorId, corridorActive, hospitalPos]);

  // ── ORS route ─────────────────────────────────────────
  useEffect(() => {
    if (!driverPos || !hospitalPos || routeFetched.current) return;
    routeFetched.current = true;
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
      });
  }, [driverPos, hospitalPos]);

  // ── Activate corridor ─────────────────────────────────
  const handleActivate = () => {
    if (!driverPos || !hospitalPos) return;
    setActivating(true);
    addLog('⏳ Activating Green Corridor...', '#ffaa00');
    socketRef.current?.emit('corridor:activate', {
      bookingId: booking?.bookingId || `BK-${Date.now()}`,
      driverId:  driver._id,
      fromLat:   driverPos[0],
      fromLon:   driverPos[1],
      toLat:     hospitalPos[0],
      toLon:     hospitalPos[1],
    });
  };

  const handleDeactivate = () => {
    if (corridorId) {
      socketRef.current?.emit('corridor:deactivate', { corridorId });
      setCorridorActive(false);
      setSignals([]);
      setCorridorId(null);
      addLog('🔴 Green Corridor deactivated', '#ff5555');
    }
  };

  const mapCenter = driverPos || hospitalPos || [28.5355, 77.3910];

  const greenSignals  = signals.filter(s => s.state === 'green').length;
  const yellowSignals = signals.filter(s => s.state === 'yellow').length;
  const redSignals    = signals.filter(s => s.state === 'red').length;

  return (
    <DriverLayout>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 22, margin: '0 0 4px' }}>
            🚦 Green Corridor
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
            Auto traffic signal management — ambulance gets green all the way
            <span style={{ marginLeft: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: socketConn ? '#00cc66' : '#ff3333', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: socketConn ? '#00cc66' : '#ff5555' }}>{socketConn ? 'Connected' : 'Connecting...'}</span>
            </span>
          </p>
        </div>

        {/* Activate / Deactivate button */}
        {!corridorActive ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleActivate}
            disabled={activating || !driverPos || !hospitalPos}
            style={{
              padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: activating ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#00cc66,#009944)',
              color: activating ? 'rgba(255,255,255,0.4)' : '#fff',
              fontWeight: 900, fontSize: 13, fontFamily: 'inherit',
              boxShadow: activating ? 'none' : '0 6px 20px rgba(0,204,102,0.4)',
            }}
          >
            {activating ? '⏳ Activating...' : !hospitalPos ? '⚠️ Select Hospital First' : '🚦 Activate Green Corridor'}
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleDeactivate}
            style={{
              padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'rgba(255,51,51,0.15)', border: '1px solid rgba(255,51,51,0.4)',
              color: '#ff5555', fontWeight: 900, fontSize: 13, fontFamily: 'inherit',
            }}
          >
            🔴 Deactivate Corridor
          </motion.button>
        )}
      </div>

      {/* ── Stats row ── */}
      {corridorActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}
        >
          {[
            { label: 'Green Signals',  value: greenSignals,          color: '#00cc66', bg: 'rgba(0,204,102,0.1)',   border: 'rgba(0,204,102,0.3)' },
            { label: 'Yellow Signals', value: yellowSignals,         color: '#ffcc00', bg: 'rgba(255,204,0,0.1)',   border: 'rgba(255,204,0,0.3)' },
            { label: 'Red Signals',    value: redSignals,            color: '#ff5555', bg: 'rgba(255,85,85,0.1)',   border: 'rgba(255,85,85,0.3)' },
            { label: 'ETA',            value: formatDur(durationSec),color: '#ff8800', bg: 'rgba(255,136,0,0.1)',   border: 'rgba(255,136,0,0.3)' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ color: s.color, fontWeight: 900, fontSize: 22, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>

        {/* ── MAP ── */}
        <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${corridorActive ? 'rgba(0,204,102,0.4)' : 'rgba(255,136,0,0.2)'}`, position: 'relative', boxShadow: corridorActive ? '0 0 40px rgba(0,204,102,0.15)' : '0 0 20px rgba(255,136,0,0.06)' }}>

          {/* Status badge */}
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 1000,
            background: corridorActive ? 'rgba(0,30,10,0.85)' : 'rgba(10,10,30,0.85)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${corridorActive ? 'rgba(0,204,102,0.5)' : 'rgba(255,136,0,0.3)'}`,
            color: '#fff', fontSize: 10, fontWeight: 800,
            padding: '5px 13px', borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <motion.span
              animate={corridorActive ? { opacity: [1, 0.2, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: '50%', background: corridorActive ? '#00cc66' : '#ff8800', display: 'inline-block', boxShadow: corridorActive ? '0 0 8px #00cc66' : 'none' }}
            />
            {corridorActive ? '🟢 GREEN CORRIDOR ACTIVE' : '🧭 ROUTE PREVIEW'}
          </div>

          {/* Distance badge */}
          {distanceKm && (
            <div style={{
              position: 'absolute', top: 12, right: 12, zIndex: 1000,
              background: 'rgba(10,10,30,0.85)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,136,0,0.3)',
              borderRadius: 12, padding: '8px 14px', textAlign: 'center',
            }}>
              <div style={{ color: '#ff8800', fontWeight: 900, fontSize: 18, lineHeight: 1 }}>{distanceKm} km</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: 2 }}>{formatDur(durationSec)}</div>
            </div>
          )}

          <MapContainer center={mapCenter} zoom={14} style={{ height: 500, width: '100%' }} zoomControl={false} scrollWheelZoom>
            <ZoomControl position="bottomright" />

            {/* Satellite */}
            <TileLayer
              attribution='Tiles &copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            <TileLayer
              attribution=""
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19} opacity={0.6}
            />

            {/* Route */}
            {routeCoords.length > 1 && (
              <>
                <Polyline positions={routeCoords} color="rgba(0,0,0,0.3)" weight={10} opacity={0.5} />
                <Polyline positions={routeCoords} color={corridorActive ? '#00cc66' : '#ff8800'} weight={5} opacity={0.95} />
              </>
            )}

            {/* Green radius circle around ambulance */}
            {corridorActive && driverPos && (
              <Circle center={driverPos} radius={400} pathOptions={{ color: '#00cc66', fillColor: '#00cc66', fillOpacity: 0.06, weight: 1.5, dashArray: '6,6' }} />
            )}

            {/* Traffic signals */}
            {signals.map(sig => (
              <Marker key={sig.id} position={[sig.lat, sig.lon]} icon={signalIcons[sig.state] || signalIcons.red}>
                <Popup>
                  <div style={{ fontFamily: 'sans-serif', fontSize: 12, textAlign: 'center' }}>
                    <strong>Traffic Signal</strong><br />
                    State: <span style={{ color: SIGNAL_COLORS[sig.state], fontWeight: 700 }}>{sig.state?.toUpperCase()}</span>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Driver */}
            {driverPos && (
              <Marker position={driverPos} icon={ambulanceIcon}>
                <Popup><strong>🚑 {driver.fullName || 'You'}</strong></Popup>
              </Marker>
            )}

            {/* Hospital */}
            {hospitalPos && (
              <Marker position={hospitalPos} icon={hospitalIcon}>
                <Popup><strong>🏥 {destHosp?.name || 'Destination'}</strong></Popup>
              </Marker>
            )}

            <FitBounds from={driverPos} to={hospitalPos} />
          </MapContainer>
        </div>

        {/* ── Side panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Corridor status */}
          <div style={{
            background: corridorActive ? 'rgba(0,204,102,0.08)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${corridorActive ? 'rgba(0,204,102,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 14, padding: '14px 16px',
          }}>
            <div style={{ color: corridorActive ? '#00cc66' : 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              🚦 Corridor Status
            </div>
            {[
              ['Status',    corridorActive ? 'ACTIVE' : 'INACTIVE', corridorActive ? '#00cc66' : '#888'],
              ['Signals',   `${signals.length} total`, '#fff'],
              ['Distance',  distanceKm ? `${distanceKm} km` : '—', '#3399ff'],
              ['Hospital',  destHosp?.name?.substring(0, 22) || 'Not set', '#ffaa00'],
            ].map(([l, v, c]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{l}</span>
                <span style={{ color: c || '#fff', fontSize: 11, fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Signal legend */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>Signal States</div>
            {[
              { state: 'green',  label: 'Green — Clear path',     color: '#00cc66', desc: 'Within 400m' },
              { state: 'yellow', label: 'Yellow — Prepare',       color: '#ffcc00', desc: 'Within 800m' },
              { state: 'red',    label: 'Red — Normal traffic',   color: '#ff5555', desc: '>800m away' },
            ].map(s => (
              <div key={s.state} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}`, flexShrink: 0 }} />
                <div>
                  <div style={{ color: s.color, fontSize: 11, fontWeight: 700 }}>{s.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Live activity log */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>Live Log</div>
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {log.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, textAlign: 'center', padding: '20px 0' }}>No events yet</div>
              ) : log.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, flexShrink: 0, marginTop: 2 }}>{l.t}</span>
                  <span style={{ color: l.color, fontSize: 11 }}>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>

          {/* GPS status */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div
              animate={driverPos ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: '50%', background: driverPos ? '#00cc66' : '#888', boxShadow: driverPos ? '0 0 8px #00cc66' : 'none', flexShrink: 0 }}
            />
            <div>
              <div style={{ color: driverPos ? '#00cc66' : 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700 }}>
                {driverPos ? 'GPS Active' : 'Getting GPS...'}
              </div>
              {driverPos && (
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>
                  {driverPos[0].toFixed(4)}, {driverPos[1].toFixed(4)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DriverLayout>
  );
}
