import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';


const TYPE_COLOR = {
  Booking: { color: '#00cc66', bg: 'rgba(0,204,102,0.1)',   border: 'rgba(0,204,102,0.25)',  icon: '✅' },
  Login:   { color: '#3399ff', bg: 'rgba(51,153,255,0.1)',  border: 'rgba(51,153,255,0.25)', icon: '🔐' },
  System:  { color: '#ffaa00', bg: 'rgba(255,170,0,0.1)',   border: 'rgba(255,170,0,0.25)',  icon: '⚙️' },
  Error:   { color: '#ff4444', bg: 'rgba(255,68,68,0.1)',   border: 'rgba(255,68,68,0.25)',  icon: '❌' },
};

const FILTERS = ['All', 'Booking'];

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    '  ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ActivityLogs() {
  const [logs, setLogs]         = useState([]);
  const [filter, setFilter]     = useState('All');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    const load = () => {
      const stored = JSON.parse(localStorage.getItem('resq_activity_logs') || '[]');
      setLogs(stored);
    };
    load();
    window.addEventListener('storage', load);
    const interval = setInterval(load, 3000);
    return () => {
      window.removeEventListener('storage', load);
      clearInterval(interval);
    };
  }, []);

  const filtered = logs.filter(l => {
    const matchFilter = filter === 'All' || l.type === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      l.bookingId?.toLowerCase().includes(q)    ||
      l.driverName?.toLowerCase().includes(q)   ||
      l.ambulanceId?.toLowerCase().includes(q)  ||
      l.customerName?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q)  ||
      l.logId?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'All' ? logs.length : logs.filter(l => l.type === f).length;
    return acc;
  }, {});

  const clearLogs = () => {
    localStorage.removeItem('resq_activity_logs');
    setLogs([]);
  };

  return (
    <AdminLayout>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>📋 Activity Logs</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
            Complete record of every action in the system
          </p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={clearLogs}
            style={{
              padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: 'rgba(255,85,85,0.08)', border: '1px solid rgba(255,85,85,0.2)',
              color: '#ff5555',
            }}
          >🗑 Clear Logs</button>
        )}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(f => {
          const active = filter === f;
          const c = TYPE_COLOR[f]?.color || '#aa44ff';
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 18px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: active ? (f === 'All' ? 'rgba(170,68,255,0.15)' : TYPE_COLOR[f]?.bg) : 'rgba(255,255,255,0.04)',
                border: active ? `1px solid ${f === 'All' ? 'rgba(170,68,255,0.35)' : TYPE_COLOR[f]?.border}` : '1px solid rgba(255,255,255,0.08)',
                color: active ? (f === 'All' ? '#aa44ff' : c) : 'rgba(255,255,255,0.45)',
                transition: 'all 0.18s',
              }}
            >
              {f}
              <span style={{
                marginLeft: 7, fontSize: 11, fontWeight: 800,
                background: 'rgba(255,255,255,0.06)',
                color: active ? (f === 'All' ? '#aa44ff' : c) : 'rgba(255,255,255,0.3)',
                padding: '1px 7px', borderRadius: 10,
              }}>{counts[f]}</span>
            </button>
          );
        })}

        {/* Search */}
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '9px 14px',
        }}>
          <span>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by driver, booking, ambulance..."
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: 13, width: 220, fontFamily: 'inherit',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr 1.2fr 1fr 1.8fr',
          padding: '13px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          {['Accept Time', 'Booking ID', 'Driver', 'Ambulance', 'Customer'].map(h => (
            <span key={h} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 40, opacity: 0.12, marginBottom: 10 }}>📋</div>
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
              {search ? 'No results match your search' : 'No logs recorded yet — driver acceptances will appear here'}
            </div>
          </div>
        ) : (
          filtered.map((l, i) => {
            const tc = TYPE_COLOR[l.type] || TYPE_COLOR.Booking;
            return (
              <div
                key={l.logId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.2fr 1.2fr 1fr 1.8fr',
                  padding: '15px 24px',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  alignItems: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Accept Time */}
                <div>
                  <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                    {formatDate(l.acceptTime).split('  ')[1]}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 2 }}>
                    {formatDate(l.acceptTime).split('  ')[0]}
                  </div>
                </div>

                {/* Booking ID */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: tc.bg, border: `1px solid ${tc.border}`,
                    color: tc.color, padding: '3px 10px', borderRadius: 20,
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {tc.icon} {l.type}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'monospace' }}>
                    {l.bookingId?.slice(-10) || '—'}
                  </span>
                </div>

                {/* Driver */}
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>
                    👨‍✈️ {l.driverName || '—'}
                  </div>
                </div>

                {/* Ambulance */}
                <div>
                  <div style={{ color: '#ffaa00', fontWeight: 700, fontSize: 13 }}>
                    🚑 {l.ambulanceId || '—'}
                  </div>
                </div>

                {/* Customer */}
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                    👤 {l.customerName || '—'}
                  </div>
                  {l.description && (
                    <div style={{
                      color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }} title={l.description}>
                      {l.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {filtered.length > 0 && (
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 12, textAlign: 'right' }}>
          Showing {filtered.length} of {logs.length} log{logs.length !== 1 ? 's' : ''}
        </div>
      )}
    </AdminLayout>
  );
}
