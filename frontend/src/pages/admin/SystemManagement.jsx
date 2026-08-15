import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { motion } from 'framer-motion';

const sections = [
  { icon: '🚑', title: 'Ambulance Settings',  desc: 'Add, edit or remove ambulances from the fleet', link: '/admin/ambulances', color: '#3399ff' },
  { icon: '👨‍✈️', title: 'Driver Settings',    desc: 'Register drivers, assign ambulances, manage status', link: '/admin/drivers',    color: '#ffaa00' },
  { icon: '🏥', title: 'Hospital Settings',   desc: 'Add/edit hospitals and manage incoming patient routing', link: '/admin/hospitals',  color: '#00cc66' },
  { icon: '👤', title: 'Customer Records',    desc: 'View all registered customers', link: '/admin/customers',  color: '#aa44ff' },
  { icon: '📋', title: 'Activity Logs',       desc: 'Full system event history', link: '/admin/logs',       color: '#ff8800' },
];

const dangerActions = [
  { icon: '🗑️', label: 'Clear All Logs',        desc: 'Permanently delete all activity logs' },
  { icon: '🔄', label: 'Reset Trip Counter',    desc: 'Reset daily trip statistics to zero' },
];

export default function SystemManagement() {
  const admin = JSON.parse(localStorage.getItem('resq_user') || '{}');
  const [confirmAction, setConfirmAction] = useState(null);

  return (
    <AdminLayout>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>⚙️ System Management</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Central control for all system configurations</p>
      </div>

      {/* Admin info card */}
      <div style={{ background: 'rgba(51,153,255,0.06)', border: '1px solid rgba(51,153,255,0.18)', borderRadius: 16, padding: '20px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#3399ff,#0055cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
          {(admin.fullName || 'A')[0].toUpperCase()}
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{admin.fullName || 'Admin'}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{admin.email || 'admin@resq.com'}</div>
        </div>
        <div style={{ marginLeft: 'auto', background: 'rgba(51,153,255,0.12)', border: '1px solid rgba(51,153,255,0.25)', borderRadius: 20, padding: '5px 16px' }}>
          <span style={{ color: '#3399ff', fontSize: 12, fontWeight: 700 }}>🛡️ SUPER ADMIN</span>
        </div>
      </div>

      {/* Quick navigation */}
      <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Management Sections</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }}>
        {sections.map((s, i) => (
          <motion.a key={s.title} href={s.link}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '18px 20px', borderRadius: 14, textDecoration: 'none',
              background: `${s.color}08`, border: `1px solid ${s.color}22`,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = `${s.color}14`}
            onMouseLeave={e => e.currentTarget.style.background = `${s.color}08`}
          >
            <span style={{ fontSize: 26, flexShrink: 0 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{s.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{s.desc}</div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>→</span>
          </motion.a>
        ))}
      </div>

      {/* Danger zone */}
      <div style={{ background: 'rgba(255,51,51,0.04)', border: '1px solid rgba(255,51,51,0.15)', borderRadius: 16, padding: '24px' }}>
        <h3 style={{ color: '#ff4444', fontWeight: 800, fontSize: 14, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚠️ Danger Zone
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dangerActions.map(action => (
            <div key={action.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>{action.icon}</span>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{action.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{action.desc}</div>
                </div>
              </div>
              <button
                onClick={() => setConfirmAction(action.label)}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,51,51,0.3)', background: 'rgba(255,51,51,0.08)', color: '#ff4444', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                Run
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm dialog */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#0d0d20', border: '1px solid rgba(255,51,51,0.25)', borderRadius: 18, padding: 32, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>⚠️</div>
            <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 18, margin: '0 0 10px' }}>Are you sure?</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24 }}>
              "{confirmAction}" cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirmAction(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={() => setConfirmAction(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'linear-gradient(135deg,#ff2222,#cc0000)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
