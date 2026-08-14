import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import Navbar from '../components/Navbar';
import AmbulanceScene from '../components/AmbulanceScene';
import HowItWorks from '../components/HowItWorks';
import PortalCards from '../components/PortalCards';
import TeamSection from '../components/TeamSection';
import StatsSection from '../components/StatsSection';
import ActivityLogPreview from '../components/ActivityLogPreview';
import Footer from '../components/Footer';

// ── Hero CTA button ──────────────────────────────────────
function HeroCTA({ href, primary, darkMode, children }) {
  return (
    <a
      href={href}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '15px 32px', borderRadius: 10, fontSize: 15, fontWeight: 700,
        textDecoration: 'none', letterSpacing: 0.5, transition: 'all 0.25s',
        ...(primary
          ? {
              background: 'linear-gradient(135deg,#ff2222,#cc0000)',
              color: '#fff',
              boxShadow: '0 0 30px rgba(255,34,34,0.45)',
            }
          : {
              background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
              color: darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
              border: darkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.2)',
            }),
      }}
      onMouseEnter={(e) => {
        if (primary) {
          e.currentTarget.style.boxShadow = '0 0 50px rgba(255,34,34,0.7)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        } else {
          e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        if (primary) e.currentTarget.style.boxShadow = '0 0 30px rgba(255,34,34,0.45)';
        else e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
      }}
    >
      {children}
    </a>
  );
}

