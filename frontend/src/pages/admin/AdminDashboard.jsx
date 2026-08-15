import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const quickLinks = [
  { icon: '🚨', label: 'Active Emergencies', path: '/admin/emergencies', color: '#ff3333' },
  { icon: '🚑', label: 'Manage Ambulances',  path: '/admin/ambulances',  color: '#3399ff' },
  { icon: '👨‍✈️', label: 'Manage Drivers',     path: '/admin/drivers',     color: '#ffaa00' },
  { icon: '🗺️', label: 'Live Map',           path: '/admin/map',         color: '#00cc66' },
];

export default function AdminDashboard() {
  const admin = JSON.parse(localStorage.getItem('resq_user') || '{}');
  const token = localStorage.getItem('resq_token');

  const [counts, setCounts] = useState({
    customers:   null,
    ambulances:  null,
    drivers:     null,
  });

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };

    // Fire all 3 requests in parallel
    Promise.allSettled([
      axios.get(`${API_BASE}/admin/customers`,  { headers }),
      axios.get(`${API_BASE}/admin/ambulances`, { headers }),
      axios.get(`${API_BASE}/admin/drivers`,    { headers }),
    ]).then(([cust, amb, drv]) => {
      setCounts({
        customers:  cust.status === 'fulfilled' && cust.value.data.success  ? cust.value.data.count  : 'N/A',
        ambulances: amb.status  === 'fulfilled' && amb.value.data.success   ? amb.value.data.count   : 'N/A',
        drivers:    drv.status  === 'fulfilled' && drv.value.data.success   ? drv.value.data.count   : 'N/A',
      });
    });
  }, []);

  const fmt = (val) => (val === null ? '…' : String(val));

  const stats = [
    { icon: '🚨', label: 'Total Emergencies', value: '0',              color: '#ff3333' },
    { icon: '🚑', label: 'Total Ambulances',  value: fmt(counts.ambulances), color: '#3399ff' },
    { icon: '👨‍✈️', label: 'Total Drivers',     value: fmt(counts.drivers),    color: '#ffaa00' },
    { icon: '👤', label: 'Total Customers',   value: fmt(counts.customers),  color: '#aa44ff' },
    { icon: '📡', label: 'Active Trips',      value: '0',              color: '#ff6600' },
    { icon: '✅', label: 'Completed Today',   value: '0',              color: '#00cc66' },
    { icon: '⏱️', label: 'Avg Response Time', value: '— min',          color: '#3399ff' },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>📊 Dashboard</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          Welcome back, <span style={{ color: '#3399ff', fontWeight: 700 }}>{admin.fullName || 'Admin'}</span>
        </p>
      </div>

      {/* Stats grid — 4 cols, 2 rows = 7 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${s.color}22`,
              borderRadius: 16, padding: '22px 24px',
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 10 }}>{s.icon}</div>
            <div style={{
              color: s.color, fontWeight: 900, fontSize: 28, marginBottom: 4,
              opacity: s.value === '…' ? 0.35 : 1,
              transition: 'opacity 0.3s',
            }}>
              {s.value}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick links + recent activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>

        {/* Quick Actions */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
          <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 15, margin: '0 0 18px' }}>⚡ Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quickLinks.map(q => (
              <a key={q.path} href={q.path} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12, textDecoration: 'none',
                background: `${q.color}0d`, border: `1px solid ${q.color}22`,
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = `${q.color}1a`}
                onMouseLeave={e => e.currentTarget.style.background = `${q.color}0d`}
              >
                <span style={{ fontSize: 18 }}>{q.icon}</span>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{q.label}</span>
                <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>→</span>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
          <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 15, margin: '0 0 18px' }}>📋 Recent Activity</h3>
          <EmptyState icon="📋" text="No activity yet. Logs will appear here once the system is in use." />
        </div>
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
