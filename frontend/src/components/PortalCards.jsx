import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const portals = [
  {
    icon: '👤', title: 'Customer Portal', subtitle: 'Book & Track',
    color: '#ff3333', glow: 'rgba(255,51,51,0.4)', gradient: 'linear-gradient(135deg, #ff3333, #cc0000)',
    href: '/customer/book', badge: 'PATIENT',
    features: ['📍 Auto GPS location detection','🚑 View nearby ambulances live','📏 Real-time distance & ETA','👨‍✈️ Driver & ambulance details','📡 Live trip status updates','🗺️ Live map tracking','📋 Booking history'],
    cta: 'Book Ambulance', stats: [{ label: 'Avg Response', value: '4 min' }, { label: 'Success Rate', value: '99.2%' }],
  },
  {
    icon: '🚑', title: 'Driver Panel', subtitle: 'Respond & Navigate',
    color: '#ff8800', glow: 'rgba(255,136,0,0.4)', gradient: 'linear-gradient(135deg, #ff8800, #cc5500)',
    href: '/driver/dashboard', badge: 'DRIVER',
    features: ['🔔 Instant emergency alerts','📍 Customer pickup location','✅ One-tap Accept / Decline','🗺️ Turn-by-turn navigation','🔄 Step-by-step trip flow','🏥 Best route to hospital','📊 Trip history & earnings'],
    cta: 'Driver Login', stats: [{ label: 'Active Trips', value: '12' }, { label: 'Drivers Online', value: '48' }],
  },
  {
    icon: '🖥️', title: 'Admin Dashboard', subtitle: 'Monitor & Control',
    color: '#3399ff', glow: 'rgba(51,153,255,0.4)', gradient: 'linear-gradient(135deg, #3399ff, #0055cc)',
    href: '/admin/dashboard', badge: 'ADMIN',
    features: ['🚑 All ambulances live view','👨‍✈️ Driver management','👥 Customer overview','🚨 Active emergencies','🗺️ All trips on map','📋 Complete activity log','📊 Analytics & reports'],
    cta: 'Admin Login', stats: [{ label: 'Total Trips', value: '1,240' }, { label: 'Ambulances', value: '36' }],
  },
];

