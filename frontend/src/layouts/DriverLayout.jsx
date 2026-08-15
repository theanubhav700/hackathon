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
  { icon: '🚨', label: 'Emergency Requests', path: '/driver/requests' },
  { icon: '🔔', label: 'Notifications',      path: '/driver/notifications' },
  { icon: '📍', label: 'Pickup Navigation',  path: '/driver/navigation' },
  { icon: '👤', label: 'Patient Info',       path: '/driver/patient' },
  { icon: '🏥', label: 'Hospital Info',      path: '/driver/hospital' },
  { icon: '🗺️', label: 'Live Journey',       path: '/driver/journey' },
  { icon: '📜', label: 'Trip History',       path: '/driver/history' },
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleAccept = (n) => {
    const bookingData = n.data || n;
    setAccepting(n.id);

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

    setNotifications(prev => {
      const updated = prev.map(item => item.id === n.id ? { ...item, status: 'accepted', read: true } : item);
      localStorage.setItem('resq_driver_notifications', JSON.stringify(updated));
      return updated;
    });

    setAccepting(null);
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070714', color: '#fff', fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: '#0a0a1a', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#ff8800,#cc5500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🚑</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>ResQ Driver</div>
            <div style={{ color: '#00cc66', fontSize: 11, fontWeight: 700 }}>● Online & Active</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path} to={item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12,
                  textDecoration: 'none', color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                  background: active ? 'rgba(255,136,0,0.15)' : 'transparent',
                  border: active ? '1px solid rgba(255,136,0,0.3)' : '1px solid transparent',
                  fontWeight: active ? 700 : 500, fontSize: 13,
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#ff3333', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10 }}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{driver.fullName || 'Driver'}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{driver.email}</div>
        </div>
      </aside>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Navbar */}
        <header style={{ height: 64, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Portal /</span>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Driver Dashboard</span>
          </div>

          {/* Notification Bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              style={{
                position: 'relative', width: 40, height: 40, borderRadius: 12,
                background: unreadCount > 0 ? 'rgba(255,51,51,0.15)' : 'rgba(255,255,255,0.05)',
                border: unreadCount > 0 ? '1px solid rgba(255,51,51,0.4)' : '1px solid rgba(255,255,255,0.1)',
                color: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4, background: '#ff3333',
                  color: '#fff', width: 18, height: 18, borderRadius: '50%',
                  fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{unreadCount}</span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 380,
                    background: '#0d0d1e', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 18, padding: '16px', zIndex: 1000,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255,51,51,0.15)',
                    maxHeight: 480, overflowY: 'auto',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>Emergency Alerts</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{notifications.length} Total</span>
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                      No notifications yet
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {notifications.map(n => (
                        <div
                          key={n.id}
                          style={{
                            background: n.status === 'pending' ? 'rgba(255,51,51,0.08)' : 'rgba(255,255,255,0.03)',
                            border: n.status === 'pending' ? '1px solid rgba(255,51,51,0.3)' : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 14, padding: '14px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ color: n.color || '#ff4444', fontWeight: 800, fontSize: 13 }}>{n.title}</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{n.time}</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, marginBottom: 10 }}>
                            <div>👤 <strong>Patient:</strong> {n.customerName}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span>📞 <strong>Phone:</strong> {n.customerPhone}</span>
                              {n.customerPhone && n.customerPhone !== '—' && (
                                <a href={`tel:${n.customerPhone}`} style={{ background: 'rgba(0,204,102,0.2)', color: '#00cc66', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>Call</a>
                              )}
                            </div>
                            <div>📍 <strong>Location:</strong> {n.customerLocation}</div>
                            {n.message && <div>📝 <strong>Problem:</strong> {n.message}</div>}
                          </div>

                          {n.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => handleReject(n)} style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.3)', color: '#ff5555', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Decline</button>
                              <button onClick={() => handleAccept(n)} disabled={accepting === n.id} style={{ flex: 2, padding: '7px', borderRadius: 8, background: 'linear-gradient(135deg,#00cc66,#009944)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 800 }}>Accept & Go</button>
                            </div>
                          ) : (
                            <div style={{ color: n.status === 'accepted' ? '#00cc66' : '#888', fontSize: 11, fontWeight: 700 }}>
                              ● {n.status === 'accepted' ? 'Accepted & Active' : 'Declined'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
