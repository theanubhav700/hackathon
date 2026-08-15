import { useState } from 'react';
import DriverLayout from '../../layouts/DriverLayout';

const TYPE_COLORS = {
  'Cardiac Arrest': '#ff3333', 'Breathing Difficulty': '#3399ff',
  'Road Accident': '#ff8800', 'Stroke': '#aa44ff', 'High Fever': '#ffaa00',
};

export default function TripHistory() {
  const [trips]  = useState([]);
  const [search, setSearch] = useState('');

  const filtered = trips.filter(t =>
    t.patient?.toLowerCase().includes(search.toLowerCase()) ||
    t.hospital?.toLowerCase().includes(search.toLowerCase()) ||
    t.id?.toLowerCase().includes(search.toLowerCase()) ||
    t.type?.toLowerCase().includes(search.toLowerCase())
  );

  const col = { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' };

  return (
    <DriverLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>📋 Trip History</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>All your completed emergency trips</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Trips',    value: trips.length, color: '#3399ff' },
          { label: 'This Month',     value: 0,            color: '#00cc66' },
          { label: 'Avg Duration',   value: '— min',      color: '#ff8800' },
          { label: 'Total Distance', value: '— km',       color: '#aa44ff' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.color}25`, borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ color: s.color, fontWeight: 900, fontSize: 22 }}>{s.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '11px 16px', marginBottom: 18 }}>
        <span>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient, hospital, trip ID..."
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontFamily: 'inherit' }} />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, padding: 0 }}>✕</button>}
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 1.4fr 1fr 0.7fr 0.7fr 0.8fr', padding: '14px 22px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['Trip ID', 'Patient', 'Hospital', 'Date', 'Duration', 'Distance', 'Type'].map(h => (
            <span key={h} style={col}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 0' }}>
            <div style={{ fontSize: 44, opacity: 0.12, marginBottom: 12 }}>📋</div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
              {search ? 'No trips match your search.' : 'No trips yet. Completed trips will appear here.'}
            </div>
          </div>
        ) : (
          filtered.map((t, i) => (
            <div key={t.id} style={{
              display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 1.4fr 1fr 0.7fr 0.7fr 0.8fr',
              padding: '14px 22px', alignItems: 'center',
              borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ color: '#3399ff', fontWeight: 700, fontSize: 12 }}>{t.id}</span>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{t.patient}</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{t.hospital}</span>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{t.date}</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{t.time}</div>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{t.duration}</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{t.distance}</span>
              <span style={{ background: `${TYPE_COLORS[t.type] || '#888'}15`, border: `1px solid ${TYPE_COLORS[t.type] || '#888'}30`, color: TYPE_COLORS[t.type] || '#888', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700 }}>{t.type}</span>
            </div>
          ))
        )}
      </div>
    </DriverLayout>
  );
}