function PortalCard({ portal, index, darkMode }) {
  const ref = useRef();
  const cardRef = useRef();
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const cardBg    = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
  const cardHover = darkMode ? 'linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))' : `linear-gradient(145deg,${portal.color}0d,${portal.color}06)`;
  const titleClr  = darkMode ? '#fff' : '#0a0a1a';
  const featClr   = darkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)';
  const statLbl   = darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)';

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setTilt({ x: dy * -4, y: dx * 4 });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 80 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15 }}
      style={{ flex: 1, minWidth: 300, perspective: 1000 }}
    >
      <div
        ref={cardRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ height: '100%' }}
      >
        <div style={{
          background: hovered ? cardHover : cardBg,
          border: `1px solid ${hovered ? portal.color + '66' : portal.color + '22'}`,
          borderRadius: 24, padding: '36px 32px', height: '100%', boxSizing: 'border-box',
          boxShadow: hovered ? `0 30px 80px ${portal.glow}, 0 0 0 1px ${portal.color}33` : 'none',
          transition: 'all 0.3s', position: 'relative', overflow: 'hidden', cursor: 'default',
        }}>
          <div style={{
            position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%',
            background: `radial-gradient(circle, ${portal.color}15, transparent 70%)`,
            opacity: hovered ? 1 : 0.4, transition: 'opacity 0.3s',
          }} />

          <div style={{
            display: 'inline-block', fontSize: 10, fontWeight: 800, color: portal.color, letterSpacing: 2,
            background: `${portal.color}15`, border: `1px solid ${portal.color}33`,
            padding: '4px 12px', borderRadius: 20, marginBottom: 24,
          }}>{portal.badge}</div>

          <div style={{
            width: 70, height: 70, borderRadius: 18,
            background: `${portal.color}15`, border: `2px solid ${portal.color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 20,
            boxShadow: hovered ? `0 0 30px ${portal.color}44` : 'none', transition: 'box-shadow 0.3s',
          }}>{portal.icon}</div>

          <h3 style={{ color: titleClr, fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>{portal.title}</h3>
          <p style={{ color: portal.color, fontSize: 13, fontWeight: 600, margin: '0 0 24px', letterSpacing: 1, textTransform: 'uppercase' }}>{portal.subtitle}</p>

          <div style={{ height: 1, background: `linear-gradient(to right, ${portal.color}44, transparent)`, marginBottom: 24 }} />

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px' }}>
            {portal.features.map((f, i) => (
              <li key={i} style={{
                color: featClr, fontSize: 13, padding: '6px 0',
                display: 'flex', alignItems: 'center', gap: 8,
                borderBottom: darkMode ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.05)',
              }}>
                <span style={{ minWidth: 4, height: 4, borderRadius: '50%', background: portal.color, display: 'inline-block' }} />
                {f}
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
            {portal.stats.map((s, i) => (
              <div key={i} style={{
                flex: 1, background: `${portal.color}0d`, border: `1px solid ${portal.color}22`,
                borderRadius: 10, padding: '10px 14px', textAlign: 'center',
              }}>
                <div style={{ color: portal.color, fontSize: 18, fontWeight: 800 }}>{s.value}</div>
                <div style={{ color: statLbl, fontSize: 11, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <a href={portal.href} style={{
            display: 'block', textAlign: 'center', padding: '14px', borderRadius: 12,
            background: hovered ? portal.gradient : 'transparent',
            border: `2px solid ${portal.color}`,
            color: hovered ? '#fff' : portal.color,
            fontWeight: 700, fontSize: 14, letterSpacing: 0.5, textDecoration: 'none',
            transition: 'all 0.3s',
            boxShadow: hovered ? `0 8px 30px ${portal.glow}` : 'none',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = portal.gradient; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { if (hovered) { e.currentTarget.style.background = portal.gradient; } }}
          >{portal.cta} →</a>
        </div>
      </div>
    </motion.div>
  );
}

export default function PortalCards({ darkMode = true }) {
  const titleRef = useRef();
  const inView = useInView(titleRef, { once: true });
  const heading  = darkMode ? '#fff' : '#0a0a1a';
  const subtext  = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)';
  const chipBg   = darkMode ? 'rgba(5,5,20,0.85)' : 'rgba(240,240,248,0.95)';
  const chipBdr  = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)';
  const chipClr  = darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
  const sectionBg = darkMode
    ? 'linear-gradient(180deg, transparent, rgba(255,30,30,0.03) 50%, transparent)'
    : 'linear-gradient(180deg, transparent, rgba(255,30,30,0.015) 50%, transparent)';

  return (
    <section id="portals" style={{ padding: '120px 40px', background: sectionBg }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
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
          }}>3 CONNECTED PANELS</div>
          <h2 style={{ fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: 900, color: heading, margin: '0 0 18px', lineHeight: 1.2 }}>
            One System.<br />
            <span style={{ background: 'linear-gradient(135deg,#ff3333,#3399ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Three Powerful Portals.
            </span>
          </h2>
          <p style={{ color: subtext, fontSize: 16, maxWidth: 540, margin: '0 auto' }}>
            Customer, Driver and Admin — all connected in real-time through a single backend. Every action instantly reflected across all panels.
          </p>
        </motion.div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'stretch' }}>
          {portals.map((portal, i) => <PortalCard key={i} portal={portal} index={i} darkMode={darkMode} />)}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.6 }}
          style={{
            marginTop: 50, padding: '20px 32px',
            background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)',
            border: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap',
          }}
        >
          {['Customer', 'Backend (Socket.io)', 'Driver', 'Admin'].map((item, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                padding: '8px 18px', borderRadius: 8,
                background: i === 1 ? 'rgba(255,51,51,0.15)' : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                border: i === 1 ? '1px solid rgba(255,51,51,0.3)' : (darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'),
                color: i === 1 ? '#ff3333' : chipClr,
                fontSize: 13, fontWeight: 600,
              }}>{item}</div>
              {i < arr.length - 1 && (
                <span style={{ color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)', fontSize: 20 }}>⟷</span>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
