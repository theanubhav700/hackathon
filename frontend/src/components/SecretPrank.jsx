import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SecretPrank() {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setVisible(true);
      document.body.style.cursor = 'none';
      document.body.style.pointerEvents = 'none';
    }, 2000);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setVisible(false);
          document.body.style.cursor = 'default';
          document.body.style.pointerEvents = 'auto';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Banner */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            style={{
              width: '100%',
              maxWidth: 680,
              margin: '0 24px',
              background: '#0a0a0f',
              border: '1px solid rgba(255,0,0,0.35)',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 0 60px rgba(255,0,0,0.2), 0 30px 80px rgba(0,0,0,0.8)',
            }}
          >
            {/* Top red bar */}
            <div style={{
              background: 'linear-gradient(135deg, #cc0000, #ff2222)',
              padding: '14px 28px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ fontSize: 18 }}
                >⚠️</motion.span>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: 2 }}>
                  CLASSIFIED ALERT
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#ff5f57','#febc2e','#28c840'].map((c,i) => (
                  <span key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c, display: 'inline-block' }} />
                ))}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '36px 40px' }}>

              {/* Icon + Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: 'rgba(255,0,0,0.1)',
                  border: '2px solid rgba(255,0,0,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 30, flexShrink: 0,
                }}>🕵️</div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 3, marginBottom: 6 }}>
                    IDENTITY EXPOSED
                  </div>
                  <div style={{
                    color: '#fff', fontSize: 26, fontWeight: 900, lineHeight: 1.1,
                  }}>
                    Secret Member <span style={{ color: '#ff3333' }}>Revealed</span>
                  </div>
                </div>
              </div>

              {/* Info rows */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '20px 24px',
                marginBottom: 24,
                display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                {[
                  { label: 'AGENT NAME',  value: 'Anubhav Tiwari',                  color: '#ff3333', icon: '👤' },
                  { label: 'STATUS',      value: 'The Real Brain Behind This 🧠',    color: '#00cc66', icon: '⚡' },
                ].map((row, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 14 }}
                  >
                    <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{row.icon}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'monospace', minWidth: 120 }}>
                      {row.label}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>:</span>
                    <span style={{ color: row.color, fontWeight: 700, fontSize: 14 }}>{row.value}</span>
                  </motion.div>
                ))}
              </div>

              {/* Footer row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: 'monospace' }}>
                  🔒 cursor.locked — releasing in
                  <span style={{ color: '#ff3333', fontWeight: 700, marginLeft: 6 }}>{countdown}s</span>
                </div>

                {/* Countdown ring */}
                <div style={{ position: 'relative', width: 48, height: 48 }}>
                  <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <circle
                      cx="24" cy="24" r="20" fill="none"
                      stroke="#ff3333" strokeWidth="3"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - countdown / 3)}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <span style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#ff3333', fontWeight: 800, fontSize: 16,
                  }}>{countdown}</span>
                </div>
              </div>

              {/* Made with love */}
              <div style={{
                marginTop: 20,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: 16,
                textAlign: 'center',
                fontSize: 13, fontWeight: 600,
              }}>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>Made with </span>
                <span style={{
                  background: 'linear-gradient(135deg,#ff3333,#ff8800,#ffdd00,#00cc66,#3399ff,#aa44ff)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  fontWeight: 800,
                }}>❤️ Love</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}> by </span>
                <span style={{
                  background: 'linear-gradient(135deg,#ff3333,#ff6600)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  fontWeight: 800, fontSize: 14,
                }}>Anubhav Tiwari</span>
                <span style={{ marginLeft: 6, fontSize: 15 }}>😊</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
