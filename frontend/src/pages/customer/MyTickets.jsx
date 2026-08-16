import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerLayout from '../../layouts/CustomerLayout';

const EMERGENCY_LABELS = {
  accident:  'Road Accident',
  cardiac:   'Cardiac Arrest',
  stroke:    'Stroke',
  breathing: 'Breathing Problem',
  maternity: 'Maternity',
  fall:      'Fall / Fracture',
  fire:      'Fire / Burn Injury',
  other:     'Other Emergency',
};

const STATUS_STYLE = {
  Pending:   { color: '#ffaa00', bg: 'rgba(255,170,0,0.1)',   border: 'rgba(255,170,0,0.25)',   dot: '#ffaa00' },
  Active:    { color: '#3399ff', bg: 'rgba(51,153,255,0.1)',  border: 'rgba(51,153,255,0.25)',  dot: '#3399ff' },
  Completed: { color: '#00cc66', bg: 'rgba(0,204,102,0.1)',   border: 'rgba(0,204,102,0.25)',   dot: '#00cc66' },
  Cancelled: { color: '#ff5555', bg: 'rgba(255,85,85,0.08)',  border: 'rgba(255,85,85,0.2)',    dot: '#ff5555' },
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    '  ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function MyTickets() {
  const customer = JSON.parse(localStorage.getItem('resq_user') || '{}');
  const ticketsKey = `resq_tickets_${customer._id || 'guest'}`;

  const [tickets, setTickets] = useState(() =>
    JSON.parse(localStorage.getItem(ticketsKey) || '[]')
  );
  const [expanded, setExpanded] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const deleteTicket = (ticketId) => {
    const updated = tickets.filter(t => t.ticketId !== ticketId);
    setTickets(updated);
    localStorage.setItem(ticketsKey, JSON.stringify(updated));
    setConfirmDelete(null);
  };

  const clearAll = () => {
    setTickets([]);
    localStorage.removeItem(ticketsKey);
    setConfirmDelete(null);
  };

  return (
    <CustomerLayout>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>
            🎫 My Tickets
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
            {tickets.length === 0 ? 'No bookings yet' : `${tickets.length} booking${tickets.length > 1 ? 's' : ''} saved`}
          </p>
        </div>
        {tickets.length > 0 && (
          <button
            onClick={() => setConfirmDelete('__all__')}
            style={{
              padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: 'rgba(255,85,85,0.08)', border: '1px solid rgba(255,85,85,0.2)',
              color: '#ff5555', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,85,85,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,85,85,0.08)'}
          >🗑 Clear All</button>
        )}
      </div>

      {/* ── Confirm delete modal ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#0d0d1e', border: '1px solid rgba(255,85,85,0.25)',
                borderRadius: 20, padding: '32px 28px', maxWidth: 360, width: '100%',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 14 }}>🗑️</div>
              <h3 style={{ color: '#fff', fontWeight: 800, margin: '0 0 10px' }}>
                {confirmDelete === '__all__' ? 'Clear all tickets?' : 'Delete this ticket?'}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '0 0 24px' }}>
                {confirmDelete === '__all__'
                  ? 'All saved booking records will be permanently removed.'
                  : 'This booking record will be permanently removed.'}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setConfirmDelete(null)}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                  }}
                >Cancel</button>
                <button
                  onClick={() => confirmDelete === '__all__' ? clearAll() : deleteTicket(confirmDelete)}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer', fontWeight: 800, fontSize: 13,
                    background: 'linear-gradient(135deg,#ff3333,#cc0000)', border: 'none', color: '#fff',
                    boxShadow: '0 4px 16px rgba(255,51,51,0.35)',
                  }}
                >Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state ── */}
      {tickets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '90px 0' }}>
          <div style={{ fontSize: 56, opacity: 0.1, marginBottom: 16 }}>🎫</div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 600 }}>No tickets yet</div>
          <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 13, marginTop: 6 }}>
            Your bookings will appear here automatically
          </div>
        </div>
      )}

      {/* ── Ticket cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AnimatePresence>
          {tickets.map((t, i) => {
            const st    = STATUS_STYLE[t.status] || STATUS_STYLE.Pending;
            const isExp = expanded === t.ticketId;
            return (
              <motion.div
                key={t.ticketId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40, height: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isExp ? 'rgba(255,51,51,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 16, overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* ── Card header (always visible) ── */}
                <div
                  onClick={() => setExpanded(isExp ? null : t.ticketId)}
                  style={{
                    padding: '18px 22px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                  }}
                >
                  {/* Emergency icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>🚑</div>

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>
                        {EMERGENCY_LABELS[t.emergencyType] || t.emergencyType || 'Emergency'}
                      </span>
                      {/* Status badge */}
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                        background: st.bg, border: `1px solid ${st.border}`, color: st.color,
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
                        {t.status}
                      </span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'monospace' }}>
                      {t.ticketId}
                    </div>
                  </div>

                  {/* Date + chevron */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                      🕒 {formatDate(t.bookedAt)}
                    </span>
                    <motion.span
                      animate={{ rotate: isExp ? 180 : 0 }}
                      transition={{ duration: 0.22 }}
                      style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}
                    >▼</motion.span>
                  </div>
                </div>

                {/* ── Expanded detail ── */}
                <AnimatePresence>
                  {isExp && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        padding: '20px 22px 22px',
                        display: 'flex', flexDirection: 'column', gap: 0,
                      }}>
                        {/* Detail rows */}
                        {[
                          { label: 'Ambulance', value: t.ambulance },
                          { label: 'Driver',    value: t.driverName || '—' },
                          { label: 'ETA',       value: t.eta || '—' },
                          { label: 'Pickup',    value: t.location || '—' },
                        ].map((row, idx, arr) => (
                          <div key={row.label} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 0',
                            borderBottom: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                            gap: 12,
                          }}>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{row.label}</span>
                            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{row.value}</span>
                          </div>
                        ))}

                        {/* Call button (if phone exists) */}
                        {t.driverPhone && t.driverPhone !== '—' && (
                          <a
                            href={`tel:${t.driverPhone}`}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                              marginTop: 16, padding: '12px', borderRadius: 12,
                              background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.25)',
                              color: '#00cc66', fontSize: 13, fontWeight: 800, textDecoration: 'none',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,204,102,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,204,102,0.1)'}
                          >
                            📞 Call Driver — {t.driverPhone}
                          </a>
                        )}

                        {/* Delete button */}
                        <button
                          onClick={() => setConfirmDelete(t.ticketId)}
                          style={{
                            marginTop: t.driverPhone && t.driverPhone !== '—' ? 8 : 16,
                            padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                            background: 'transparent', border: '1px solid rgba(255,85,85,0.18)',
                            color: 'rgba(255,85,85,0.6)', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,85,85,0.08)'; e.currentTarget.style.color = '#ff5555'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,85,85,0.6)'; }}
                        >🗑 Delete Ticket</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </CustomerLayout>
  );
}