// ── Scrolling ticker strip ───────────────────────────────
function TickerStrip({ darkMode }) {
  const items = [
    '🚑 Real-Time Ambulance Tracking',
    '📡 Socket.io Live Updates',
    '🗺️ Multi-Route Engine',
    '🏥 Smart Hospital Navigation',
    '👤 Customer Portal',
    '🚑 Driver Dashboard',
    '🖥️ Admin Control Panel',
    '📋 Activity Log',
    '⚡ 4-Min Avg Response',
    '✅ 99.2% Success Rate',
  ];
  const repeated = [...items, ...items];

  return (
    <div style={{
      overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.04)',
      padding: '12px 0',
    }}>
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'flex', gap: 48, whiteSpace: 'nowrap', width: 'max-content' }}
      >
        {repeated.map((item, i) => (
          <span key={i} style={{
            color: darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.55)',
            fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {item}
            <span style={{ color: 'rgba(255,51,51,0.4)', fontSize: 10 }}>◆</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Map preview mockup ───────────────────────────────────
function MapMockup() {
  return (
    <div style={{
      background: '#0a1628',
      border: '1px solid rgba(51,153,255,0.2)',
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(51,153,255,0.1)',
      position: 'relative',
    }}>
      {/* Header bar */}
      <div style={{
        padding: '12px 18px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        <span style={{
          marginLeft: 10, color: 'rgba(255,255,255,0.3)',
          fontSize: 12, fontFamily: 'monospace',
        }}>Live Map — AMB-101</span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, color: '#fff',
          background: '#ff3333', padding: '2px 8px', borderRadius: 4, fontWeight: 700,
        }}>● LIVE</span>
      </div>

      {/* Fake map grid */}
      <div style={{
        height: 220, position: 'relative',
        background: 'linear-gradient(135deg, #0d1f3c, #0a1628)',
        overflow: 'hidden',
      }}>
        {/* Grid lines */}
        {[...Array(8)].map((_, i) => (
          <div key={`h${i}`} style={{
            position: 'absolute', left: 0, right: 0,
            top: `${(i + 1) * 12.5}%`, height: 1,
            background: 'rgba(51,153,255,0.08)',
          }} />
        ))}
        {[...Array(10)].map((_, i) => (
          <div key={`v${i}`} style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${(i + 1) * 10}%`, width: 1,
            background: 'rgba(51,153,255,0.08)',
          }} />
        ))}

        {/* Route line */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <path d="M 80 160 Q 160 80 260 100 T 420 60" stroke="#3399ff" strokeWidth="2.5"
            fill="none" strokeDasharray="6,4" opacity="0.7" />
          <path d="M 80 160 Q 200 140 300 120 T 420 60" stroke="#00cc66" strokeWidth="3"
            fill="none" opacity="0.9" />
        </svg>

        {/* Ambulance marker */}
        <motion.div
          animate={{ x: [0, 40, 80, 120], y: [0, -15, -25, -40] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', left: 70, top: 140,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,51,51,0.2)',
            border: '2px solid #ff3333',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, zIndex: 2,
          }}
        >🚑</motion.div>

        {/* Pickup pin */}
        <div style={{
          position: 'absolute', left: 65, top: 145,
          width: 12, height: 12, borderRadius: '50%',
          background: '#ff3333',
          boxShadow: '0 0 12px #ff3333',
          zIndex: 1,
        }} />

        {/* Hospital marker */}
        <div style={{
          position: 'absolute', right: 50, top: 45,
          background: 'rgba(0,204,102,0.2)',
          border: '2px solid #00cc66',
          borderRadius: 8, padding: '4px 8px',
          color: '#00cc66', fontSize: 12, fontWeight: 700,
        }}>🏥 Hospital</div>

        {/* ETA badge */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%,-50%)',
          background: 'rgba(5,5,20,0.85)',
          border: '1px solid rgba(51,153,255,0.3)',
          borderRadius: 10, padding: '8px 14px',
          textAlign: 'center',
        }}>
          <div style={{ color: '#3399ff', fontSize: 18, fontWeight: 800 }}>10 min</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>ETA to Hospital</div>
        </div>
      </div>

      {/* Route info bar */}
      <div style={{
        padding: '12px 18px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        {[
          { label: 'Distance', value: '8.2 km', color: '#3399ff' },
          { label: 'ETA', value: '10 min ⭐', color: '#00cc66' },
          { label: 'Route', value: 'Route 2', color: '#ffaa00' },
          { label: 'Status', value: '● Moving', color: '#ff3333' },
        ].map((item) => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <div style={{ color: item.color, fontSize: 13, fontWeight: 700 }}>{item.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hero Section ─────────────────────────────────────────
function HeroSection({ darkMode }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true });

  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', position: 'relative',
      padding: '120px 40px 60px', overflow: 'hidden',
    }}>
      {/* 3D Scene — full background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        pointerEvents: 'none',
      }}>
        <AmbulanceScene />
      </div>

      {/* Dark overlay so text stays readable */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: darkMode
          ? 'linear-gradient(to right, rgba(5,5,15,0.55) 30%, rgba(5,5,15,0.05) 100%)'
          : 'linear-gradient(to right, rgba(244,244,248,0.65) 30%, rgba(244,244,248,0.05) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        maxWidth: 1100, margin: '0 auto', width: '100%',
        display: 'flex', gap: 60, alignItems: 'center', flexWrap: 'wrap',
      }}>
        {/* Left — text */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: -60 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{ flex: '1 1 460px' }}
        >
          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,51,51,0.12)',
              border: '1px solid rgba(255,51,51,0.35)',
              borderRadius: 30, padding: '7px 16px', marginBottom: 32,
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#ff3333',
              boxShadow: '0 0 8px #ff3333', animation: 'livePulse 1.5s infinite',
            }} />
            <span style={{ color: '#ff6666', fontSize: 13, fontWeight: 600 }}>
              Smart Emergency Response System
            </span>
          </motion.div>

          {/* Main heading */}
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 900,
            color: darkMode ? '#fff' : '#0a0a1a',
            margin: '0 0 24px', lineHeight: 1.08, letterSpacing: -1,
          }}>
            Emergency Help<br />
            <span style={{
              background: 'linear-gradient(135deg, #ff2222 0%, #ff6600 50%, #ffaa00 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              In Minutes.
            </span>
          </h1>

          <p style={{
            color: darkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)',
            fontSize: 17, lineHeight: 1.8,
            margin: '0 0 40px', maxWidth: 480,
          }}>
            A complete web-based Smart Ambulance Management System — connecting patients, drivers and hospitals in real-time for the fastest possible emergency response.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
            <HeroCTA href="/customer/book" primary darkMode={darkMode}>🚑 Book Ambulance Now</HeroCTA>
            <HeroCTA href="#how-it-works" darkMode={darkMode}>Watch How It Works →</HeroCTA>
          </div>

          {/* Quick stats row */}
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[
              { value: '4 min',  label: 'Avg Response' },
              { value: '99.2%', label: 'Success Rate' },
              { value: '36+',   label: 'Ambulances' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ color: '#ff3333', fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                <div style={{ color: darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)', fontSize: 12, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right — map mockup only */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
          style={{ flex: '1 1 420px' }}
        >
          <MapMockup />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          position: 'absolute', bottom: 30, left: '50%',
          transform: 'translateX(-50%)', zIndex: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          fontSize: 11, letterSpacing: 2,
        }}
      >
        <span>SCROLL</span>
        <span style={{ fontSize: 18 }}>↓</span>
      </motion.div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #ff3333; }
          50% { opacity: 0.4; box-shadow: 0 0 16px #ff3333; }
        }
      `}</style>
    </section>
  );
}

// ── Full Landing Page ─────────────────────────────────────
export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(true);
  const toggleDarkMode = () => setDarkMode(d => !d);

  return (
    <div style={{
      background: darkMode ? '#05050f' : '#f4f4f8',
      minHeight: '100vh',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      color: darkMode ? '#fff' : '#111',
      overflowX: 'hidden',
      transition: 'background 0.35s ease, color 0.35s ease',
    }}>
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <HeroSection darkMode={darkMode} />
      <StatsSection darkMode={darkMode} />
      <HowItWorks darkMode={darkMode} />
      <PortalCards darkMode={darkMode} />
      <TeamSection darkMode={darkMode} />
      <ActivityLogPreview darkMode={darkMode} />
      <Footer darkMode={darkMode} />
    </div>
  );
}
