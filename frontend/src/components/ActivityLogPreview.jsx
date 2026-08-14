import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const logEntries = [
  { time: '20:31:04', msg: 'Customer C102 booked AMB-101',           color: '#ff3333', icon: '📍' },
  { time: '20:31:18', msg: 'Driver Raj Kumar accepted request',       color: '#ff8800', icon: '✅' },
  { time: '20:34:52', msg: 'Ambulance AMB-101 en route to pickup',    color: '#ffaa00', icon: '🚑' },
  { time: '20:35:42', msg: 'Ambulance arrived at Sector 12',          color: '#ffdd00', icon: '📍' },
  { time: '20:36:10', msg: 'Patient received — Journey starting',     color: '#00cc66', icon: '👤' },
  { time: '20:36:15', msg: 'Route calculation started...',            color: '#3399ff', icon: '🗺️' },
  { time: '20:36:17', msg: 'Route 2 selected — ETA: 10 min ⭐',      color: '#3399ff', icon: '⭐' },
  { time: '20:36:18', msg: 'Ambulance navigating to City Hospital',   color: '#aa44ff', icon: '🏥' },
  { time: '20:48:31', msg: 'Hospital reached — City Hospital',        color: '#00cc66', icon: '🏥' },
  { time: '20:48:45', msg: 'Trip #T-2847 completed successfully',     color: '#ff3333', icon: '✅' },
];

function LiveTicker() {
  const tickers = [
    '🚑 AMB-103 dispatched to Sector 7',
    '✅ Trip #T-2849 completed',
    '📍 Driver Suresh accepted request',
    '🏥 AMB-101 arrived at hospital',
    '⚡ New booking — C108 — Sector 22',
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % tickers.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(255,51,51,0.08)', border: '1px solid rgba(255,51,51,0.2)',
      borderRadius: 8, padding: '10px 16px', marginBottom: 20, overflow: 'hidden',
    }}>
      <span style={{ fontSize: 10, fontWeight: 800, background: '#ff3333', color: '#fff', padding: '2px 8px', borderRadius: 4, letterSpacing: 1, flexShrink: 0 }}>LIVE</span>
      <motion.span key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>
        {tickers[idx]}
      </motion.span>
    </div>
  );
}

export default function ActivityLogPreview({ darkMode = true }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const heading  = darkMode ? '#fff' : '#0a0a1a';
  const subtext  = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)';
  const iconBg   = darkMode ? 'rgba(255,51,51,0.1)'  : 'rgba(255,51,51,0.08)';
  const iconBdr  = darkMode ? 'rgba(255,51,51,0.2)'  : 'rgba(255,51,51,0.15)';
  const itemClr  = darkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)';
  const timeClr  = darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)';
  const logText  = darkMode ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.9)'; // log is dark terminal
  const rowBdr   = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)';
  const statusBg = darkMode ? 'rgba(0,204,102,0.1)' : 'rgba(0,204,102,0.1)';

  return (
    <section style={{ padding: '100px 40px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 50, flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Left */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            style={{ flex: '1 1 300px' }}
          >
            <div style={{
              display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#ff3333', letterSpacing: 3,
              background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.3)',
              padding: '6px 18px', borderRadius: 20, marginBottom: 24,
            }}>ADMIN ACTIVITY LOG</div>

            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: heading, margin: '0 0 20px', lineHeight: 1.2 }}>
              Every Action.<br />
              <span style={{ background: 'linear-gradient(135deg,#ff3333,#aa44ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Logged & Timestamped.
              </span>
            </h2>
            <p style={{ color: subtext, fontSize: 15, lineHeight: 1.8, marginBottom: 32 }}>
              From the moment a customer books an ambulance to the trip completion — every single event is recorded with a precise timestamp in the Admin Activity Log.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: '🔍', text: 'Search & filter by customer, driver, ambulance' },
                { icon: '📅', text: 'Filter logs by date range' },
                { icon: '📤', text: 'Export activity report' },
                { icon: '⚡', text: 'Real-time log updates via Socket.io' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <span style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: iconBg, border: `1px solid ${iconBdr}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  }}>{item.icon}</span>
                  <span style={{ color: itemClr, fontSize: 14 }}>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — terminal log (always dark) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{ flex: '1 1 400px' }}
          >
            <div style={{
              background: '#050510',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
            }}>
              <div style={{
                padding: '14px 20px', background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginLeft: 10, fontFamily: 'monospace' }}>
                  admin@smart-ambulance — activity.log
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#fff', background: '#ff3333', padding: '2px 8px', borderRadius: 4 }}>● LIVE</span>
              </div>

              <div style={{ padding: '16px 20px' }}>
                <LiveTicker />
                {logEntries.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '10px 0', borderBottom: `1px solid ${rowBdr}`,
                    }}
                  >
                    <span style={{ fontSize: 16, minWidth: 20 }}>{entry.icon}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.3)', minWidth: 70, paddingTop: 2 }}>{entry.time}</span>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: entry.color, marginTop: 6, flexShrink: 0, boxShadow: `0 0 6px ${entry.color}` }} />
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.5 }}>{entry.msg}</span>
                  </motion.div>
                ))}
              </div>

              <div style={{
                padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.3)',
              }}>
                <span style={{ color: '#00cc66' }}>▶</span>
                <span>10 events logged — Trip #T-2847</span>
                <span style={{ marginLeft: 'auto', background: statusBg, border: '1px solid rgba(0,204,102,0.3)', color: '#00cc66', padding: '2px 10px', borderRadius: 4, fontSize: 11 }}>Trip Completed</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
