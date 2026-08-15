import AdminLayout from '../../layouts/AdminLayout';
import { EmptyState } from './AdminDashboard';

export default function ActiveEmergencies() {
  return (
    <AdminLayout>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>🚨 Active Emergencies</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>All currently active emergency requests</p>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {['All', 'Unassigned', 'Dispatched', 'En Route'].map((f, i) => (
          <button key={f} style={{
            padding: '8px 18px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: i === 0 ? 'rgba(255,51,51,0.15)' : 'rgba(255,255,255,0.04)',
            border: i === 0 ? '1px solid rgba(255,51,51,0.35)' : '1px solid rgba(255,255,255,0.08)',
            color: i === 0 ? '#ff4444' : 'rgba(255,255,255,0.45)',
          }}>{f}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '8px 16px' }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <input placeholder="Search emergency..." style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, width: 160, fontFamily: 'inherit' }} />
        </div>
      </div>

      {/* Table header */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 1fr', gap: 0, padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          {['Booking ID', 'Customer', 'Emergency Type', 'Location', 'Ambulance', 'Status'].map(h => (
            <span key={h} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>
        <EmptyState icon="🚨" text="No active emergencies right now. New bookings will appear here." />
      </div>
    </AdminLayout>
  );
}
