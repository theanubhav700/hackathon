import { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const EMERGENCY_LABELS = {
  accident: 'Road Accident', cardiac: 'Cardiac Arrest', stroke: 'Stroke',
  breathing: 'Breathing Problem', maternity: 'Maternity', fall: 'Fall / Fracture',
  fire: 'Fire / Burn Injury', other: 'Other Emergency',
};
const EMERGENCY_COLORS = {
  accident: '#ff8800', cardiac: '#ff3333', stroke: '#aa44ff',
  breathing: '#3399ff', maternity: '#ff66aa', fall: '#ffaa00',
  fire: '#ff5500', other: '#888',
};

const navItems = [
  { icon: '📊', label: 'Dashboard', path: '/driver/dashboard' },
  { icon: '📍', label: 'Pickup Navigation', path: '/driver/navigation' },
  { icon: '👤', label: 'Patient Info', path: '/driver/patient' },
  { icon: '✅', label: 'Patient Received', path: '/driver/received' },
  { icon: '🗺️', label: 'Live Journey', path: '/driver/journey' },
  { icon: '🛣️', label: 'Route Management', path: '/driver/routes' },
  { icon: '🚦', label: 'Traffic & Alerts', path: '/driver/traffic' },
  { icon: '❤️', label: 'Patient Telemetry', path: '/driver/telemetry' },
  { icon: '🏥', label: 'Hospital Info', path: '/driver/hospital' },
  { icon: '🔔', label: 'Pre-Alert', path: '/driver/prealert' },
  { icon: '🏁', label: 'Complete Trip', path: '/driver/complete' },
  { icon: '📋', label: 'Trip History', path: '/driver/history' },
];

export default function DriverLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [accepting, setAccepting] = useState(null);
  const notifRef = useRef(null);
  const socketRef = useRef(null);

  // Read driver once from localStorage — stable across renders
  const driverRef = useRef(JSON.parse(localStorage.getItem('resq_user') || '{}'));
  const driver = driverRef.current;

  // ── Socket setup — runs once on mount ─────────────────
  useEffect(() => {
    // If no driver session, skip socket setup
    if (!driver?._id) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    // Register (and re-register on every reconnect)
    const registerDriver = () => {
      socket.emit('driver:register', {
        driverId:    driver._id,
        driverName:  driver.fullName  || 'Driver',
        ambulanceId: driver.assignedAmbulance?.vehicleId || '—',
      });
    };

    socket.on('connect', registerDriver);

    // ── Incoming booking request ──────────────────────
    socket.on('booking:request', (data) => {
      const label = EMERGENCY_LABELS[data.emergencyType] || data.emergencyType || 'Emergency';
      const color = EMERGENCY_COLORS[data.emergencyType] || '#ff3333';
      const notif = {
        id: data.bookingId,
        type: 'booking_request',
        title: '🚨 New Emergency Request',
        label,
        color,
        body: `${data.customerName} needs help`,
        data,
        time: new Date(),
        read: false,
        status: 'pending', // pending | accepted | rejected
      };
      setNotifications(prev => {
        // Deduplicate — same bookingId should not appear twice
        if (prev.some(n => n.id === data.bookingId)) return prev;
        return [notif, ...prev].slice(0, 30);
      });
      setNotifOpen(true); // auto-open bell
    });

    // ── Accept confirmed by server ────────────────────
    socket.on('booking:accept_confirmed', ({ bookingId }) => {
      setNotifications(prev => prev.map(n =>
        n.id === bookingId ? { ...n, status: 'accepted', read: true } : n
      ));
    });

    return () => {
      socket.off('connect', registerDriver);
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only — driver ref is stable

  // ── Close on outside click ────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const unread = notifications.filter(n => !n.read).length;
  const pendingRequests = notifications.filter(n => n.status === 'pending');

  // ── Accept ────────────────────────────────────────────
  const handleAccept = (notif) => {
    if (!socketRef.current?.connected) return;
    setAccepting(notif.id);

    const loc = JSON.parse(localStorage.getItem('resq_driver_location') || 'null');
    const driverLat = loc?.lat || notif.data.driverLat;
    const driverLon = loc?.lon || notif.data.driverLon;

    socketRef.current.emit('booking:accept', {
      bookingId: notif.data.bookingId,
      driverId:  driver._id,
      driverLat,
      driverLon,
    });

    // Persist booking for navigation page
    localStorage.setItem('resq_active_booking', JSON.stringify({
      bookingId:    notif.data.bookingId,
      customerLat:  notif.data.customerLat,
      customerLon:  notif.data.customerLon,
      customerName: notif.data.customerName,
      emergencyType: notif.label,
      message:      notif.data.message || '',
      driverLat,
      driverLon,
      distanceKm:   notif.data.distanceKm,
      etaMin:       notif.data.etaMin,
    }));

    setNotifications(prev => prev.map(n =>
      n.id === notif.id ? { ...n, status: 'accepted', read: true } : n
    ));
    setAccepting(null);
    setNotifOpen(false);
    navigate('/driver/navigation');
  };

  // ── Reject ────────────────────────────────────────────
  const handleReject = (notif) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('booking:reject', {
      bookingId: notif.data.bookingId,
      driverId:  driver._id,
    });
    setNotifications(prev => prev.map(n =>
      n.id === notif.id ? { ...n, status: 'rejected', read: true } : n
    ));
  };

  const handleLogout = () => {
    localStorage.removeItem('resq_token');
    localStorage.removeItem('resq_user');
    navigate('/login/driver');
  };

  const currentPage = navItems.find(n => n.path === location.pathname);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#05050f', fontFamily: "'Inter','Segoe UI',system-ui,'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif" }}>

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside style={{
        width: collapsed ? 68 : 240,
        background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s ease',
        flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto', overflowX: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? '18px 16px' : '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg,#ff8800,#cc5500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 0 16px rgba(255,136,0,0.4)' }}>🚑</div>
          {!collapsed && (
            <div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, letterSpacing: 1 }}>ResQ</div>
              <div style={{ color: '#ff8800', fontSize: 9, fontWeight: 700, letterSpacing: 2 }}>DRIVER PANEL</div>
            </div>
          )}
        </div>

        {/* Driver chip */}
        {!collapsed && (
          <div style={{ margin: '12px 10px 4px', background: 'rgba(255,136,0,0.08)', border: '1px solid rgba(255,136,0,0.18)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#ff8800,#cc5500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {driver.fullName ? driver.fullName[0].toUpperCase() : 'D'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{driver.fullName || 'Driver'}</div>
              <div style={{ color: '#ff8800', fontSize: 10, fontWeight: 600 }}>● Online</div>
            </div>
          </div>
        )}

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
                {!collapsed && <span style={{ color: active ? '#ff8800' : 'rgba(255,255,255,0.52)', fontSize: 12.5, fontWeight: active ? 700 : 500 }}>{item.label}</span>}
                {active && !collapsed && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#ff8800', boxShadow: '0 0 6px #ff8800' }} />}
              </Link>
            );
          })}
        </nav>

        {/* Collapse */}
        <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setCollapsed(c => !c)} style={{ width: '100%', padding: '9px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 14 }}>
            {collapsed ? '→' : '← Collapse'}
          </button>
        </div>

        {/* Logout */}
        <div style={{ padding: '0 8px 14px' }}>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,51,51,0.06)', border: '1px solid rgba(255,51,51,0.15)' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🚪</span>
            {!collapsed && <span style={{ color: 'rgba(255,100,100,0.7)', fontSize: 12.5, fontWeight: 500 }}>Logout</span>}
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
              {currentPage?.icon} {currentPage?.label || 'Driver Panel'}
            </span>
          </div>

          {/* ── Notification Bell ─────────────────────── */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={() => setNotifOpen(o => !o)} style={{
              position: 'relative', width: 42, height: 42, borderRadius: 11,
              background: notifOpen ? 'rgba(255,136,0,0.15)' : pendingRequests.length > 0 ? 'rgba(255,51,51,0.12)' : 'rgba(255,255,255,0.05)',
              border: notifOpen ? '1px solid rgba(255,136,0,0.4)' : pendingRequests.length > 0 ? '1px solid rgba(255,51,51,0.35)' : '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 19, transition: 'all 0.2s',
            }}>
              {pendingRequests.length > 0 ? (
                <motion.span animate={{ rotate: [-8, 8, -8, 8, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}>🔔</motion.span>
              ) : '🔔'}

              {/* Badge */}
              {pendingRequests.length > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{
                    position: 'absolute', top: -5, right: -5,
                    background: '#ff3333', color: '#fff',
                    width: 20, height: 20, borderRadius: '50%',
                    fontSize: 10, fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 10px rgba(255,51,51,0.9)',
                    animation: 'none',
                  }}>
                  {pendingRequests.length}
                </motion.div>
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
                    <div>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>🔔 Notifications</span>
                      {pendingRequests.length > 0 && (
                        <span style={{ marginLeft: 8, background: '#ff3333', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                          {pendingRequests.length} pending
                        </span>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button onClick={() => setNotifications([])} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Clear all</button>
                    )}
                  </div>

                  {/* Empty state */}
                  {notifications.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '44px 20px' }}>
                      <div style={{ fontSize: 40, opacity: 0.12, marginBottom: 10 }}>🔔</div>
                      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No notifications yet</div>
                      <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12, marginTop: 4 }}>Emergency requests will appear here</div>
                    </div>
                  )}

                  {/* Notification items */}
                  {notifications.map((n) => {
                    const isPending = n.status === 'pending';
                    const isAccepted = n.status === 'accepted';
                    const isRejected = n.status === 'rejected';
                    const timeStr = new Date(n.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                    return (
                      <motion.div key={n.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: isPending ? `${n.color}08` : 'transparent',
                          padding: '16px 20px',
                        }}>

                        {/* Title row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isPending ? n.color : isAccepted ? '#00cc66' : '#888', boxShadow: isPending ? `0 0 8px ${n.color}` : 'none', flexShrink: 0 }} />
                          <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, flex: 1 }}>{n.title}</span>
                          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>{timeStr}</span>
                        </div>

                        {/* Full details card */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${n.color}25`, borderRadius: 12, padding: '12px 14px', marginBottom: isPending ? 12 : 0 }}>
                          {/* Emergency type */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <span style={{ background: `${n.color}20`, border: `1px solid ${n.color}40`, color: n.color, fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
                              🚨 {n.label}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>#{n.data?.bookingId?.slice(-6)}</span>
                          </div>

                          {/* Details */}
                          {[
                            ['👤 Patient', n.data?.customerName || '—'],
                            ['📍 Distance', `${n.data?.distanceKm} km away`],
                            ['⏱️ ETA', `${n.data?.etaMin} min`],
                            ['📝 Notes', n.data?.message || '—'],
                          ].map(([label, val]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{label}</span>
                              <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{val}</span>
                            </div>
                          ))}
                        </div>

                        {/* Accept / Reject buttons — only for pending */}
                        {isPending && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleReject(n)} style={{
                              flex: 1, padding: '9px', borderRadius: 9, cursor: 'pointer',
                              background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.3)',
                              color: '#ff5555', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                            }}>✕ Reject</button>
                            <button onClick={() => handleAccept(n)} disabled={accepting === n.id}
                              style={{
                                flex: 2, padding: '9px', borderRadius: 9, cursor: accepting ? 'not-allowed' : 'pointer',
                                background: accepting === n.id ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#00cc66,#009944)',
                                border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: 'inherit',
                                boxShadow: accepting === n.id ? 'none' : '0 4px 14px rgba(0,204,102,0.35)',
                              }}>
                              {accepting === n.id ? '⏳ Accepting...' : '✓ Accept & Navigate'}
                            </button>
                          </div>
                        )}

                        {/* Status badge for done notifications */}
                        {(isAccepted || isRejected) && (
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: isAccepted ? 'rgba(0,204,102,0.1)' : 'rgba(120,120,120,0.1)',
                            border: `1px solid ${isAccepted ? 'rgba(0,204,102,0.3)' : 'rgba(120,120,120,0.2)'}`,
                            color: isAccepted ? '#00cc66' : '#888',
                            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginTop: 2,
                          }}>
                            {isAccepted ? '✅ Accepted — Navigating' : '✕ Rejected'}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
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
