import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { registerUser } from '../../services/api';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders     = ['Male', 'Female', 'Other', 'Prefer not to say'];

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 6,
        color: 'rgba(255,255,255,0.5)', fontSize: 11,
        fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8,
      }}>
        {label}
        {required && <span style={{ color: '#ff3333' }}>*</span>}
        {hint && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ icon, type = 'text', value, onChange, placeholder, extra }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: focused ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${focused ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 12, padding: '12px 16px', transition: 'all 0.25s',
    }}>
      {icon && <span style={{ fontSize: 16, opacity: 0.55, flexShrink: 0 }}>{icon}</span>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontFamily: 'inherit' }}
      />
      {extra}
    </div>
  );
}

function Select({ icon, value, onChange, options, placeholder }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '12px 16px',
    }}>
      {icon && <span style={{ fontSize: 16, opacity: 0.55 }}>{icon}</span>}
      <select value={value} onChange={onChange} style={{
        flex: 1, background: 'transparent', border: 'none', outline: 'none',
        color: value ? '#fff' : 'rgba(255,255,255,0.3)',
        fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', appearance: 'none',
      }}>
        <option value="" style={{ background: '#0a0a18' }}>{placeholder}</option>
        {options.map(o => <option key={o} value={o} style={{ background: '#0a0a18', color: '#fff' }}>{o}</option>)}
      </select>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, flexShrink: 0 }}>▼</span>
    </div>
  );
}

// Step indicator
function StepBar({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4, flex: 1, borderRadius: 4,
          background: i < current ? '#ff3333' : i === current ? 'rgba(255,51,51,0.5)' : 'rgba(255,255,255,0.08)',
          transition: 'all 0.4s',
        }} />
      ))}
    </div>
  );
}

