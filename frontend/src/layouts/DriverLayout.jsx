import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const EMERGENCY_LABELS = {
  accident:  'Road Accident',
  cardiac:   'Cardiac Arrest',
  stroke:    'Brain Stroke',
  breathing: 'Breathing Issue',
  maternity: 'Maternity / Labour',
  fall:      'Fall / Fracture',
  fire:      'Burn Injury / Fire',
  other:     'General Emergency',
};

const EMERGENCY_COLORS = {
  accident: '#ff8800', cardiac: '#ff2222', stroke: '#aa44ff',
  breathing: '#00bbff', maternity: '#ff66aa', fall: '#ffaa00',
  fire: '#ff5500', other: '#888888',
};

const navItems = [
  { icon: '📊', label: 'Dashboard',          path: '/driver/dashboard' },
  { icon: '📍', label: 'Pickup Navigation',  path: '/driver/navigation' },
  { icon: '👤', label: 'Patient Info',       path: '/driver/patient' },
  { icon: '✅', label: 'Patient Received',   path: '/driver/received' },
  { icon: '❤️', label: 'Patient Telemetry',  path: '/driver/telemetry' },
  { icon: '🏥', label: 'Hospital Info',      path: '/driver/hospital' },
  { icon: '🔔', label: 'Pre-Alert',          path: '/driver/prealert' },
  { icon: '🗺️', label: 'Live Journey',       path: '/driver/journey' },
  { icon: '🛣️', label: 'Route Management',   path: '/driver/routes' },
  { icon: '🚦', label: 'Traffic & Alerts',   path: '/driver/traffic' },
  { icon: '🏁', label: 'Complete Trip',      path: '/driver/complete' },
  { icon: '📋', label: 'Trip History',       path: '/driver/history' },
];

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

