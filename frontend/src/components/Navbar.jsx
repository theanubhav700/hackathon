import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Navbar({ darkMode, toggleDarkMode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navBg = darkMode
    ? scrolled
      ? 'rgba(5,5,15,0.92)'
      : 'rgba(5,5,15,0.6)'
    : scrolled
      ? 'rgba(255,255,255,0.92)'
      : 'rgba(255,255,255,0.5)';

  const borderBottom = darkMode
    ? '1px solid rgba(255,40,40,0.25)'
    : '1px solid rgba(255,40,40,0.2)';

  const linkColor = darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(20,20,40,0.8)';
  const linkHover = '#ff3333';

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '14px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: navBg,
        backdropFilter: 'blur(20px)',
        borderBottom: borderBottom,
        transition: 'all 0.4s ease',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 38, height: 38,
          background: 'linear-gradient(135deg,#ff2222,#cc0000)',
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, boxShadow: '0 0 20px rgba(255,34,34,0.5)',
        }}>🚑</div>
        <div>
          <div style={{
            color: darkMode ? '#fff' : '#111',
            fontWeight: 800, fontSize: 16, letterSpacing: 1,
          }}>ResQ</div>
          <div style={{
            color: '#ff3333', fontWeight: 700, fontSize: 11,
            letterSpacing: 3, marginTop: -3,
          }}>EMERGENCY RESPONSE</div>
        </div>
      </div>

      {/* Team name - center */}
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 18px',
        borderRadius: 8,
        border: darkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.15)',
        background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        backdropFilter: 'blur(10px)',
      }}>
        <span style={{ fontSize: 15 }}>⚡</span>
        <span style={{
          fontWeight: 700, fontSize: 14, letterSpacing: 1,
          color: darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
        }}>Team </span>
        <span style={{
          fontWeight: 800, fontSize: 14, letterSpacing: 1,
          background: 'linear-gradient(135deg,#ff3333,#ff8800)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Byte Busters</span>
      </div>

      {/* Right side — theme toggle + login + CTA */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleDarkMode}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
            background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
            transition: 'all 0.25s',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = darkMode
              ? 'rgba(255,255,255,0.15)'
              : 'rgba(0,0,0,0.13)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = darkMode
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.07)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* Login */}
        <a
          href="/login"
          style={{
            padding: '9px 22px', borderRadius: 6, fontSize: 13, fontWeight: 600,
            border: darkMode
              ? '1px solid rgba(255,255,255,0.2)'
              : '1px solid rgba(0,0,0,0.18)',
            color: darkMode ? '#fff' : '#111',
            textDecoration: 'none', transition: 'all 0.2s',
            background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = darkMode
              ? 'rgba(255,255,255,0.12)'
              : 'rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = darkMode
              ? 'rgba(255,255,255,0.4)'
              : 'rgba(0,0,0,0.35)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = darkMode
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(0,0,0,0.04)';
            e.currentTarget.style.borderColor = darkMode
              ? 'rgba(255,255,255,0.2)'
              : 'rgba(0,0,0,0.18)';
          }}
        >Login</a>

        {/* Book Now */}
        <a
          href="/customer/book"
          style={{
            padding: '9px 22px', borderRadius: 6, fontSize: 13, fontWeight: 700,
            background: 'linear-gradient(135deg,#ff2222,#cc0000)',
            color: '#fff', textDecoration: 'none',
            boxShadow: '0 0 20px rgba(255,34,34,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 30px rgba(255,34,34,0.7)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(255,34,34,0.4)'}
        >🚑 Book Now</a>
      </div>
    </motion.nav>
  );
}