export default function CustomerRegister() {
  const [step, setStep] = useState(0); // 0, 1, 2
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 0 — Basic
  const [fullName, setFullName]   = useState('');
  const [mobile, setMobile]       = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');

  // Step 1 — Emergency Medical
  const [age, setAge]               = useState('');
  const [gender, setGender]         = useState('');
  const [bloodGroup, setBloodGroup] = useState('');

  // Step 2 — Emergency Contact
  const [ecName, setEcName]     = useState('');
  const [ecNumber, setEcNumber] = useState('');

  const validateStep = () => {
    setError('');
    if (step === 0) {
      if (!fullName.trim()) return setError('Full name is required');
      if (!mobile.trim())   return setError('Mobile number is required');
      if (!email.trim())    return setError('Email is required');
      if (!password)        return setError('Password is required');
      if (password.length < 6) return setError('Password must be at least 6 characters');
      if (password !== confirm) return setError('Passwords do not match');
    }
    if (step === 1) {
      if (!age)    return setError('Age is required');
      if (!gender) return setError('Gender is required');
    }
    if (step === 2) {
      if (!ecName.trim())   return setError('Emergency contact name is required');
      if (!ecNumber.trim()) return setError('Emergency contact number is required');
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep() !== true) return;
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateStep() !== true) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await registerUser({
        fullName, mobile, email, password,
        age, gender, bloodGroup, ecName, ecNumber,
      });
      // Save user info + token to localStorage
      localStorage.setItem('resq_token', data.token);
      localStorage.setItem('resq_user', JSON.stringify(data.user));
      setLoading(false);
      setDone(true);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  // Success screen
  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: '#05050f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter','Segoe UI',system-ui,'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif", padding: 20 }}>
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
          style={{ maxWidth: 440, width: '100%', background: 'rgba(0,204,102,0.06)', border: '1px solid rgba(0,204,102,0.25)', borderRadius: 24, padding: '48px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 60, marginBottom: 18 }}>🎉</div>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 10px' }}>Account Created!</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 28 }}>
            Welcome to ResQ, <span style={{ color: '#fff', fontWeight: 700 }}>{fullName}</span>!<br />
            You can now book ambulances anytime.
          </p>
          <a href="/login/customer" style={{
            display: 'block', padding: '14px', borderRadius: 12,
            background: 'linear-gradient(135deg,#ff2222,#cc0000)',
            color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: 15,
            boxShadow: '0 8px 24px rgba(255,34,34,0.4)',
          }}>👤 Login Now →</a>
        </motion.div>
      </div>
    );
  }

  const stepTitles = [
    { title: 'Basic Information', sub: 'Your account credentials' },
    { title: 'Medical Info',      sub: 'For emergency response' },
    { title: 'Emergency Contact', sub: 'Who to notify in emergencies' },
  ];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'Inter','Segoe UI',system-ui,'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif",
      background: '#05050f', overflow: 'hidden',
    }}>
      {/* ── LEFT ─────────────────────────────────────── */}
      <div style={{
        flex: '1 1 55%', position: 'relative',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 70px', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '50px 50px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,51,51,0.1),transparent 65%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none', marginBottom: 56, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#ff2222,#cc0000)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 0 24px rgba(255,34,34,0.4)' }}>🚑</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 20, letterSpacing: 1 }}>ResQ</div>
            <div style={{ color: '#ff3333', fontSize: 10, fontWeight: 700, letterSpacing: 3 }}>EMERGENCY RESPONSE</div>
          </div>
        </a>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.3)', borderRadius: 30, padding: '6px 16px', marginBottom: 24 }}>
            <span>👤</span>
            <span style={{ color: '#ff3333', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>CREATE ACCOUNT</span>
          </div>

          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(30px,4vw,48px)', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: -1 }}>
            Join ResQ.<br />
            <span style={{ background: 'linear-gradient(135deg,#ff2222,#ff6600,#ffaa00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Get Help Fast.</span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.8, maxWidth: 380, marginBottom: 40 }}>
            Register once. Book an ambulance anytime, anywhere. Your emergency contacts and medical info are saved for faster response.
          </p>

          {/* Steps preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              ['📋', 'Basic Info', 'Name, mobile, email & password'],
              ['🆘', 'Medical Info', 'Age, gender & blood group'],
              ['📞', 'Emergency Contact', 'Who to notify in emergency'],
            ].map(([icon, title, desc], i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.12 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  opacity: i === step ? 1 : 0.4,
                  transition: 'opacity 0.4s',
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: i === step ? 'rgba(255,51,51,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${i === step ? 'rgba(255,51,51,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                  transition: 'all 0.4s',
                }}>{i < step ? '✅' : icon}</div>
                <div>
                  <div style={{ color: i === step ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 14 }}>{title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT — Form ────────────────────────────────── */}
      <div style={{ flex: '1 1 45%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '36px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>

          {/* Header */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginBottom: 4 }}>Step {step + 1} of 3</div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{stepTitles[step].title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>{stepTitles[step].sub}</p>
          </div>

          {/* Step bar */}
          <div style={{ margin: '20px 0' }}>
            <StepBar current={step} total={3} />
          </div>

          <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>

            {/* ── STEP 0: Basic Info ─────────────────── */}
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Field label="Full Name" required>
                      <Input icon="👤" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Rahul Sharma" />
                    </Field>
                    <Field label="Mobile Number" required>
                      <Input icon="📱" type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91 98765 43210" />
                    </Field>
                    <Field label="Email Address" required>
                      <Input icon="📧" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                    </Field>
                    <Field label="Password" required>
                      <Input icon="🔒" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
                        extra={<button type="button" onClick={() => setShowPass(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 14, padding: 0 }}>{showPass ? '🙈' : '👁️'}</button>}
                      />
                    </Field>
                    <Field label="Confirm Password" required>
                      <Input icon="🔒" type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password"
                        extra={<button type="button" onClick={() => setShowConfirm(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 14, padding: 0 }}>{showConfirm ? '🙈' : '👁️'}</button>}
                      />
                    </Field>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 1: Medical Info ───────────────── */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                  <div style={{ background: 'rgba(255,51,51,0.06)', border: '1px solid rgba(255,51,51,0.18)', borderRadius: 10, padding: '10px 14px', marginBottom: 18, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span>🆘</span>
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.5 }}>This info helps ambulance staff prepare before arrival.</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Field label="Age" required>
                      <Input icon="🎂" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 28" />
                    </Field>
                    <Field label="Gender" required>
                      <Select icon="👤" value={gender} onChange={e => setGender(e.target.value)} options={genders} placeholder="Select gender" />
                    </Field>
                    <Field label="Blood Group" hint="optional">
                      <Select icon="🩸" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} options={bloodGroups} placeholder="Select blood group" />
                    </Field>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: Emergency Contact ──────────── */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                  <div style={{ background: 'rgba(255,136,0,0.06)', border: '1px solid rgba(255,136,0,0.18)', borderRadius: 10, padding: '10px 14px', marginBottom: 18, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span>⚠️</span>
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.5 }}>This person will be notified when you book an ambulance.</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Field label="Contact Name" required>
                      <Input icon="👥" value={ecName} onChange={e => setEcName(e.target.value)} placeholder="Parent / Sibling / Friend" />
                    </Field>
                    <Field label="Contact Number" required>
                      <Input icon="📱" type="tel" value={ecNumber} onChange={e => setEcNumber(e.target.value)} placeholder="+91 87654 32109" />
                    </Field>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.3)', borderRadius: 10, padding: '10px 14px', color: '#ff6666', fontSize: 13, margin: '16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {step > 0 && (
                <button type="button" onClick={() => { setStep(s => s - 1); setError(''); }}
                  style={{ flex: 1, padding: '13px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  ← Back
                </button>
              )}
              <button type="submit" disabled={loading}
                style={{
                  flex: 2, padding: '13px', borderRadius: 12, border: 'none',
                  background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#ff2222,#cc0000)',
                  color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 800, letterSpacing: 0.5, transition: 'all 0.3s',
                  boxShadow: loading ? 'none' : '0 6px 20px rgba(255,34,34,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                {loading ? (
                  <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>⏳</motion.span> Creating...</>
                ) : step === 2 ? '🎉 Create Account' : 'Next →'}
              </button>
            </div>
          </form>

          {/* Login link */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Already have an account? </span>
            <a href="/login/customer" style={{ color: '#ff3333', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Login →</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