export default function DriverLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('resq_driver_notifications') || '[]'); } catch { return []; }
  });
  const [accepting, setAccepting] = useState(null);
  const acceptedRef = useRef(false); // prevents any re-click across renders
  const notifRef = useRef(null);
  const socketRef = useRef(null);

  const driver = JSON.parse(localStorage.getItem('resq_user') || '{}');

  useEffect(() => {
    if (!driver?._id) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('driver:register', {
        driverId:    driver._id,
        driverName:  driver.fullName || driver.name || 'Driver',
        ambulanceId: driver.assignedAmbulance?.vehicleId || 'AMB-01',
      });
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          socket.emit('driver:location_broadcast', {
            driverId: driver._id,
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            status: 'Online',
          });
        }, () => {});
      }
    });

    // INCOMING BOOKING REQUEST (EMERGENCY NOTIFICATION)
    socket.on('booking:request', (data) => {
      console.log('DriverLayout received booking:request:', data);
      playAlertSound();

      const label = EMERGENCY_LABELS[data.emergencyType] || data.emergencyType || 'Emergency';
      const color = EMERGENCY_COLORS[data.emergencyType] || '#ff3333';

      const notif = {
        id: data.bookingId,
        type: 'New Emergency',
        title: `🚨 New Emergency: ${label}`,
        label,
        color,
        customerName: data.customerName || 'Patient',
        customerPhone: data.customerPhone || '—',
        customerLocation: data.customerLocation || 'Location detected',
        customerLat: data.customerLat,
        customerLon: data.customerLon,
        problem: data.problem || data.emergencyType,
        message: data.message || '',
        distanceKm: data.distanceKm || '2.0',
        etaMin: data.etaMin || 3,
        data,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        status: 'pending',
      };

      setNotifications(prev => {
        const filtered = prev.filter(n => n.id !== data.bookingId);
        const updated = [notif, ...filtered];
        localStorage.setItem('resq_driver_notifications', JSON.stringify(updated));
        return updated;
      });

      // Open notification dropdown & alert
      setNotifOpen(true);
      window.dispatchEvent(new CustomEvent('resq_new_notification', { detail: notif }));
    });

    socket.on('booking:accept_confirmed', ({ bookingId }) => {
      setNotifications(prev => {
        const updated = prev.map(n => n.id === bookingId ? { ...n, status: 'accepted', read: true } : n);
        localStorage.setItem('resq_driver_notifications', JSON.stringify(updated));
        return updated;
      });
    });

    return () => socket.disconnect();
  }, [driver._id]);

  const handleLogout = () => {
    localStorage.removeItem('resq_token');
    localStorage.removeItem('resq_user');
    navigate('/login/driver');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleAccept = (n) => {
    if (acceptedRef.current) return; // hard block — ref persists across renders
    acceptedRef.current = true;
    setAccepting(n.id);
    const bookingData = n.data || n;

    if (socketRef.current?.connected) {
      socketRef.current.emit('booking:accept', {
        bookingId: bookingData.bookingId || n.id,
        driverId:  driver._id,
        driverLat: bookingData.driverLat,
        driverLon: bookingData.driverLon,
      });
    }

    localStorage.setItem('resq_active_booking', JSON.stringify({
      bookingId:        bookingData.bookingId || n.id,
      customerName:     n.customerName,
      customerPhone:    n.customerPhone,
      customerLocation: n.customerLocation,
      customerLat:      n.customerLat,
      customerLon:      n.customerLon,
      emergencyType:    n.label,
      problem:          n.problem,
      message:          n.message,
      distanceKm:       n.distanceKm,
      etaMin:           n.etaMin,
    }));

    // ── Permanently save patient info ──────────────────
    const patientRecord = {
      bookingId:    bookingData.bookingId || n.id,
      name:         n.customerName     || '—',
      mobile:       n.customerPhone    || '—',
      address:      n.customerLocation || '—',
      lat:          n.customerLat      || null,
      lon:          n.customerLon      || null,
      emergencyType: n.label           || '—',
      problem:      n.problem          || n.label || '—',
      notes:        n.message          || '—',
      acceptedAt:   new Date().toISOString(),
    };
    localStorage.setItem('resq_patient_info', JSON.stringify(patientRecord));
    // Also keep history
    const history = JSON.parse(localStorage.getItem('resq_patient_history') || '[]');
    localStorage.setItem('resq_patient_history', JSON.stringify([patientRecord, ...history].slice(0, 20)));

    setNotifications(prev => {
      const updated = prev.map(item => item.id === n.id ? { ...item, status: 'accepted', read: true } : item);
      localStorage.setItem('resq_driver_notifications', JSON.stringify(updated));
      return updated;
    });

    setNotifOpen(false);
    navigate('/driver/navigation');
  };

  const handleReject = (n) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('booking:reject', {
        bookingId: n.id,
        driverId:  driver._id,
      });
    }
    setNotifications(prev => {
      const updated = prev.map(item => item.id === n.id ? { ...item, status: 'rejected', read: true } : item);
      localStorage.setItem('resq_driver_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#05050f', color: '#fff', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside style={{
        width: 240, background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto', overflowX: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg,#ff8800,#cc5500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 0 16px rgba(255,136,0,0.4)' }}>🚑</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, letterSpacing: 1 }}>ResQ</div>
            <div style={{ color: '#ff8800', fontSize: 9, fontWeight: 700, letterSpacing: 2 }}>DRIVER PANEL</div>
          </div>
        </div>

        {/* Driver chip */}
        <div style={{ margin: '12px 10px 4px', background: 'rgba(255,136,0,0.08)', border: '1px solid rgba(255,136,0,0.18)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#ff8800,#cc5500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {driver.fullName ? driver.fullName[0].toUpperCase() : 'D'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{driver.fullName || 'Driver'}</div>
            <div style={{ color: '#00cc66', fontSize: 10, fontWeight: 600 }}>● Online</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px',
                borderRadius: 10, marginBottom: 2, textDecoration: 'none',
                background: active ? 'rgba(255,136,0,0.12)' : 'transparent',
                border: active ? '1px solid rgba(255,136,0,0.28)' : '1px solid transparent',
                transition: 'all 0.2s', overflow: 'hidden', whiteSpace: 'nowrap',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ color: active ? '#ff8800' : 'rgba(255,255,255,0.52)', fontSize: 12.5, fontWeight: active ? 700 : 500 }}>{item.label}</span>
                {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#ff8800', boxShadow: '0 0 6px #ff8800' }} />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '0 8px 14px' }}>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,51,51,0.06)', border: '1px solid rgba(255,51,51,0.15)' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🚪</span>
            <span style={{ color: 'rgba(255,100,100,0.7)', fontSize: 12.5, fontWeight: 500 }}>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>

        {/* ── TOP NAVBAR ──────────────────────────────── */}
        <header style={{
          height: 60, flexShrink: 0,
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center',
          padding: '0 28px', gap: 16,
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{ flex: 1 }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
              {navItems.find(n => n.path === location.pathname)?.icon}{' '}
              {navItems.find(n => n.path === location.pathname)?.label || 'Driver Panel'}
            </span>
          </div>

          {/* ── Notification Bell ─────────────────────── */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={() => setNotifOpen(o => !o)} style={{
              position: 'relative', width: 42, height: 42, borderRadius: 11,
              background: unreadCount > 0 ? 'rgba(255,51,51,0.12)' : 'rgba(255,255,255,0.05)',
              border: unreadCount > 0 ? '1px solid rgba(255,51,51,0.35)' : '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 19, transition: 'all 0.2s', color: '#fff',
            }}>
              {unreadCount > 0 ? (
                <motion.span animate={{ rotate: [-8, 8, -8, 8, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}>🔔</motion.span>
              ) : '🔔'}
              {unreadCount > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{
                    position: 'absolute', top: -5, right: -5,
                    background: '#ff3333', color: '#fff',
                    width: 20, height: 20, borderRadius: '50%',
                    fontSize: 10, fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 10px rgba(255,51,51,0.9)',
                  }}>{unreadCount}</motion.div>
              )}
            </button>

            {/* ── Notification Dropdown ──────────────── */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    width: 380, maxHeight: 500, overflowY: 'auto',
                    background: '#0a0a1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 18,
                    boxShadow: '0 24px 70px rgba(0,0,0,0.8)',
                    zIndex: 9999,
                  }}>

                  {/* Header */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>🔔 Emergency Alerts</span>
                    {notifications.length > 0 && (
                      <button onClick={() => { setNotifications([]); localStorage.removeItem('resq_driver_notifications'); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Clear all</button>
                    )}
                  </div>

                  {/* Empty */}
                  {notifications.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '44px 20px' }}>
                      <div style={{ fontSize: 40, opacity: 0.12, marginBottom: 10 }}>🔔</div>
                      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No notifications yet</div>
                      <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12, marginTop: 4 }}>Emergency requests will appear here</div>
                    </div>
                  )}

                  {/* Notification items */}
                  {notifications.map((n) => (
                    <motion.div key={n.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: n.status === 'pending' ? `${n.color}08` : 'transparent',
                        padding: '16px 20px',
                      }}>

                      {/* Title row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.status === 'pending' ? n.color : n.status === 'accepted' ? '#00cc66' : '#888', boxShadow: n.status === 'pending' ? `0 0 8px ${n.color}` : 'none', flexShrink: 0 }} />
                        <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, flex: 1 }}>{n.title}</span>
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>{n.time}</span>
                      </div>

                      {/* Customer details */}
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${n.color}25`, borderRadius: 12, padding: '12px 14px', marginBottom: n.status === 'pending' ? 12 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {/* Name */}
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>👤 Patient</span>
                            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{n.customerName || '—'}</span>
                          </div>
                          {/* Phone */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>📞 Phone</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{n.customerPhone || '—'}</span>
                              {n.customerPhone && n.customerPhone !== '—' && (
                                <a href={`tel:${n.customerPhone}`} onClick={e => e.stopPropagation()} style={{ background: 'rgba(0,204,102,0.15)', border: '1px solid rgba(0,204,102,0.35)', color: '#00cc66', borderRadius: 14, padding: '3px 10px', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>Call</a>
                              )}
                            </div>
                          </div>
                          {/* Location */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, flexShrink: 0 }}>📍 Location</span>
                            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600, textAlign: 'right', lineHeight: 1.4 }}>{n.customerLocation || '—'}</span>
                          </div>
                          {/* Problem */}
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>🆘 Problem</span>
                            <span style={{ color: n.color, fontSize: 12, fontWeight: 700 }}>{n.label}</span>
                          </div>
                          {/* Message */}
                          {n.message && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, flexShrink: 0 }}>📝 Note</span>
                              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'right', fontStyle: 'italic' }}>{n.message}</span>
                            </div>
                          )}
                          {/* Distance + ETA */}
                          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                            <div style={{ flex: 1, background: 'rgba(51,153,255,0.08)', border: '1px solid rgba(51,153,255,0.2)', borderRadius: 8, padding: '5px 8px', textAlign: 'center' }}>
                              <div style={{ color: '#3399ff', fontWeight: 800, fontSize: 13 }}>{n.distanceKm} km</div>
                              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>Distance</div>
                            </div>
                            <div style={{ flex: 1, background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.2)', borderRadius: 8, padding: '5px 8px', textAlign: 'center' }}>
                              <div style={{ color: '#ffaa00', fontWeight: 800, fontSize: 13 }}>{n.etaMin} min</div>
                              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>ETA</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Accept / Reject */}
                      {n.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleReject(n)} style={{ flex: 1, padding: '9px', borderRadius: 9, cursor: 'pointer', background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.3)', color: '#ff5555', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>✕ Reject</button>
                          <button onClick={() => handleAccept(n)} disabled={accepting === n.id} style={{ flex: 2, padding: '9px', borderRadius: 9, cursor: accepting ? 'not-allowed' : 'pointer', background: accepting === n.id ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#00cc66,#009944)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: 'inherit', boxShadow: accepting === n.id ? 'none' : '0 4px 14px rgba(0,204,102,0.35)' }}>
                            {accepting === n.id ? '⏳ Accepting...' : '✓ Accept & Navigate'}
                          </button>
                        </div>
                      )}

                      {/* Status badge */}
                      {(n.status === 'accepted' || n.status === 'rejected') && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: n.status === 'accepted' ? 'rgba(0,204,102,0.1)' : 'rgba(120,120,120,0.1)', border: `1px solid ${n.status === 'accepted' ? 'rgba(0,204,102,0.3)' : 'rgba(120,120,120,0.2)'}`, color: n.status === 'accepted' ? '#00cc66' : '#888', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                          {n.status === 'accepted' ? '✅ Accepted — Navigating' : '✕ Rejected'}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* ── Page content ─────────────────────────────── */}
        <main style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ padding: '28px 32px' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
