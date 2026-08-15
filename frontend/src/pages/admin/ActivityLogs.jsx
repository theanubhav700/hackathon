import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { EmptyState } from './AdminDashboard';

const logTypes = ['All', 'Booking', 'Login', 'System', 'Error'];

export default function ActivityLogs() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  return (
    <AdminLayout>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>📋 Activity Logs</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Complete record of every action in the system</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {logTypes.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 18px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: filter === f ? 'rgba(170,68,255,0.15)' : 'rgba(255,255,255,0.04)',
            border: filter === f ? '1px solid rgba(170,68,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
            color: filter === f ? '#aa44ff' : 'rgba(255,255,255,0.45)',
          }}>{f}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '9px 14px' }}>
          <span>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..."
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, width: 180, fontFamily: 'inherit' }} />
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1fr 2fr 1fr', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          {['Timestamp', 'Type', 'Description', 'User'].map(h => (
            <span key={h} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>
        <EmptyState icon="📋" text="No logs recorded yet. All system actions will be tracked here." />
      </div>
    </AdminLayout>
  );
}
