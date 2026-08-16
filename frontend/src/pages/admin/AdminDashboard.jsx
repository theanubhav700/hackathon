import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { motion } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE   = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

export default function AdminDashboard() {
  const admin = JSON.parse(localStorage.getItem('resq_user') || '{}');
  const token = localStorage.getItem('resq_token');

  const [counts, setCounts] = useState({ customers: null, ambulances: null, drivers: null });
  const [socketConn, setSocketConn] = useState(false);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.allSettled([
      axios.get(`${API_BASE}/admin/customers`,  { headers }),
      axios.get(`${API_BASE}/admin/ambulances`, { headers }),
      axios.get(`${API_BASE}/admin/drivers`,    { headers }),
    ]).then(([cust, amb, drv]) => {
      setCounts({
        customers:  cust.status === 'fulfilled' && cust.value.data.success ? cust.value.data.count  : 'N/A',
        ambulances: amb.status  === 'fulfilled' && amb.value.data.success  ? amb.value.data.count   : 'N/A',
        drivers:    drv.status  === 'fulfilled' && drv.value.data.success  ? drv.value.data.count   : 'N/A',
      });
    });

    // ── Socket: Admin connection status only ──────────
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.on('connect',    () => setSocketConn(true));
    socket.on('disconnect', () => setSocketConn(false));
    socket.on('connect', () => socket.emit('admin:join'));

    return () => socket.disconnect();
  }, []);

  const fmt = (val) => (val === null ? '…' : String(val));

  const stats = [
    { icon: '👤',  label: 'Total Customers',  value: fmt(counts.customers),  color: '#aa44ff', sub: 'Registered users'  },
    { icon: '👨‍✈️', label: 'Total Drivers',    value: fmt(counts.drivers),    color: '#ffaa00', sub: 'Active on platform' },
    { icon: '🚑',  label: 'Total Ambulances', value: fmt(counts.ambulances), color: '#3399ff', sub: 'Fleet size'         },
    { icon: '⭐',  label: 'Avg Rating',        value: '4.3',                  color: '#00cc66', sub: 'Out of 5.0', stars: true },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>📊 Dashboard</h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
              Welcome back, <span style={{ color: '#3399ff', fontWeight: 700 }}>{admin.fullName || 'Admin'}</span>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <motion.div
              animate={socketConn ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: socketConn ? '#00cc66' : '#ff3333' }}
            />
            <span style={{ color: socketConn ? '#00cc66' : '#ff5555', fontSize: 12, fontWeight: 700 }}>
              {socketConn ? 'Live Monitor' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* 4 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 180, damping: 18 }}
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.color}28`, borderRadius: 20, padding: '28px 26px', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: s.color, opacity: 0.07, filter: 'blur(24px)', pointerEvents: 'none' }} />
            <div style={{ width: 48, height: 48, borderRadius: 14, marginBottom: 18, background: `${s.color}18`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
            <div style={{ color: s.color, fontWeight: 900, fontSize: s.stars ? 32 : 36, marginBottom: 6, lineHeight: 1, opacity: s.value === '…' ? 0.3 : 1, transition: 'opacity 0.4s', display: 'flex', alignItems: 'center', gap: 6 }}>
              {s.value}
              {s.stars && <span style={{ fontSize: 20, color: '#ffcc00', letterSpacing: -1 }}>★★★★<span style={{ opacity: 0.35 }}>★</span></span>}
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

    </AdminLayout>
  );
}


export function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.4 }}>{icon}</div>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}
