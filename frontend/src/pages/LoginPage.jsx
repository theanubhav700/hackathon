import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const roles = [
  { id: 'customer', label: 'Customer',  icon: '👤', color: '#ff3333', desc: 'Book & track ambulance',     redirect: '/customer/book' },
  { id: 'driver',   label: 'Driver',    icon: '🚑', color: '#ff8800', desc: 'Respond to emergencies',    redirect: '/driver/dashboard' },
  { id: 'admin',    label: 'Admin',     icon: '🖥️', color: '#3399ff', desc: 'Monitor & manage system',   redirect: '/admin/dashboard' },
];

function GlassInput({ label, type = 'text', value, onChange, placeholder, icon, extra }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block', color: 'rgba(255,255,255,0.5)',
        fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
        textTransform: 'uppercase', marginBottom: 8,
      }}>{label}</label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: focused ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
        border: focused ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, padding: '13px 16px',
        transition: 'all 0.25s',
      }}>
        <span style={{ fontSize: 17, opacity: 0.6 }}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#fff', fontSize: 14, fontFamily: 'inherit',
          }}
        />
        {extra}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState('customer');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const activeRole = roles.find(r => r.id === selectedRole);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill all fields'); return; }
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    window.location.href = activeRole.redirect;
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      background: '#05050f',
      overflow: 'hidden',
    }}>
      {/* ── LEFT PANEL ─────────────────────────────────── */}
      <div style={{
        flex: '1 1 60%',
        background: `linear-gradient(135deg, #0a0a1a 0%, #0f0510 50%, #0a0a1a 100%)`,
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 70px',
      }}>
        {/* Glow bg */}
        <div style={{
          position: 'absolute', top: '20%', left: '20%',
          width: 500, height: 500, borderRadius: '50%',
          background: `radial-gradient(circle, ${activeRole.color}15, transparent 65%)`,
          transition: 'background 0.6s', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(51,153,255,0.08), transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* Grid pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: 60 }}>
          <a href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            textDecoration: 'none',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg,#ff2222,#cc0000)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, boxShadow: '0 0 24px rgba(255,34,34,0.4)',
            }}>🚑</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 20, letterSpacing: 1 }}>ResQ</div>
              <div style={{ color: '#ff3333', fontSize: 10, fontWeight: 700, letterSpacing: 3 }}>EMERGENCY RESPONSE</div>
            </div>
          </a>
        </div>

        {/* Main left content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            key={selectedRole}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `${activeRole.color}18`,
              border: `1px solid ${activeRole.color}33`,
              borderRadius: 30, padding: '6px 16px', marginBottom: 24,
            }}>
              <span style={{ fontSize: 16 }}>{activeRole.icon}</span>
              <span style={{ color: activeRole.color, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
                {activeRole.label.toUpperCase()} PORTAL
              </span>
            </div>

            <h1 style={{
              color: '#fff', fontWeight: 900, margin: '0 0 20px',
              fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.1, letterSpacing: -1,
            }}>
              Welcome to<br />
              <span style={{
                background: `linear-gradient(135deg, ${activeRole.color}, ${activeRole.color}99)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>ResQ System</span>
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.45)', fontSize: 16, lineHeight: 1.8,
              maxWidth: 420, marginBottom: 48,
            }}>
              {selectedRole === 'customer' && 'Book an ambulance in seconds. Track your ride live. Get help when it matters most.'}
              {selectedRole === 'driver' && 'Respond to emergency requests. Navigate to patients. Complete trips with full guidance.'}
              {selectedRole === 'admin' && 'Monitor all ambulances, drivers and trips in real-time. Full system control at your fingertips.'}
            </p>
          </motion.div>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              selectedRole === 'customer' ? ['📍', 'GPS-based auto location'] : selectedRole === 'driver' ? ['🔔', 'Instant emergency alerts'] : ['🗺️', 'Live map of all ambulances'],
              selectedRole === 'customer' ? ['🚑', 'Nearby ambulances live'] : selectedRole === 'driver' ? ['🗺️', 'Turn-by-turn navigation'] : ['📋', 'Complete activity logs'],
              selectedRole === 'customer' ? ['📡', 'Real-time trip tracking'] : selectedRole === 'driver' ? ['🏥', 'Best route to hospital'] : ['📊', 'Analytics & reports'],
            ].map(([icon, text], i) => (
              <motion.div
                key={`${selectedRole}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${activeRole.color}15`,
                  border: `1px solid ${activeRole.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>{icon}</div>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom left stats */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', gap: 32, marginTop: 60,
        }}>
          {[
            { v: '4 min', l: 'Avg Response' },
            { v: '36+', l: 'Ambulances' },
            { v: '99.2%', l: 'Success Rate' },
          ].map((s) => (
            <div key={s.l}>
              <div style={{ color: activeRole.color, fontWeight: 800, fontSize: 20, transition: 'color 0.4s' }}>{s.v}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ──────────────────────────── */}
      <div style={{
        flex: '1 1 40%',
        background: 'rgba(255,255,255,0.02)',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 50px',
      }}>
        {/* Glass card */}
        <div style={{
          width: '100%', maxWidth: 400,
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 24,
          padding: '36px 36px',
          boxShadow: `0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), 0 0 40px ${activeRole.color}14`,
          transition: 'box-shadow 0.5s',
        }}>

          {/* Form header */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 8px' }}>
              Sign In
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>
              Select your role and enter credentials
            </p>
          </div>

          {/* Role tabs */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 28,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: 6,
          }}>
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => { setSelectedRole(role.id); setError(''); }}
                style={{
                  flex: 1, padding: '10px 6px', borderRadius: 10,
                  border: 'none', cursor: 'pointer', transition: 'all 0.25s',
                  background: selectedRole === role.id ? role.color : 'transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  boxShadow: selectedRole === role.id ? `0 4px 20px ${role.color}55` : 'none',
                }}
              >
                <span style={{ fontSize: 18 }}>{role.icon}</span>
                <span style={{
                  color: selectedRole === role.id ? '#fff' : 'rgba(255,255,255,0.4)',
                  fontSize: 11, fontWeight: 700,
                }}>{role.label}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <GlassInput
              label="Email Address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon="📧"
            />

            <GlassInput
              label="Password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              icon="🔒"
              extra={
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.35)', fontSize: 15, padding: 0,
                    transition: 'color 0.2s',
                  }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              }
            />

            {/* Forgot */}
            <div style={{ textAlign: 'right', marginBottom: 24, marginTop: -8 }}>
              <a href="#" style={{
                color: activeRole.color, fontSize: 12, fontWeight: 600,
                textDecoration: 'none',
              }}>Forgot password?</a>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: 'rgba(255,51,51,0.1)',
                    border: '1px solid rgba(255,51,51,0.3)',
                    borderRadius: 10, padding: '10px 14px',
                    color: '#ff6666', fontSize: 13, marginBottom: 16,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >⚠️ {error}</motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '15px', borderRadius: 12,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading
                  ? 'rgba(255,255,255,0.08)'
                  : `linear-gradient(135deg, ${activeRole.color}, ${activeRole.color}bb)`,
                color: '#fff', fontSize: 15, fontWeight: 700,
                transition: 'all 0.3s', letterSpacing: 0.5,
                boxShadow: loading ? 'none' : `0 8px 30px ${activeRole.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {loading ? (
                <>
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block' }}>⏳</motion.span>
                  Signing in...
                </>
              ) : (
                <>{activeRole.icon} Login as {activeRole.label}</>
              )}
            </button>
          </form>

          {/* Bottom */}
          <div style={{
            marginTop: 32, paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center',
          }}>
            <a href="/" style={{
              color: 'rgba(255,255,255,0.35)', fontSize: 13,
              textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.target.style.color = activeRole.color}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}
            >← Back to Home</a>
          </div>
        </div>  {/* glass card end */}
      </div>
    </div>
  );
}
