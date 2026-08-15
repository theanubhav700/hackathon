import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import DriverLayout from '../../layouts/DriverLayout';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const driver = JSON.parse(localStorage.getItem('resq_user') || '{}');

  const [status, setStatus]         = useState('Online');
  const [time, setTime]             = useState(new Date());
  const [socketConn, setSocketConn] = useState(false);
  const [toast, setToast]           = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);

  const socketRef  = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const showToast = (msg, color = '#ff8800') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!driver?._id) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConn(true);
      socket.emit('driver:register', {
        driverId:    driver._id,
        driverName:  driver.fullName || driver.name || 'Driver',
        ambulanceId: driver.assignedAmbulance?.vehicleId || 'AMB-01',
      });
    });

    socket.on('disconnect', () => setSocketConn(false));

    socket.on('booking:request', (data) => {
      setActiveRequest(data);
      showToast('🚨 New Emergency Request Received!', '#ff3333');
    });

    return () => socket.disconnect();
  }, [driver._id]);

  const handleAcceptRequest = (req) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('booking:accept', {
        bookingId: req.bookingId,
        driverId: driver._id,
      });
    }
    localStorage.setItem('resq_active_booking', JSON.stringify(req));
    setActiveRequest(null);
    navigate('/driver/navigation');
  };

  const statusColors = {
    Online:  { bg: 'rgba(0,204,102,0.15)',   border: 'rgba(0,204,102,0.4)',   fg: '#00cc66' },
    Busy:    { bg: 'rgba(255,136,0,0.15)',   border: 'rgba(255,136,0,0.4)',   fg: '#ff8800' },
    Offline: { bg: 'rgba(120,120,120,0.12)', border: 'rgba(120,120,120,0.3)', fg: '#888'    },
  };

  return (
    <DriverLayout>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            style={{
              position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
              zIndex: 9999, background: toast.color, color: '#fff',
              padding: '11px 26px', borderRadius: 30, fontWeight: 700, fontSize: 13,
              boxShadow: '0 8px 28px rgba(0,0,0,0.5)',
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>Driver Dashboard</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
            Welcome, <span style={{ color: '#ff8800', fontWeight: 700 }}>{driver.fullName || 'Driver'}</span>
            <span style={{ marginLeft: 16, color: 'rgba(255,255,255,0.2)' }}>
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span style={{ marginLeft: 14, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: socketConn ? '#00cc66' : '#ff3333', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: socketConn ? '#00cc66' : '#ff5555' }}>{socketConn ? 'Live Connected' : 'Connecting...'}</span>
            </span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {['Online', 'Busy', 'Offline'].map(s => (
            <button key={s} onClick={() => setStatus(s)} style={{
              padding: '8px 18px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: status === s ? statusColors[s].bg : 'rgba(255,255,255,0.04)',
              border: status === s ? '1px solid ' + statusColors[s].border : '1px solid rgba(255,255,255,0.08)',
              color: status === s ? statusColors[s].fg : 'rgba(255,255,255,0.3)',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Emergency Request Banner if Active */}
      <AnimatePresence>
        {activeRequest && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            style={{
              background: 'linear-gradient(135deg,rgba(255,34,34,0.2),rgba(255,102,0,0.15))',
              border: '2px solid #ff3333', borderRadius: 20, padding: '24px', marginBottom: 24,
              boxShadow: '0 10px 40px rgba(255,34,34,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>🚨</span>
                <div>
                  <h2 style={{ color: '#ff4444', fontWeight: 900, margin: '0 0 2px', fontSize: 20 }}>URGENT: New Emergency Request!</h2>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Problem: <strong>{activeRequest.emergencyType}</strong></div>
                </div>
              </div>
              <span style={{ background: '#ff3333', color: '#fff', fontSize: 12, fontWeight: 900, padding: '4px 12px', borderRadius: 20 }}>LIVE ALERT</span>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 14, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, marginBottom: 18 }}>
              <div>👤 <strong>Patient Name:</strong> {activeRequest.customerName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>📞 <strong>Mobile:</strong> {activeRequest.customerPhone}</span>
                {activeRequest.customerPhone && activeRequest.customerPhone !== '—' && (
                  <a href={'tel:' + activeRequest.customerPhone} style={{ background: 'rgba(0,204,102,0.2)', color: '#00cc66', padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>Call</a>
                )}
              </div>
              <div>📍 <strong>Current Location:</strong> {activeRequest.customerLocation}</div>
              {activeRequest.message && <div>📝 <strong>Patient Notes:</strong> {activeRequest.message}</div>}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setActiveRequest(null)}
                style={{ flex: 1, padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 700 }}
              >Dismiss</button>
              <button
                onClick={() => handleAcceptRequest(activeRequest)}
                style={{ flex: 2, padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#00cc66,#009944)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 15, boxShadow: '0 6px 24px rgba(0,204,102,0.4)' }}
              >✓ Accept Request & Navigate</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { icon: '🚨', label: 'Emergency Requests', value: activeRequest ? '1 Active' : '0 Pending', color: '#ff3333', link: '/driver/requests' },
          { icon: '🔔', label: 'Notifications', value: 'View Alerts', color: '#ff8800', link: '/driver/notifications' },
          { icon: '📍', label: 'Pickup Navigation', value: 'Open Map', color: '#00cc66', link: '/driver/navigation' },
          { icon: '👤', label: 'Patient Info', value: 'Details', color: '#3399ff', link: '/driver/patient' },
        ].map((s) => (
          <Link key={s.label} to={s.link} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid ' + s.color + '25', borderRadius: 16, padding: '20px', transition: 'all 0.2s' }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ color: s.color, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{s.label}</div>
            </div>
          </Link>
        ))}
      </div>
    </DriverLayout>
  );
}
