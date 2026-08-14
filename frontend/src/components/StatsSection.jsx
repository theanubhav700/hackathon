import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const stats = [
  { value: 4,    suffix: ' min',    label: 'Avg Response Time',    icon: '⚡',  color: '#ff3333' },
  { value: 99.2, suffix: '%',       label: 'Booking Success Rate', icon: '✅',  color: '#00cc66' },
  { value: 36,   suffix: '+',       label: 'Ambulances Connected', icon: '🚑',  color: '#ff8800' },
  { value: 1240, suffix: '+',       label: 'Trips Completed',      icon: '📋',  color: '#3399ff' },
  { value: 3,    suffix: '',        label: 'Panels Connected',     icon: '🔗',  color: '#aa44ff' },
  { value: 4,    suffix: ' routes', label: 'Per Hospital Trip',    icon: '🗺️', color: '#ffaa00' },
  { value: 48,   suffix: '+',       label: 'Drivers Online',       icon: '👨‍✈️', color: '#ff3399' },
  { value: 24,   suffix: '/7',      label: 'System Uptime',        icon: '🕐',  color: '#00cccc' },
  { value: 2.4,  suffix: ' km',     label: 'Avg Pickup Distance',  icon: '📍',  color: '#ffdd00' },
  { value: 8,    suffix: ' min',    label: 'Avg Hospital ETA',     icon: '🏥',  color: '#44ff88' },
];

function CountUp({ target, suffix, active }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    const duration = 1800, steps = 60, increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(parseFloat(current.toFixed(1)));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [active, target]);

  return <span>{typeof target === 'number' && target % 1 !== 0 ? count.toFixed(1) : Math.floor(count)}{suffix}</span>;
}

export default function StatsSection({ darkMode = true }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const heading  = darkMode ? '#fff' : '#0a0a1a';
  const subtext  = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)';
  const cardBg   = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
  const sectionBg = darkMode
    ? 'linear-gradient(180deg, transparent, rgba(255,30,30,0.04), transparent)'
    : 'linear-gradient(180deg, transparent, rgba(255,30,30,0.02), transparent)';

  return (
    <section id="stats" style={{ padding: '100px 40px', background: sectionBg }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <div style={{
            display: 'inline-block', fontSize: 12, fontWeight: 700,
            color: '#ff3333', letterSpacing: 3,
            background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.3)',
            padding: '6px 18px', borderRadius: 20, marginBottom: 20,
          }}>LIVE NUMBERS</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: heading, margin: 0 }}>
            System at a{' '}
            <span style={{ background: 'linear-gradient(135deg,#ff3333,#ff8800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Glance
            </span>
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                background: cardBg,
                border: `1px solid ${s.color}22`,
                borderRadius: 18, padding: '28px 20px',
                textAlign: 'center', transition: 'all 0.3s',
              }}
              whileHover={{ y: -5, borderColor: `${s.color}55`, boxShadow: `0 20px 50px ${s.color}22` }}
            >
              <div style={{ fontSize: 30, marginBottom: 10 }}>{s.icon}</div>
              <div style={{
                fontSize: 36, fontWeight: 900, color: s.color,
                fontVariantNumeric: 'tabular-nums',
                textShadow: darkMode ? `0 0 20px ${s.color}66` : 'none',
                lineHeight: 1,
              }}>
                <CountUp target={s.value} suffix={s.suffix} active={inView} />
              </div>
              <div style={{ color: subtext, fontSize: 12, fontWeight: 500, marginTop: 8, lineHeight: 1.4 }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
