import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerLayout from '../../layouts/CustomerLayout';

// ── Mock booking history ──────────────────────────────────
const mockBookings = [
  {
    id: 'BK-4821', ambId: 'AMB-101', type: 'Advanced Life Support',
    driver: 'Raj Kumar', date: '14 Aug 2026', time: '08:31 PM',
    from: 'Sector 12, Noida', to: 'City Hospital, Noida',
    status: 'Completed', eta: '3 min', distance: '1.2 km',
    emergency: 'Road Accident', color: '#00cc66',
  },
  {
    id: 'BK-3910', ambId: 'AMB-203', type: 'Basic Life Support',
    driver: 'Suresh Verma', date: '10 Aug 2026', time: '03:15 PM',
    from: 'Sector 18, Noida', to: 'Max Hospital, Noida',
    status: 'Completed', eta: '6 min', distance: '2.4 km',
    emergency: 'Cardiac Arrest', color: '#00cc66',
  },
  {
    id: 'BK-3201', ambId: 'AMB-305', type: 'Critical Care',
    driver: 'Mohan Singh', date: '05 Aug 2026', time: '11:45 AM',
    from: 'Sector 62, Noida', to: 'Apollo Hospital',
    status: 'Completed', eta: '9 min', distance: '3.8 km',
    emergency: 'Fire Injury', color: '#00cc66',
  },
  {
    id: 'BK-2788', ambId: 'AMB-118', type: 'Advanced Life Support',
    driver: 'Vikram Das', date: '01 Aug 2026', time: '06:20 AM',
    from: 'Sector 45, Noida', to: 'Fortis Hospital',
    status: 'Cancelled', eta: '11 min', distance: '4.1 km',
    emergency: 'Maternity', color: '#ff3333',
  },
];

const statusColors = {
  'Completed': { bg: 'rgba(0,204,102,0.1)', border: 'rgba(0,204,102,0.3)', text: '#00cc66' },
  'Cancelled': { bg: 'rgba(255,51,51,0.1)', border: 'rgba(255,51,51,0.3)', text: '#ff3333' },
  'Active':    { bg: 'rgba(255,170,0,0.1)', border: 'rgba(255,170,0,0.3)', text: '#ffaa00' },
};

function BookingCard({ booking, index }) {
  const [expanded, setExpanded] = useState(false);
  const sc = statusColors[booking.status] || statusColors['Active'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, overflow: 'hidden',
        transition: 'all 0.3s',
      }}
    >
      {/* Main row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20 }}
      >
        {/* Booking icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: `${sc.text}18`, border: `2px solid ${sc.text}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>🚑</div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{booking.id}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{booking.ambId}</span>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`,
              padding: '2px 10px', borderRadius: 20,
            }}>● {booking.status}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
            📍 {booking.from}
            <span style={{ margin: '0 8px', color: 'rgba(255,255,255,0.2)' }}>→</span>
            🏥 {booking.to}
          </div>
        </div>

        {/* Date + time */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{booking.date}</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{booking.time}</div>
        </div>

        {/* Expand */}
        <div style={{
          color: 'rgba(255,255,255,0.3)', fontSize: 16,
          transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.3s', flexShrink: 0,
        }}>▼</div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '20px 24px 24px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                {/* Left details */}
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Trip Details</div>
                  {[
                    { label: 'Emergency',  value: booking.emergency },
                    { label: 'Driver',     value: booking.driver },
                    { label: 'Amb Type',   value: booking.type },
                    { label: 'Distance',   value: booking.distance },
                    { label: 'ETA',        value: booking.eta },
                  ].map(d => (
                    <div key={d.label} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, minWidth: 80 }}>{d.label}</span>
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{d.value}</span>
                    </div>
                  ))}
                </div>

                {/* Right — route */}
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Route</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff3333', flexShrink: 0 }} />
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{booking.from}</span>
                    </div>
                    <div style={{ width: 2, height: 24, background: 'linear-gradient(to bottom,#ff3333,#00cc66)', margin: '4px 0 4px 4px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00cc66', flexShrink: 0 }} />
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{booking.to}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {booking.status === 'Completed' && (
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button style={{
                      padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: 'rgba(255,51,51,0.12)', color: '#ff3333',
                      fontWeight: 700, fontSize: 13,
                      border: '1px solid rgba(255,51,51,0.25)',
                    }}>🔄 Rebook</button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main MyBookings page ──────────────────────────────────
export default function MyBookings() {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Completed', 'Active', 'Cancelled'];

  const filtered = filter === 'All'
    ? mockBookings
    : mockBookings.filter(b => b.status === filter);

  return (
    <CustomerLayout>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 28, margin: '0 0 6px' }}>
          📋 My Bookings
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>
          Your complete ambulance booking history
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Bookings', value: mockBookings.length, color: '#3399ff', icon: '📋' },
          { label: 'Completed',      value: mockBookings.filter(b => b.status === 'Completed').length, color: '#00cc66', icon: '✅' },
          { label: 'Cancelled',      value: mockBookings.filter(b => b.status === 'Cancelled').length, color: '#ff3333', icon: '❌' },
          { label: 'Active',         value: mockBookings.filter(b => b.status === 'Active').length, color: '#ffaa00', icon: '🔴' },
        ].map(s => (
          <div key={s.label} style={{
            flex: '1 1 140px',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${s.color}22`,
            borderRadius: 14, padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ fontSize: 26 }}>{s.icon}</span>
            <div>
              <div style={{ color: s.color, fontWeight: 900, fontSize: 24 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '8px 20px', borderRadius: 30, cursor: 'pointer',
              border: filter === f ? '2px solid #ff3333' : '1px solid rgba(255,255,255,0.1)',
              background: filter === f ? 'rgba(255,51,51,0.15)' : 'rgba(255,255,255,0.04)',
              color: filter === f ? '#ff3333' : 'rgba(255,255,255,0.55)',
              fontWeight: filter === f ? 700 : 500, fontSize: 13, transition: 'all 0.2s',
            }}
          >{f} {filter === f && `(${filtered.length})`}</button>
        ))}

        {/* Book new button */}
        <a href="/customer/book" style={{
          marginLeft: 'auto', padding: '8px 20px', borderRadius: 30,
          background: 'linear-gradient(135deg,#ff2222,#cc0000)',
          color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13,
          boxShadow: '0 4px 16px rgba(255,34,34,0.3)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>🚑 Book New</a>
      </div>

      {/* Bookings list */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '80px 20px' }}
        >
          <div style={{ fontSize: 52, marginBottom: 16 }}>📭</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>No {filter !== 'All' ? filter.toLowerCase() : ''} bookings found</div>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((booking, i) => (
            <BookingCard key={booking.id} booking={booking} index={i} />
          ))}
        </div>
      )}
    </CustomerLayout>
  );
}
