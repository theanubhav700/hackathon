import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SNAP_KEY = 'resq_analytics_snapshots';

// ── Persist a snapshot each time counts change ────────────
function saveSnapshot(customers, drivers, ambulances) {
  const now   = new Date();
  const label = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const today = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  const stored = JSON.parse(localStorage.getItem(SNAP_KEY) || '[]');

  // Don't duplicate if same values as last snapshot
  const last = stored[stored.length - 1];
  if (last && last.customers === customers && last.drivers === drivers && last.ambulances === ambulances) {
    return stored;
  }

  const snap = {
    label: `${today} ${label}`,
    customers,
    drivers,
    ambulances,
    rating: 4.3, // fixed avg rating
  };

  const updated = [...stored, snap].slice(-30); // keep last 30 snapshots
  localStorage.setItem(SNAP_KEY, JSON.stringify(updated));
  return updated;
}

// ── Custom dark tooltip ───────────────────────────────────
function DarkTooltip({ active, payload, label, color, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0d0d20', border: `1px solid ${color}40`,
      borderRadius: 10, padding: '10px 14px', fontSize: 13,
    }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontWeight: 800, fontSize: 18 }}>
        {payload[0].value}{unit}
      </div>
    </div>
  );
}

// ── Single chart card ─────────────────────────────────────
function ChartCard({ title, icon, color, dataKey, data, unit = '', delay = 0 }) {
  const latest = data.length ? data[data.length - 1][dataKey] : 0;
  const first  = data.length ? data[0][dataKey] : 0;
  const growth = data.length > 1 ? latest - first : 0;

  // Build chart data — if only 1 point, duplicate so line is visible
  const chartData = data.length === 1
    ? [{ ...data[0], label: '' }, data[0]]
    : data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 160, damping: 18 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${color}22`,
        borderRadius: 20, padding: '24px 24px 16px',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 140, height: 140, borderRadius: '50%',
        background: color, opacity: 0.06, filter: 'blur(30px)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600 }}>{title}</span>
          </div>
          <div style={{ color, fontWeight: 900, fontSize: 36, lineHeight: 1 }}>
            {dataKey === 'rating' ? latest.toFixed(1) : latest}
            {unit && <span style={{ fontSize: 16, fontWeight: 600, marginLeft: 4 }}>{unit}</span>}
          </div>
        </div>

        {/* Growth badge */}
        {growth > 0 && (
          <div style={{
            background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.25)',
            borderRadius: 20, padding: '4px 12px',
            color: '#00cc66', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            ↑ +{dataKey === 'rating' ? growth.toFixed(1) : growth}
          </div>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
              axisLine={false} tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
              axisLine={false} tickLine={false}
              allowDecimals={dataKey === 'rating'}
              domain={dataKey === 'rating' ? [4, 5] : ['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload, label }) => (
                <DarkTooltip active={active} payload={payload} label={label} color={color} unit={unit} />
              )}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#grad-${dataKey})`}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 13 }}>No data yet</span>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
        {data.length > 1
          ? `${data.length} snapshots · updates when accounts change`
          : 'Tracking started — graph will grow as accounts are added'}
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function Analytics() {
  const token = localStorage.getItem('resq_token');

  const [snapshots, setSnapshots] = useState(() =>
    JSON.parse(localStorage.getItem(SNAP_KEY) || '[]')
  );
  const [current, setCurrent] = useState({ customers: 0, drivers: 0, ambulances: 0 });

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };

    Promise.allSettled([
      axios.get(`${API_BASE}/admin/customers`,  { headers }),
      axios.get(`${API_BASE}/admin/ambulances`, { headers }),
      axios.get(`${API_BASE}/admin/drivers`,    { headers }),
    ]).then(([cust, amb, drv]) => {
      const customers  = cust.status === 'fulfilled' && cust.value.data.success ? cust.value.data.count : 0;
      const ambulances = amb.status  === 'fulfilled' && amb.value.data.success  ? amb.value.data.count  : 0;
      const drivers    = drv.status  === 'fulfilled' && drv.value.data.success  ? drv.value.data.count  : 0;

      setCurrent({ customers, drivers, ambulances });
      const updated = saveSnapshot(customers, drivers, ambulances);
      setSnapshots(updated);
    });
  }, []);

  const charts = [
    { title: 'Total Customers',  icon: '👤', color: '#aa44ff', dataKey: 'customers',  unit: '' },
    { title: 'Total Drivers',    icon: '👨‍✈️', color: '#ffaa00', dataKey: 'drivers',    unit: '' },
    { title: 'Total Ambulances', icon: '🚑', color: '#3399ff', dataKey: 'ambulances', unit: '' },
    { title: 'Avg Rating',       icon: '⭐', color: '#00cc66', dataKey: 'rating',     unit: '★' },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>📈 Analytics</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          Live growth charts — graphs rise as accounts are created
        </p>
      </div>

      {/* 4 charts 2x2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {charts.map((c, i) => (
          <ChartCard
            key={c.dataKey}
            {...c}
            data={snapshots}
            delay={i * 0.08}
          />
        ))}
      </div>

      {/* Clear snapshots */}
      {snapshots.length > 0 && (
        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button
            onClick={() => {
              localStorage.removeItem(SNAP_KEY);
              setSnapshots([]);
            }}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 14px',
              cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
            }}
          >Reset chart history</button>
        </div>
      )}
    </AdminLayout>
  );
}
