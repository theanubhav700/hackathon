import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DriverLogin() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill all fields'); return; }
    setError(''); setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      if (data.success) {
        if (data.user.role !== 'driver') {
          setError('Access denied. This portal is for drivers only.');
          setLoading(false);
          return;
        }
        localStorage.setItem('resq_token', data.token);
        localStorage.setItem('resq_user',  JSON.stringify(data.user));
        navigate('/driver/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'Inter','Segoe UI',system-ui,'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif",
      background: '#05050f', overflow: 'hidden',
    }}>
      {/* LEFT */}
      <div style={{
        flex: '1 1 58%', position: 'relative',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 70px', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '50px 50px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,136,0,0.1),transparent 65%)', pointerEvents: 'none' }} />

        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none', marginBottom: 60, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#ff8800,#cc5500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 0 24px rgba(255,136,0,0.4)' }}>🚑</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 20, letterSpacing: 1 }}>ResQ</div>
            <div style={{ color: '#ff8800', fontSize: 10, fontWeight: 700, letterSpacing: 3 }}>EMERGENCY RESPONSE</div>
          </div>
        </a>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,136,0,0.12)', border: '1px solid rgba(255,136,0,0.3)', borderRadius: 30, padding: '6px 16px', marginBottom: 24 }}>
            <span>🚑</span>
            <span style={{ color: '#ff8800', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>DRIVER PANEL</span>
          </div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(32px,4vw,52px)', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: -1 }}>
            Respond Fast.<br />
            <span style={{ background: 'linear-gradient(135deg,#ff8800,#ffdd00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Save Lives.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, lineHeight: 1.8, maxWidth: 400, marginBottom: 44 }}>
            Accept emergency requests, navigate to patients and complete trips with full guidance.
          </p>
          {[['🔔','Get instant emergency alert notifications'],['🗺️','Turn-by-turn navigation to pickup & hospital'],['🏥','Smart route selection to nearest hospital']].map(([icon, text], i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,136,0,0.1)', border: '1px solid rgba(255,136,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{icon}</div>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ flex: '1 1 42%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 400, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,136,0,0.15)', borderRadius: 24, padding: '40px', boxShadow: '0 24px 60px rgba(0,0,0,0.5),0 0 40px rgba(255,136,0,0.08)' }}>

          <div style={{ marginBottom: 30 }}>
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>Driver Login</h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Enter your email and password</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Email</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '13px 16px' }}>
                <span style={{ fontSize: 17, opacity: 0.6 }}>📧</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="driver@resq.com"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontFamily: 'inherit' }} />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Password</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '13px 16px' }}>
                <span style={{ fontSize: 17, opacity: 0.6 }}>🔒</span>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontFamily: 'inherit' }} />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 15, padding: 0 }}>{showPass ? '🙈' : '👁️'}</button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.3)', borderRadius: 10, padding: '10px 14px', color: '#ff6666', fontSize: 13, margin: '14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '15px', borderRadius: 12, border: 'none', marginTop: 8,
              background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#ff8800,#cc5500)',
              color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 15, fontWeight: 800, letterSpacing: 0.5, transition: 'all 0.3s',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(255,136,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
              {loading
                ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>⏳</motion.span> Signing in...</>
                : '🚑 Login as Driver'}
            </button>
          </form>

          <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <a href="/" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>← Back to Home</a>
            <div style={{ display: 'flex', gap: 14 }}>
              <a href="/login/customer" style={{ color: 'rgba(255,51,51,0.7)', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>👤 Customer</a>
              <a href="/login/admin" style={{ color: 'rgba(51,153,255,0.7)', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>🖥️ Admin</a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
