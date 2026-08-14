import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const steps = [
  { icon: '📍', step: '01', title: 'Book Ambulance',   color: '#ff3333', detail: 'GPS-based auto location detection',       desc: 'Customer enters location and emergency type. System instantly fetches all nearby available ambulances with real-time distance and ETA.' },
  { icon: '🚑', step: '02', title: 'Driver Accepts',   color: '#ff6600', detail: 'Real-time push notification to driver',    desc: 'Nearest available driver receives an instant alert. Driver reviews pickup location, distance & ETA, then accepts the emergency request.' },
  { icon: '📡', step: '03', title: 'Live Tracking',    color: '#ffaa00', detail: 'Socket.io powered live updates',           desc: 'Customer sees live ambulance movement on map. Status updates in real-time: Coming → Arrived → Patient Received → Journey Started.' },
  { icon: '🗺️', step: '04', title: 'Smart Route',     color: '#00cc66', detail: 'Multi-route comparison engine',            desc: 'System calculates 4 possible routes to hospital. Compares ETA, distance and traffic. Auto-recommends the fastest path.' },
  { icon: '🏥', step: '05', title: 'Hospital Arrived', color: '#3399ff', detail: 'Auto activity log generation',            desc: 'Ambulance navigates to hospital on optimal route. Patient and admin both see live progress. Trip logs saved automatically on arrival.' },
  { icon: '📊', step: '06', title: 'Admin Logged',     color: '#aa44ff', detail: 'Complete audit trail in MongoDB',         desc: 'Every action — booking, acceptance, arrival, route selection, trip completion — is timestamped and stored in Admin activity dashboard.' },
];

const statusFlow = [
  { label: 'Request Sent',       color: '#ff3333' },
  { label: 'Driver Accepted',    color: '#ff6600' },
  { label: 'Ambulance Coming',   color: '#ffaa00' },
  { label: 'Ambulance Arrived',  color: '#ffdd00' },
  { label: 'Patient Received',   color: '#00cc66' },
  { label: 'Journey Started',    color: '#3399ff' },
  { label: 'Hospital Arrived',   color: '#aa44ff' },
];

function StepCard({ step, index, darkMode }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const cardBg     = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
  const cardHoverBg = `${step.color}0d`;
  const titleColor = darkMode ? '#fff' : '#0a0a1a';
  const descColor  = darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -60 : 60 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: index % 2 === 0 ? 'row' : 'row-reverse', alignItems: 'center', gap: 40, marginBottom: 60 }}
    >
      <div
        style={{
          flex: 1, background: cardBg,
          border: `1px solid ${step.color}33`,
          borderLeft: `4px solid ${step.color}`,
          borderRadius: 16, padding: '32px 36px',
          position: 'relative', overflow: 'hidden', transition: 'all 0.3s', cursor: 'default',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = cardHoverBg;
          e.currentTarget.style.boxShadow = `0 0 40px ${step.color}22`;
          e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = cardBg;
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{
          position: 'absolute', top: -10, right: 20,
          fontSize: 100, fontWeight: 900, color: `${step.color}08`,
          lineHeight: 1, userSelect: 'none',
        }}>{step.step}</div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, position: 'relative' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: `${step.color}22`, border: `1px solid ${step.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, flexShrink: 0,
          }}>{step.icon}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: step.color,
                background: `${step.color}22`, padding: '3px 10px', borderRadius: 20, letterSpacing: 1,
              }}>STEP {step.step}</span>
            </div>
            <h3 style={{ color: titleColor, fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>{step.title}</h3>
            <p style={{ color: descColor, fontSize: 14, lineHeight: 1.7, margin: '0 0 14px' }}>{step.desc}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: step.color, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: step.color, display: 'inline-block' }} />
              {step.detail}
            </div>
          </div>
        </div>
      </div>
      <div style={{ width: 2, height: 80, flexShrink: 0, background: `linear-gradient(to bottom, ${step.color}, transparent)`, borderRadius: 2 }} />
      <div style={{ flex: 1 }} />
    </motion.div>
  );
}

function StatusBadge({ item, index, darkMode }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true });
  const badgeBg = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const labelColor = darkMode ? '#fff' : '#111';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4, delay: index * 0.12 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: badgeBg, border: `1px solid ${item.color}44`,
        borderRadius: 30, padding: '10px 20px', whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, boxShadow: `0 0 8px ${item.color}`, display: 'inline-block' }} />
      <span style={{ color: labelColor, fontSize: 13, fontWeight: 600 }}>{item.label}</span>
    </motion.div>
  );
}

export default function HowItWorks({ darkMode = true }) {
  const titleRef = useRef();
  const titleInView = useInView(titleRef, { once: true });

  const heading  = darkMode ? '#fff' : '#0a0a1a';
  const subtext  = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)';
  const stripBg  = darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)';
  const stripBdr = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const labelClr = darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)';

  return (
    <section id="how-it-works" style={{ padding: '120px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div
        ref={titleRef}
        initial={{ opacity: 0, y: 40 }}
        animate={titleInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        style={{ textAlign: 'center', marginBottom: 80 }}
      >
        <div style={{
          display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#ff3333',
          letterSpacing: 3, background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.3)',
          padding: '6px 18px', borderRadius: 20, marginBottom: 20,
        }}>Complete Flow</div>
        <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, color: heading, margin: '0 0 20px', lineHeight: 1.15 }}>
          How It Works —<br />
          <span style={{ background: 'linear-gradient(135deg,#ff3333,#ff6600)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            From Booking to Hospital
          </span>
        </h2>
        <p style={{ color: subtext, fontSize: 17, maxWidth: 560, margin: '0 auto' }}>
          A complete emergency response journey — fully digitized, real-time, and connected across 3 panels.
        </p>
      </motion.div>

      {/* Status flow strip */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 90,
        padding: '28px 32px', background: stripBg, border: `1px solid ${stripBdr}`, borderRadius: 20,
      }}>
        <div style={{ width: '100%', textAlign: 'center', color: labelClr, fontSize: 11, letterSpacing: 2, fontWeight: 700, marginBottom: 14, textTransform: 'uppercase' }}>
          Live Status Flow
        </div>
        {statusFlow.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge item={item} index={i} darkMode={darkMode} />
            {i < statusFlow.length - 1 && (
              <span style={{ color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)', fontSize: 18 }}>→</span>
            )}
          </div>
        ))}
      </div>

      {/* Steps */}
      <div>
        {steps.map((step, i) => <StepCard key={i} step={step} index={i} darkMode={darkMode} />)}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }`}</style>
    </section>
  );
}
