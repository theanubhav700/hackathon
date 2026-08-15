import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import DriverLayout from '../../layouts/DriverLayout';
import { motion } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

export default function EmergencyRequests() {
  const navigate  = useNavigate();
  const driver    = JSON.parse(localStorage.getItem('resq_user') || '{}');
  const [requests, setRequests] = useState([]);
  const socketRef = useRef(null);

  const fetchRequests = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}/driver/requests`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchRequests();

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('driver:register', { driverId: driver._id });
    });

    socket.on('booking:request', (data) => {
      setRequests(prev => {
        const filtered = prev.filter(r => r.bookingId !== data.bookingId);
        return [data, ...filtered];
      });
    });

    return () => socket.disconnect();
  }, [driver._id]);

  const handleAccept = (req) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('booking:accept', {
        bookingId: req.bookingId,
        driverId:  driver._id,
      });
    }

    localStorage.setItem('resq_active_booking', JSON.stringify(req));
    navigate('/driver/navigation');
  };

  return (
    <DriverLayout>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 4px' }}>🚨 Emergency Requests</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>Active emergency bookings requesting response</p>
        </div>

        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'rgba(255,255,255,0.02)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 44, opacity: 0.2, marginBottom: 12 }}>🚑</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 15 }}>No pending emergency requests</div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 4 }}>You will be alerted instantly as soon as a customer books an ambulance.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {requests.map(req => (
              <div
                key={req.bookingId}
                style={{
                  background: 'rgba(255,51,51,0.05)', border: '1px solid rgba(255,51,51,0.25)',
                  borderRadius: 18, padding: '22px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>🚨</span>
                    <span style={{ color: '#ff3333', fontWeight: 800, fontSize: 16 }}>
                      Emergency: {req.emergencyType}
                    </span>
                  </div>
                  <span style={{ color: '#ffaa00', fontSize: 12, fontWeight: 700 }}>● Pending Action</span>
                </div>

                <div style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, marginBottom: 18,
                }}>
                  <div>👤 <strong>Patient Name:</strong> {req.customerName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>📞 <strong>Mobile:</strong> {req.customerPhone}</span>
                    {req.customerPhone && req.customerPhone !== '—' && (
                      <a href={`tel:${req.customerPhone}`} style={{ background: 'rgba(0,204,102,0.15)', color: '#00cc66', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>Call Patient</a>
                    )}
                  </div>
                  <div>📍 <strong>Pickup Location:</strong> {req.customerLocation}</div>
                  <div>⚠️ <strong>Problem Details:</strong> {req.problem || req.emergencyType} {req.message ? `(${req.message})` : ''}</div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => handleAccept(req)}
                    style={{
                      flex: 1, padding: '13px', borderRadius: 12, border: 'none',
                      background: 'linear-gradient(135deg,#00cc66,#009944)',
                      color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(0,204,102,0.35)',
                    }}
                  >✓ Accept & Navigate to Patient</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DriverLayout>
  );
}
