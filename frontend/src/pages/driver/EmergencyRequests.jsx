import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import DriverLayout from '../../layouts/DriverLayout';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const TYPE_COLORS = {
  'Cardiac Arrest':       '#ff3333',
  'Road Accident':        '#ff8800',
  'Breathing Difficulty': '#3399ff',
  'Stroke':               '#aa44ff',
  'accident':             '#ff8800',
  'cardiac':              '#ff3333',
  'stroke':               '#aa44ff',
  'breathing':            '#3399ff',
  'maternity':            '#ff66aa',
  'fall':                 '#ffaa00',
  'fire':                 '#ff5500',
  'other':                '#888',
};

const LABEL = {
  accident: 'Road Accident', cardiac: 'Cardiac Arrest', stroke: 'Stroke',
  breathing: 'Breathing Problem', maternity: 'Maternity', fall: 'Fall / Fracture',
  fire: 'Fire / Burn Injury', other: 'Other Emergency',
};

export default function EmergencyRequests() {
  const navigate    = useNavigate();
  const driver      = JSON.parse(localStorage.getItem('resq_user') || '{}');
  const socketRef   = useRef(null);

  const [requests, setRequests]   = useState([]);
  const [expanded, setExpanded]   = useState(null);
  const [connected, setConnected] = useState(false);
  const [accepting, setAccepting] = useState(null);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, color = '#ff8800') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Socket connection ──────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Register as this driver
      socket.emit('driver:register', { driverId: driver._id });
    });

    socket.on('disconnect', () => setConnected(false));

    // ── Incoming booking request ────────────────────────
    socket.on('booking:request', (data) => {
      console.log('📨 New booking request:', data);
      setRequests(prev => {
        // avoid duplicates
        if (prev.find(r => r.bookingId === data.bookingId)) return prev;
        return [{ ...data, status: 'Pending', receivedAt: new Date() }, ...prev];
      });
      showToast('🚨 New emergency request!', '#ff3333');
      // Play alert sound if available
      try { new Audio('/alert.mp3').play(); } catch {}
    });

    return () => socket.disconnect();
  }, [driver._id]);

  // ── Accept ─────────────────────────────────────────────
  const handleAccept = (req) => {
    setAccepting(req.bookingId);

    // Get driver's current GPS from localStorage cache
    const loc = JSON.parse(localStorage.getItem('resq_driver_location') || 'null');

    socketRef.current?.emit('booking:accept', {
      bookingId: req.bookingId,
      driverId:  driver._id,
      driverLat: loc?.lat || req.driverLat,
      driverLon: loc?.lon || req.driverLon,
    });

    // Mark accepted locally
    setRequests(prev => prev.map(r =>
      r.bookingId === req.bookingId ? { ...r, status: 'Accepted' } : r
    ));

    // Save trip data for navigation page
    localStorage.setItem('resq_active_booking', JSON.stringify({
      bookingId:    req.bookingId,
      customerLat:  req.customerLat,
      customerLon:  req.customerLon,
      customerName: req.customerName,
      emergencyType: LABEL[req.emergencyType] || req.emergencyType,
      message:      req.message,
      driverLat:    loc?.lat || req.driverLat,
      driverLon:    loc?.lon || req.driverLon,
    }));

    showToast('✅ Request accepted! Opening navigation...', '#00cc66');

    setTimeout(() => {
      setAccepting(null);
      navigate('/driver/navigation');
    }, 1200);
  };

  // ── Reject ─────────────────────────────────────────────
  const handleReject = (req) => {
    socketRef.current?.emit('booking:reject', {
      bookingId: req.bookingId,
      driverId:  driver._id,
    });
    setRequests(prev => prev.filter(r => r.bookingId !== req.bookingId));
    showToast('Request rejected', '#888');
  };

  const pending = requests.filter(r => r.status === 'Pending');

  return (
    <DriverLayout>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            style={{
              position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
              zIndex: 9999, background: toast.color, color: '#fff',
              padding: '11px 28px', borderRadius: 30, fontWeight: 700, fontSize: 14,
              boxShadow: `0 8px 28px ${toast.color}88`,
            }}>{toast.msg}</motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>
            🚨 Emergency Requests
            {pending.length > 0 && (
              <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
                style={{ marginLeft: 12, background: '#ff3333', borderRadius: '50%', width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', verticalAlign: 'middle' }}>
                {pending.length}
              </motion.span>
            )}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#00cc66' : '#ff3333', display: 'inline-block', boxShadow: connected ? '0 0 6px #00cc66' : 'none' }} />
            {connected ? 'Live — waiting for requests' : 'Disconnected'}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {requests.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <motion.div animate={{ opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 2.5, repeat: Infinity }}
            style={{ fontSize: 64, marginBottom: 20 }}>🚨</motion.div>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 16, fontWeight: 600 }}>Waiting for emergency requests...</div>
          <div style={{ color: 'rgba(255,255,255,0.12)', fontSize: 13, marginTop: 8 }}>
            {connected ? 'Connected — new requests will appear here automatically' : 'Reconnecting to server...'}
          </div>
        </div>
      )}

      {/* Request cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AnimatePresence>
          {requests.map((req, i) => {
            const typeLabel = LABEL[req.emergencyType] || req.emergencyType || 'Emergency';
            const color     = TYPE_COLORS[req.emergencyType] || '#ff3333';
            const isExpanded = expanded === req.bookingId;

            return (
              <motion.div key={req.bookingId}
                initial={{ opacity: 0, y: -20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: req.status === 'Accepted' ? 'rgba(0,204,102,0.05)' : `${color}08`,
                  border: `1px solid ${req.status === 'Accepted' ? 'rgba(0,204,102,0.25)' : color + '35'}`,
                  borderRadius: 16, overflow: 'hidden',
                  boxShadow: req.status === 'Pending' ? `0 0 20px ${color}15` : 'none',
                }}>

                {/* Main row */}
                <div onClick={() => setExpanded(isExpanded ? null : req.bookingId)}
                  style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', cursor: 'pointer' }}>

                  {/* Type badge */}
                  <div style={{ background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 12, padding: '10px 16px', flexShrink: 0, minWidth: 120 }}>
                    <div style={{ color, fontWeight: 800, fontSize: 13 }}>{typeLabel}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 }}>#{req.bookingId?.slice(-6)}</div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                      👤 {req.customerName || 'Patient'}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                      🕒 {req.receivedAt ? new Date(req.receivedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                    </div>
                    {req.message && (
                      <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 3, fontStyle: 'italic' }}>
                        "{req.message.slice(0, 60)}{req.message.length > 60 ? '...' : ''}"
                      </div>
                    )}
                  </div>

                  {/* Distance + ETA */}
                  <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color, fontWeight: 900, fontSize: 20 }}>{req.distanceKm} km</div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Distance</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#ffaa00', fontWeight: 900, fontSize: 20 }}>{req.etaMin} min</div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>ETA</div>
                    </div>
                  </div>

                  {/* Buttons */}
                  {req.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: 10, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleReject(req)} style={{
                        padding: '11px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                        background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.3)', color: '#ff5555',
                      }}>✕ Reject</button>
                      <button onClick={() => handleAccept(req)} disabled={accepting === req.bookingId}
                        style={{
                          padding: '11px 22px', borderRadius: 10, cursor: accepting ? 'not-allowed' : 'pointer',
                          fontWeight: 800, fontSize: 13,
                          background: accepting === req.bookingId ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#00cc66,#009944)',
                          border: 'none', color: '#fff',
                          boxShadow: accepting === req.bookingId ? 'none' : '0 4px 16px rgba(0,204,102,0.35)',
                        }}>
                        {accepting === req.bookingId ? '⏳ Accepting...' : '✓ Accept'}
                      </button>
                    </div>
                  )}

                  {req.status === 'Accepted' && (
                    <span style={{ background: 'rgba(0,204,102,0.12)', border: '1px solid rgba(0,204,102,0.3)', color: '#00cc66', padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                      ✓ Accepted
                    </span>
                  )}
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden', borderTop: `1px solid ${color}20` }}>
                      <div style={{ padding: '18px 24px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                        {[
                          ['Patient',        req.customerName || '—'],
                          ['Emergency',      typeLabel],
                          ['Distance',       `${req.distanceKm} km`],
                          ['ETA',            `${req.etaMin} min`],
                          ['Customer Lat',   req.customerLat?.toFixed(5) || '—'],
                          ['Customer Lon',   req.customerLon?.toFixed(5) || '—'],
                          ['Notes',          req.message || '—'],
                        ].map(([label, val]) => (
                          <div key={label}>
                            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                            <div style={{ color: '#fff', fontSize: 13 }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </DriverLayout>
  );
}
