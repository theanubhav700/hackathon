import { useState } from 'react';
import DriverLayout from '../../layouts/DriverLayout';
import { motion, AnimatePresence } from 'framer-motion';

const FILTERS = ['All', 'New Emergency', 'Request Accepted', 'Traffic Alert', 'Route Change', 'Hospital Alert', 'System'];

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [filter, setFilter] = useState('All');

  const unreadCount = notifs.filter(n => !n.read).length;
  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const markRead    = (id) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  const remove      = (id) => setNotifs(n => n.filter(x => x.id !== id));

  const filtered = filter === 'All' ? notifs : notifs.filter(n => n.type === filter);

  return (
    <DriverLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>
            🔔 Notifications
            {unreadCount > 0 && (
              <span style={{ marginLeft: 12, background: '#ff3333', borderRadius: '50%', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', verticalAlign: 'middle' }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ padding: '9px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13 }}>
            Mark all read
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: filter === f ? 'rgba(255,136,0,0.15)' : 'rgba(255,255,255,0.04)',
            border: filter === f ? '1px solid rgba(255,136,0,0.35)' : '1px solid rgba(255,255,255,0.08)',
            color: filter === f ? '#ff8800' : 'rgba(255,255,255,0.4)',
          }}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 52, opacity: 0.12, marginBottom: 14 }}>🔔</div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 15 }}>No notifications yet</div>
          <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 13, marginTop: 6 }}>Alerts will appear here in real time</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnimatePresence>
            {filtered.map((n, i) => (
              <motion.div key={n.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40, height: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => markRead(n.id)}
                style={{
                  background: n.read ? 'rgba(255,255,255,0.02)' : `${n.color}08`,
                  border: n.read ? '1px solid rgba(255,255,255,0.06)' : `1px solid ${n.color}30`,
                  borderRadius: 14, padding: '16px 20px',
                  display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer',
                }}>
                <div style={{ paddingTop: 4, flexShrink: 0 }}>
                  {!n.read ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.color, boxShadow: `0 0 6px ${n.color}` }} /> : <div style={{ width: 8, height: 8 }} />}
                </div>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{n.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ color: n.read ? 'rgba(255,255,255,0.6)' : '#fff', fontWeight: n.read ? 500 : 700, fontSize: 14 }}>{n.title}</span>
                    <span style={{ background: `${n.color}15`, border: `1px solid ${n.color}30`, color: n.color, fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 10 }}>{n.type}</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.5 }}>{n.body}</div>
                  <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 6 }}>🕒 {n.time}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); remove(n.id); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: 16, padding: 0, flexShrink: 0 }}>✕</button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </DriverLayout>
  );
}
