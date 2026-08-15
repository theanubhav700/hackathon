import AdminLayout from '../../layouts/AdminLayout';
import { EmptyState } from './AdminDashboard';
import { motion } from 'framer-motion';

const kpiCards = [
  { icon: '🚨', label: 'Total Trips (This Month)',  value: '0',    color: '#ff3333' },
  { icon: '⏱️', label: 'Avg Response Time',         value: '— min', color: '#3399ff' },
  { icon: '✅', label: 'Completion Rate',           value: '—%',   color: '#00cc66' },
  { icon: '⭐', label: 'Avg Driver Rating',         value: '—',    color: '#ffaa00' },
];

export default function Analytics() {
  return (
    <AdminLayout>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>📈 Analytics</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Performance metrics, trip stats and response trends</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {kpiCards.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${k.color}22`, borderRadius: 16, padding: '22px 24px' }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>{k.icon}</div>
            <div style={{ color: k.color, fontWeight: 900, fontSize: 26, marginBottom: 4 }}>{k.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{k.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts placeholders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {['📊 Daily Trips (Last 30 Days)', '⏱️ Response Time Trend'].map(title => (
          <div key={title} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: '0 0 16px' }}>{title}</h3>
            <EmptyState icon="📈" text="Chart will appear once trip data is available." />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {['🚨 Emergency Types Breakdown', '🚑 Ambulance Utilization'].map(title => (
          <div key={title} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: '0 0 16px' }}>{title}</h3>
            <EmptyState icon="🔢" text="No data yet." />
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
