import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const navItems = [
  { icon: '👤', label: 'Profile',        path: '/customer/profile' },
  { icon: '🎫', label: 'My Tickets',     path: '/customer/tickets' },
  { icon: '🚑', label: 'Book Ambulance', path: '/customer/book' },
];

// Play a soft positive chime
function playConfirmSound() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.connect(ctx.destination);
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.18);
    });
  } catch (_) {}
}

export default function CustomerLayout({ children }) {
  const location = useLocation();
  const customer  = JSON.parse(localStorage.getItem('resq_user') || '{}');

  const [confirmation, setConfirmation] = useState(null); // booking:accepted payload
  const socketRef = useRef(null);

  // ── Global socket — lives for the whole customer session ──
  useEffect(() => {
    if (!customer?._id) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'], reconnection: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('customer:register', { customerId: customer._id });
    });

    // ── BOOKING ACCEPTED — show confirmation banner ──
    socket.on('booking:accepted', (data) => {
      playConfirmSound();
      setConfirmation(data);
      // Auto-dismiss after 12 seconds
      setTimeout(() => setConfirmation(null), 12000);
    });

    return () => socket.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer._id]);

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: '#05050f',
      fontFamily: "'Inter','Segoe UI',system-ui,'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif",
    }}>

      {/* ── Booking Confirmed Banner ─────────────────── */}
      <AnimatePresence>
        {confirmation && (
          <motion.div
            initial={{ opacity: 0, y: -80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -80 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            style={{
              position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
              zIndex: 9999, width: 'min(520px, 90vw)',
              background: 'linear-gradient(135deg,#021a0e,#031a10)',
              border: '1px solid rgba(0,204,102,0.45)',
              borderRadius: 20,
              boxShadow: '0 0 0 1px rgba(0,204,102,0.15), 0 24px 60px rgba(0,0,0,0.8), 0 0 40px rgba(0,204,102,0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Green top strip */}
            <div style={{ height: 4, background: 'linear-gradient(90deg,#00cc66,#00ff88,#00cc66)', backgroundSize: '200% 100%' }} />

            <div style={{ padding: '18px 22px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: 'linear-gradient(135deg,#00cc66,#009944)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, boxShadow: '0 0 20px rgba(0,204,102,0.5)',
                  }}
                >✅</motion.div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#00cc66', fontWeight: 900, fontSize: 16, lineHeight: 1.2 }}>
                    Booking Confirmed!
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                    Your ambulance is on the way
                  </div>
                </div>
                <button
                  onClick={() => setConfirmation(null)}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, width: 28, height: 28, cursor: 'pointer',
                    color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >✕</button>
              </div>

              {/* Driver details */}
              <div style={{
                background: 'rgba(0,204,102,0.06)', border: '1px solid rgba(0,204,102,0.18)',
                borderRadius: 12, padding: '12px 14px', marginBottom: 14,
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                  {[
                    ['🚑 Driver',     confirmation.driverName  || '—'],
                    ['🆔 Booking ID', (confirmation.bookingId  || '—').slice(-10)],
                    ['📞 Contact',    confirmation.driverPhone || '—'],
                    ['⏱️ ETA',        confirmation.etaMin ? `${confirmation.etaMin} min` : '—'],
                    ['🚘 Ambulance',  confirmation.ambulanceId || '—'],
                    ['📍 Status',     'En Route to You'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {label}
                      </div>
                      <div style={{ color: label === '📍 Status' ? '#00cc66' : '#fff', fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call driver button */}
              <div style={{ display: 'flex', gap: 8 }}>
                {confirmation.driverPhone && confirmation.driverPhone !== '—' && (
                  <a
                    href={`tel:${confirmation.driverPhone}`}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      padding: '10px', borderRadius: 10, textDecoration: 'none',
                      background: 'linear-gradient(135deg,#00cc66,#009944)',
                      color: '#fff', fontWeight: 800, fontSize: 13,
                      boxShadow: '0 4px 14px rgba(0,204,102,0.3)',
                    }}
                  >📞 Call Driver</a>
                )}
                <Link
                  to="/customer/tickets"
                  onClick={() => setConfirmation(null)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '10px', borderRadius: 10, textDecoration: 'none',
                    background: 'rgba(51,153,255,0.12)', border: '1px solid rgba(51,153,255,0.3)',
                    color: '#3399ff', fontWeight: 700, fontSize: 13,
                  }}
                >🎫 View Ticket</Link>
                <button
                  onClick={() => setConfirmation(null)}
                  style={{
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 12, fontFamily: 'inherit',
                  }}
                >Dismiss</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside style={{
        width: 240,
        background: 'rgba(255,255,255,0.03)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center',
          gap: 12, overflow: 'hidden',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#ff2222,#cc0000)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 0 16px rgba(255,34,34,0.4)',
          }}>🚑</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, letterSpacing: 1 }}>ResQ</div>
            <div style={{ color: '#ff3333', fontSize: 9, fontWeight: 700, letterSpacing: 2 }}>CUSTOMER</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 10px' }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path ||
              (item.path === '/customer/book' && location.pathname === '/customer');
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: 12, padding: '11px 12px',
                  borderRadius: 10, marginBottom: 4,
                  textDecoration: 'none',
                  background: active ? 'rgba(255,51,51,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(255,51,51,0.25)' : '1px solid transparent',
                  transition: 'all 0.2s',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <span style={{
                  color: active ? '#ff3333' : 'rgba(255,255,255,0.6)',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  whiteSpace: 'nowrap',
                }}>{item.label}</span>
                {active && (
                  <div style={{
                    marginLeft: 'auto', width: 6, height: 6,
                    borderRadius: '50%', background: '#ff3333',
                    boxShadow: '0 0 6px #ff3333',
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '0 10px 20px' }}>
          <Link to="/login" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 12px', borderRadius: 10,
            textDecoration: 'none',
            background: 'rgba(255,51,51,0.06)',
            border: '1px solid rgba(255,51,51,0.15)',
            transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 18 }}>🚪</span>
            <span style={{ color: 'rgba(255,100,100,0.7)', fontSize: 13, fontWeight: 500 }}>Logout</span>
          </Link>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────── */}
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
        <div style={{ padding: '32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
