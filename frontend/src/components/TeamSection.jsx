import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const leader = {
  name: 'Aman Chaudhary',
  role: 'Project Lead & Full Stack Architect',
  color: '#ff3333',
  initials: 'AC',
};

const members = [
  { name: 'Riya Kashyap',    role: 'Frontend Developer', color: '#ff8800', initials: 'RK' },
  { name: 'Shalini Diwakar', role: 'UI/UX Designer',     color: '#aa44ff', initials: 'SD' },
  { name: 'Nikita Devi',     role: 'Backend Developer',  color: '#3399ff', initials: 'ND' },
  { name: 'Shrishti Tiwari', role: 'Database Engineer',  color: '#00cc66', initials: 'ST' },
  { name: 'Palak Singh',     role: 'QA & Testing',       color: '#ff3399', initials: 'PS' },
];

function Avatar({ member, size = 100, delay = 0, darkMode }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true });
  const namColor = darkMode ? '#fff' : '#0a0a1a';
  const roleColor = darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
    >
      {/* Circle */}
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `${member.color}18`,
        border: `3px solid ${member.color}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.3, fontWeight: 800, color: member.color,
        boxShadow: `0 0 24px ${member.color}33`,
        position: 'relative',
        transition: 'all 0.3s',
        cursor: 'default',
        overflow: 'hidden',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = `0 0 40px ${member.color}66`;
          e.currentTarget.style.borderColor = member.color;
          e.currentTarget.style.background = `${member.color}28`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = `0 0 24px ${member.color}33`;
          e.currentTarget.style.borderColor = `${member.color}66`;
          e.currentTarget.style.background = `${member.color}18`;
        }}
      >
        {/* Placeholder initials — swap with <img> later */}
        <span>{member.initials}</span>

        {/* Ping ring for leader */}
        {size > 100 && (
          <span style={{
            position: 'absolute', inset: -6, borderRadius: '50%',
            border: `2px solid ${member.color}44`,
            animation: 'pingRing 2s ease-in-out infinite',
          }} />
        )}
      </div>

      {/* Name */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: namColor, fontWeight: 700, fontSize: size > 100 ? 18 : 15 }}>
          {member.name}
        </div>
        <div style={{
          color: member.color, fontSize: 12, fontWeight: 600,
          letterSpacing: 1, textTransform: 'uppercase', marginTop: 3,
        }}>
          {member.role}
        </div>
      </div>
    </motion.div>
  );
}

export default function TeamSection({ darkMode = true }) {
  const titleRef = useRef();
  const inView = useInView(titleRef, { once: true });
  const heading = darkMode ? '#fff' : '#0a0a1a';
  const subtext = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)';
  const lineBg  = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';

  return (
    <section style={{ padding: '120px 40px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 80 }}
        >
          <div style={{
            display: 'inline-block', fontSize: 12, fontWeight: 700,
            color: '#ff3333', letterSpacing: 3,
            background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.3)',
            padding: '6px 18px', borderRadius: 20, marginBottom: 20,
          }}>OUR TEAM</div>

          <h2 style={{
            fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 900,
            color: heading, margin: '0 0 16px', lineHeight: 1.2,
          }}>
            The People Behind<br />
            <span style={{
              background: 'linear-gradient(135deg,#ff3333,#aa44ff)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Smart Ambulance
            </span>
          </h2>
          <p style={{ color: subtext, fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
            A passionate team building technology that saves lives.
          </p>
        </motion.div>

        {/* Leader — top center */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 60 }}>
          <Avatar member={leader} size={130} delay={0.1} darkMode={darkMode} />
        </div>

        {/* Connector line */}
        <div style={{
          width: 2, height: 50, background: `linear-gradient(to bottom, #ff3333, transparent)`,
          margin: '0 auto', marginBottom: 0,
        }} />

        {/* Horizontal line */}
        <div style={{ position: 'relative', height: 2, background: lineBg, marginBottom: 0 }}>
          <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 2, background: `linear-gradient(to right, transparent, #ff333344, transparent)` }} />
        </div>

        {/* 5 members row */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          gap: 48, flexWrap: 'wrap', paddingTop: 50,
        }}>
          {members.map((m, i) => (
            <Avatar key={i} member={m} size={90} delay={0.1 + i * 0.1} darkMode={darkMode} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pingRing {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 0.2; }
        }
      `}</style>
    </section>
  );
}
