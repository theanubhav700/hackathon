import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const features = [
  { icon: '📡', title: 'Real-Time Tracking',    color: '#ff3333', desc: 'Live ambulance position updates every second using Socket.io. Both customer and driver see the same live map simultaneously.' },
  { icon: '🗺️', title: 'Multi-Route Engine',   color: '#ff6600', desc: 'Calculates 4 different routes to hospital. Compares ETA, distance and traffic. Auto-recommends the fastest path.' },
  { icon: '⚡', title: 'Instant Dispatch',      color: '#ffaa00', desc: 'As soon as a booking is made, the nearest available driver gets an instant push alert. Zero delay in emergency response.' },
  { icon: '🏥', title: 'Hospital Integration',  color: '#00cc66', desc: 'System identifies the optimal hospital route. Shows remaining distance and ETA to hospital in real-time on live map.' },
  { icon: '🔗', title: '3-Panel Sync',          color: '#3399ff', desc: 'Customer, Driver and Admin panels are all connected via shared backend. Every status change reflects instantly across all views.' },
  { icon: '📋', title: 'Complete Audit Log',    color: '#aa44ff', desc: 'Every action is timestamped and logged — from booking to trip completion. Full activity history visible in Admin dashboard.' },
  { icon: '🚑', title: 'Ambulance Types',       color: '#ff3399', desc: 'System supports Basic Life Support, Advanced Life Support and Critical Care ambulances. Customers can filter by type.' },
  { icon: '📊', title: 'Admin Analytics',       color: '#00cccc', desc: 'Admin gets full overview — active trips, driver availability, response times, completion rates and live map of all ambulances.' },
];

function FeatureCard({ feature, index, darkMode }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const cardBg   = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
  const titleClr = darkMode ? '#fff' : '#0a0a1a';
  const descClr  = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 4) * 0.1 }}
      style={{ background: cardBg, border: `1px solid ${feature.color}22`, borderRadius: 16, padding: '28px 24px', transition: 'all 0.3s', cursor: 'default' }}
      whileHover={{ y: -6, backgroundColor: `${feature.color}08`, borderColor: `${feature.color}55`, boxShadow: `0 20px 50px ${feature.color}22` }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${feature.color}18`, border: `1px solid ${feature.color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16,
      }}>{feature.icon}</div>
      <h4 style={{ color: titleClr, fontSize: 16, fontWeight: 700, margin: '0 0 10px' }}>{feature.title}</h4>
      <p style={{ color: descClr, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{feature.desc}</p>
    </motion.div>
  );
}

export default function FeaturesSection({ darkMode = true }) {
  const titleRef = useRef();
  const inView = useInView(titleRef, { once: true });
  const heading = darkMode ? '#fff' : '#0a0a1a';
  const subtext = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)';

  return (
    <section id="features" style={{ padding: '120px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div
        ref={titleRef}
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        style={{ textAlign: 'center', marginBottom: 70 }}
      >
        <div style={{
          display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#ff3333', letterSpacing: 3,
          background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.3)',
          padding: '6px 18px', borderRadius: 20, marginBottom: 20,
        }}>SYSTEM CAPABILITIES</div>
        <h2 style={{ fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: 900, color: heading, margin: '0 0 18px', lineHeight: 1.2 }}>
          Built for Speed.<br />
          <span style={{ background: 'linear-gradient(135deg,#ff3333,#aa44ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Engineered for Lives.
          </span>
        </h2>
        <p style={{ color: subtext, fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
          Every feature is designed around one goal — getting help to people faster.
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
        {features.map((f, i) => <FeatureCard key={i} feature={f} index={i} darkMode={darkMode} />)}
      </div>
    </section>
  );
}
