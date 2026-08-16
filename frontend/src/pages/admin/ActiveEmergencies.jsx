import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const STATUS_STYLE = {
  Confirmed: { color: '#00cc66', bg: 'rgba(0,204,102,0.12)',  border: 'rgba(0,204,102,0.3)',  dot: '#00cc66' },
  Accepted:  { color: '#00cc66', bg: 'rgba(0,204,102,0.12)',  border: 'rgba(0,204,102,0.3)',  dot: '#00cc66' },
  Active:    { color: '#3399ff', bg: 'rgba(51,153,255,0.12)', border: 'rgba(51,153,255,0.3)', dot: '#3399ff' },
  Done:      { color: '#00cc66', bg: 'rgba(0,204,102,0.12)',  border: 'rgba(0,204,102,0.3)',  dot: '#00cc66' },
};

const FILTERS = ['All', 'Confirmed', 'Done'];

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    '  ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function ActiveEmergencies() {
  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Load from localStorage on mount + listen for updates
  useEffect(() => {
    const load = () => {
      const stored = JSON.parse(localStorage.getItem('resq_admin_requests') || '[]');
      setRequests(stored);
    };
    load();
    window.addEventListener('storage', load);
    // Poll every 2s so same-tab booking updates reflect instantly
    const interval = setInterval(load, 2000);

    // ── Socket: listen for driver accept ──────────────────
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      socket.emit('admin:join');
    });

    const updateStatus = (bookingId, newStatus) => {
      setRequests(prev => {
        const updated = prev.map(r =>
          r.bookingId === bookingId ? { ...r, status: newStatus } : r
        );
        localStorage.setItem('resq_admin_requests', JSON.stringify(updated));
        return updated;
      });
    };

    socket.on('booking:status_change', ({ bookingId, status }) => {
      const mapped = status === 'Accepted' ? 'Confirmed' : status;
      updateStatus(bookingId, mapped);
    });

    socket.on('booking:accepted', (data) => {
      updateStatus(data.bookingId, 'Confirmed');
    });

    // Catch-all — any booking:request that comes in, update pending ones
    socket.on('booking:request', (data) => {
      // new booking coming in — add to list if not already there
      setRequests(prev => {
        const exists = prev.find(r => r.bookingId === data.bookingId);
        if (exists) return prev;
        const newEntry = {
          bookingId:     data.bookingId,
          customerName:  data.customerName  || '—',
          customerPhone: data.customerPhone || '—',
          location:      data.customerLocation || '—',
          ambulance:     `${data.ambulanceId} — ${data.ambulanceType}`,
          driverName:    data.driverName    || '—',
          driverPhone:   data.driverPhone   || '—',
          eta:           data.etaMin        || '—',
          bookedAt:      data.createdAt     || new Date().toISOString(),
          status:        'Confirmed',
        };
        const updated = [newEntry, ...prev];
        localStorage.setItem('resq_admin_requests', JSON.stringify(updated));
        return updated;
      });
    });

    return () => {
      window.removeEventListener('storage', load);
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  // Filter + search
  const filtered = requests.filter(r => {
    const matchFilter = activeFilter === 'All' || r.status === activeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.bookingId?.toLowerCase().includes(q) ||
      r.customerName?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q) ||
      r.ambulance?.toLowerCase().includes(q) ||
      r.driverName?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'All' ? requests.length : requests.filter(r => r.status === f).length;
    return acc;
  }, {});

  return (
    <AdminLayout>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>🚨 All Requests</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
            Every ambulance booking made by customers — updates in real-time
          </p>
        </div>
        {requests.length > 0 && (
          <button
            onClick={() => {
              localStorage.removeItem('resq_admin_requests');
              setRequests([]);
            }}
            style={{
              padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: 'rgba(255,85,85,0.08)', border: '1px solid rgba(255,85,85,0.2)',
              color: '#ff5555', fontFamily: 'inherit',
            }}
          >
            🗑 Clear All
          </button>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(f => {
          const active = activeFilter === f;
          const color  = f === 'Confirmed' ? '#00cc66' : f === 'Active' ? '#3399ff' : f === 'Done' ? '#00cc66' : '#aa44ff';
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '8px 18px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
                border: active ? `1px solid ${color}55` : '1px solid rgba(255,255,255,0.08)',
                color: active ? color : 'rgba(255,255,255,0.45)',
                transition: 'all 0.18s',
              }}
            >
              {f}
              <span style={{
                marginLeft: 7, fontSize: 11, fontWeight: 800,
                background: active ? `${color}33` : 'rgba(255,255,255,0.06)',
                color: active ? color : 'rgba(255,255,255,0.3)',
                padding: '1px 7px', borderRadius: 10,
              }}>{counts[f]}</span>
            </button>
          );
        })}

        {/* Search */}
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '8px 16px',
        }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, location..."
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: 13, width: 200, fontFamily: 'inherit',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>

        {/* Table header — 5 columns (Emergency Type removed) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1.6fr 1.8fr 1.4fr 0.9fr',
          padding: '13px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          {['Booking ID', 'Customer', 'Location', 'Ambulance', 'Status'].map(h => (
            <span key={h} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 40, opacity: 0.12, marginBottom: 10 }}>🚨</div>
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
              {search ? 'No results match your search' : 'No requests yet — new bookings will appear here'}
            </div>
          </div>
        ) : (
          filtered.map((r, i) => {
            const st = STATUS_STYLE[r.status] || STATUS_STYLE.Confirmed;
            return (
              <div
                key={r.bookingId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1.6fr 1.8fr 1.4fr 0.9fr',
                  padding: '16px 24px',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  alignItems: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Booking ID */}
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>
                    {r.bookingId || '—'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 2 }}>
                    🕒 {formatDate(r.bookedAt)}
                  </div>
                </div>

                {/* Customer */}
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{r.customerName || '—'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'monospace' }}>{r.customerPhone || '—'}</span>
                    {r.customerPhone && r.customerPhone !== '—' && (
                      <a href={`tel:${r.customerPhone}`} style={{
                        background: 'rgba(0,204,102,0.12)', border: '1px solid rgba(0,204,102,0.3)',
                        color: '#00cc66', padding: '1px 7px', borderRadius: 6,
                        fontSize: 10, fontWeight: 700, textDecoration: 'none',
                      }}>📞</a>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div style={{
                  color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  paddingRight: 8,
                }} title={r.location}>
                  📍 {r.location || '—'}
                </div>

                {/* Ambulance */}
                <div>
                  <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                    {r.ambulance?.split('—')[0]?.trim() || '—'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>
                    👨‍✈️ {r.driverName || '—'}
                  </div>
                </div>

                {/* Status badge */}
                <div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: st.bg, border: `1px solid ${st.border}`, color: st.color,
                    whiteSpace: 'nowrap',
                  }}>
                    <motion.span
                      animate={r.status === 'Confirmed' || r.status === 'Accepted'
                        ? { opacity: [1, 0.3, 1] } : {}}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, flexShrink: 0, display: 'inline-block' }}
                    />
                    {r.status === 'Accepted' ? 'Confirmed' : r.status}
                  </span>
                  {r.status === 'Done' && r.completedAt && (
                    <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 4 }}>
                      ✓ {formatDate(r.completedAt)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer count */}
      {filtered.length > 0 && (
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 12, textAlign: 'right' }}>
          Showing {filtered.length} of {requests.length} request{requests.length !== 1 ? 's' : ''}
        </div>
      )}
    </AdminLayout>
  );
}
