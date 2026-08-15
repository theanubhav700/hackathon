import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import DriverLayout from '../../layouts/DriverLayout';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

export default function DriverDashboard() {
  const driver = JSON.parse(localStorage.getItem('resq_user') || '{}');

  const [status, setStatus]         = useState('Online');
  const [time, setTime]             = useState(new Date());
  const [location, setLocation]     = useState(null);   // { lat, lon, address }
  const [locStatus, setLocStatus]   = useState('idle'); // idle | fetching | active | denied
  const [socketConn, setSocketConn] = useState(false);
  const [toast, setToast]           = useState(null);

  const socketRef  = useRef(null);
  const watchIdRef = useRef(null);
  const statusRef  = useRef(status); // always current, safe inside watchPosition callback
  useEffect(() => { statusRef.current = status; }, [status]);

  // ── Clock ──────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Toast helper ───────────────────────────────────────
  const showToast = (msg, color = '#ff8800') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Socket.io connect on mount ─────────────────────────
  useEffect(() => {
    if (!driver?._id) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    const registerDriver = () => {
      setSocketConn(true);
      socket.emit('driver:register', {
        driverId:    driver._id,
        driverName:  driver.fullName || 'Driver',
        ambulanceId: driver.assignedAmbulance?.vehicleId || '—',
      });
    };

    socket.on('connect',    registerDriver);
    socket.on('disconnect', () => setSocketConn(false));
    socket.on('reconnect',  registerDriver);

    return () => {
      socket.off('connect',    registerDriver);
      socket.off('reconnect',  registerDriver);
      socket.disconnect();
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Request GPS + stream to server ────────────────────
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      showToast('❌ GPS not supported on this device', '#ff3333');
      return;
    }

    setLocStatus('fetching');
    showToast('📡 Requesting GPS permission...', '#3399ff');

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon, accuracy } = pos.coords;

        // Reverse geocode for address
        let address = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const data = await res.json();
          address = data.address?.road
            ? `${data.address.road}, ${data.address.suburb || data.address.city || ''}`
            : data.display_name?.split(',').slice(0, 2).join(',') || address;
        } catch {}

        setLocation({ lat, lon, address, accuracy: Math.round(accuracy) });
        setLocStatus('active');

        // Emit live GPS to socket server — always use latest status via ref
        if (socketRef.current?.connected) {
          socketRef.current.emit('driver:location_broadcast', {
            driverId:    driver._id,
            driverName:  driver.fullName || 'Driver',
            ambulanceId: driver.assignedAmbulance?.vehicleId || '—',
            lat, lon,
            status: statusRef.current,
          });
          // Keep resq_driver_location in sync for accept payload fallback
          localStorage.setItem('resq_driver_location', JSON.stringify({ lat, lon }));
        }
      },
      (err) => {
        setLocStatus('denied');
        if (err.code === 1) {
          showToast('❌ GPS permission denied. Please allow location access.', '#ff3333');
        } else {
          showToast('⚠️ Could not get GPS signal. Try again.', '#ffaa00');
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLocStatus('idle');
    setLocation(null);
    showToast('📍 Location tracking stopped', '#888');
  };

  // ── Status toggle ─────────────────────────────────────
  const handleStatusChange = (s) => {
    setStatus(s);
    if (socketRef.current?.connected) {
      socketRef.current.emit('driver:status_update', { driverId: driver._id, status: s });
    }
    if (s === 'Offline' && locStatus === 'active') stopLocationTracking();
  };

  const statusColors = {
    Online:  { bg: 'rgba(0,204,102,0.15)',   border: 'rgba(0,204,102,0.4)',   fg: '#00cc66' },
    Busy:    { bg: 'rgba(255,136,0,0.15)',   border: 'rgba(255,136,0,0.4)',   fg: '#ff8800' },
    Offline: { bg: 'rgba(120,120,120,0.12)', border: 'rgba(120,120,120,0.3)', fg: '#888'    },
  };
  const sc = statusColors[status];

  const stats = [
    { icon: '🚨', label: 'Active Emergency', value: 'None',   color: '#ff3333', link: '/driver/requests' },
    { icon: '🚑', label: 'Ambulance ID',     value: driver.assignedAmbulance?.vehicleId || '—', color: '#3399ff', link: null },
    { icon: '⏱️', label: 'Current Trip ETA', value: '— min', color: '#ff8800', link: '/driver/journey' },
    { icon: '✅', label: "Today's Trips",    value: '0',      color: '#00cc66', link: '/driver/history' },
  ];

  return (
    <DriverLayout>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            style={{
              position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
              zIndex: 9999, background: toast.color, color: '#fff',
              padding: '11px 26px', borderRadius: 30, fontWeight: 700, fontSize: 13,
              boxShadow: `0 8px 28px ${toast.color}88`,
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>📊 Driver Dashboard</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
            Welcome, <span style={{ color: '#ff8800', fontWeight: 700 }}>{driver.fullName || 'Driver'}</span>
            <span style={{ marginLeft: 16, color: 'rgba(255,255,255,0.2)' }}>
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            {/* Socket indicator */}
            <span style={{ marginLeft: 14, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: socketConn ? '#00cc66' : '#ff3333', display: 'inline-block', boxShadow: socketConn ? '0 0 6px #00cc66' : 'none' }} />
              <span style={{ fontSize: 11, color: socketConn ? '#00cc66' : '#ff5555' }}>{socketConn ? 'Connected' : 'Disconnected'}</span>
            </span>
          </p>
        </div>

        {/* Status toggle */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['Online', 'Busy', 'Offline'].map(s => (
            <button key={s} onClick={() => handleStatusChange(s)} style={{
              padding: '8px 18px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: status === s ? statusColors[s].bg : 'rgba(255,255,255,0.04)',
              border: status === s ? `1px solid ${statusColors[s].border}` : '1px solid rgba(255,255,255,0.08)',
              color: status === s ? statusColors[s].fg : 'rgba(255,255,255,0.3)',
              transition: 'all 0.2s',
            }}>{s === 'Online' ? '🟢' : s === 'Busy' ? '🟡' : '⚫'} {s}</button>
          ))}
        </div>
      </div>

      {/* ── Location Banner ──────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: locStatus === 'active' ? 'rgba(0,204,102,0.08)' : locStatus === 'denied' ? 'rgba(255,51,51,0.08)' : sc.bg,
          border: `1px solid ${locStatus === 'active' ? 'rgba(0,204,102,0.3)' : locStatus === 'denied' ? 'rgba(255,51,51,0.3)' : sc.border}`,
          borderRadius: 14, padding: '16px 22px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}>

        {/* Status dot */}
        <motion.div
          animate={locStatus === 'active' ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: locStatus === 'active' ? '#00cc66' : locStatus === 'denied' ? '#ff3333' : sc.fg,
            boxShadow: locStatus === 'active' ? '0 0 10px #00cc66' : 'none',
          }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: locStatus === 'active' ? '#00cc66' : '#fff', fontWeight: 800, fontSize: 14 }}>
            {locStatus === 'active'   ? '📍 GPS Active — Broadcasting Location'
           : locStatus === 'fetching' ? '⏳ Getting GPS...'
           : locStatus === 'denied'   ? '❌ GPS Permission Denied'
           : `Status: ${status}`}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {locStatus === 'active' && location
              ? `📌 ${location.address} · ±${location.accuracy}m · ${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}`
              : locStatus === 'denied'
              ? 'Allow location in browser settings and try again'
              : 'Click "Share Location" to start broadcasting your GPS'}
          </div>
        </div>

        {/* CTA button */}
        {locStatus === 'active' ? (
          <button onClick={stopLocationTracking} style={{
            padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
            background: 'rgba(255,60,60,0.12)', border: '1px solid rgba(255,60,60,0.3)', color: '#ff5555',
            flexShrink: 0,
          }}>⏹ Stop</button>
        ) : (
          <button onClick={startLocationTracking} disabled={locStatus === 'fetching' || status === 'Offline'} style={{
            padding: '9px 20px', borderRadius: 10, cursor: locStatus === 'fetching' || status === 'Offline' ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 13, flexShrink: 0,
            background: status === 'Offline' ? 'rgba(255,255,255,0.04)' : locStatus === 'fetching' ? 'rgba(51,153,255,0.1)' : 'linear-gradient(135deg,#00cc66,#009944)',
            border: status === 'Offline' ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
            color: status === 'Offline' ? 'rgba(255,255,255,0.2)' : '#fff',
            boxShadow: status === 'Offline' ? 'none' : '0 4px 16px rgba(0,204,102,0.35)',
          }}>
            {locStatus === 'fetching' ? '⏳ Getting GPS...' : status === 'Offline' ? '⚫ Go Online First' : '📍 Share Location'}
          </button>
        )}
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            {s.link ? (
              <Link to={s.link} style={{ textDecoration: 'none', display: 'block' }}>
                <StatCard s={s} />
              </Link>
            ) : <StatCard s={s} />}
          </motion.div>
        ))}
      </div>

      {/* Quick actions + active emergency */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 15, margin: '0 0 16px' }}>⚡ Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '🚨', label: 'View Emergency Requests', path: '/driver/requests', color: '#ff3333' },
              { icon: '📍', label: 'Start Navigation',        path: '/driver/navigation', color: '#ff8800' },
              { icon: '❤️', label: 'Patient Telemetry',       path: '/driver/telemetry',  color: '#ff4466' },
              { icon: '📋', label: 'Trip History',            path: '/driver/history',    color: '#3399ff' },
            ].map(q => (
              <Link key={q.path} to={q.path} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                borderRadius: 11, textDecoration: 'none',
                background: `${q.color}0d`, border: `1px solid ${q.color}22`, transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = `${q.color}1a`}
                onMouseLeave={e => e.currentTarget.style.background = `${q.color}0d`}
              >
                <span style={{ fontSize: 17 }}>{q.icon}</span>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{q.label}</span>
                <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Location card */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 15, margin: '0 0 16px' }}>📍 Current Location</h3>
          {locStatus === 'active' && location ? (
            <div>
              <div style={{ display: 'flex', flex: 'column', gap: 10 }}>
                {[
                  ['Latitude',  location.lat.toFixed(6)],
                  ['Longitude', location.lon.toFixed(6)],
                  ['Accuracy',  `±${location.accuracy} m`],
                  ['Address',   location.address],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{label}</span>
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{val}</span>
                  </div>
                ))}
              </div>
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, color: '#00cc66', fontSize: 12, fontWeight: 700 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00cc66', boxShadow: '0 0 8px #00cc66', display: 'inline-block' }} />
                Broadcasting to server
              </motion.div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: 40, opacity: 0.12, marginBottom: 12 }}>📍</div>
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                {locStatus === 'denied' ? 'GPS access denied' : 'Location not sharing'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.12)', fontSize: 12, marginTop: 5 }}>
                Click "Share Location" above to start
              </div>
            </div>
          )}
        </div>
      </div>
    </DriverLayout>
  );
}

function StatCard({ s }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.color}22`,
      borderRadius: 14, padding: '20px 22px',
    }}>
      <div style={{ fontSize: 24, marginBottom: 10 }}>{s.icon}</div>
      <div style={{ color: s.color, fontWeight: 900, fontSize: 22, marginBottom: 4 }}>{s.value}</div>
      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>{s.label}</div>
    </div>
  );
}
