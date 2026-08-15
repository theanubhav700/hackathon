import { useState } from 'react';
import { motion } from 'framer-motion';
import CustomerLayout from '../../layouts/CustomerLayout';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders     = ['Male', 'Female', 'Other', 'Prefer not to say'];

// ── Single info row (locked view) ───────────────────────
function InfoRow({ icon, label, value, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '14px 0',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.05)',
      gap: 16,
    }}>
      <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{
        width: 160, flexShrink: 0,
        color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600,
      }}>{label}</span>
      <span style={{
        flex: 1,
        color: value ? '#fff' : 'rgba(255,255,255,0.2)',
        fontSize: 14, fontWeight: 500,
      }}>{value || '—'}</span>
      <span style={{ fontSize: 12, opacity: 0.2, flexShrink: 0 }}>🔒</span>
    </div>
  );
}

// ── Section box wrapper ──────────────────────────────────
function Section({ title, icon, accentColor, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${accentColor}22`,
        borderRadius: 18, marginBottom: 16, overflow: 'hidden',
      }}
    >
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 24px',
        borderBottom: `1px solid ${accentColor}18`,
        background: `${accentColor}08`,
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{title}</span>
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.05)', borderRadius: 20,
          padding: '3px 12px',
        }}>
          <span style={{ fontSize: 10, opacity: 0.4 }}>🔒</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600 }}>Locked</span>
        </div>
      </div>

      {/* Rows */}
      <div style={{ padding: '4px 24px' }}>
        {children}
      </div>
    </motion.div>
  );
}

// ── Editable input ───────────────────────────────────────
function GlassInput({ label, value, onChange, placeholder, type = 'text', required, icon, hint }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 6,
        color: 'rgba(255,255,255,0.45)', fontSize: 11,
        fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 7,
      }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        {label}
        {required && <span style={{ color: '#ff3333' }}>*</span>}
        {hint && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({hint})</span>}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: focused ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${focused ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10, padding: '12px 14px', transition: 'all 0.2s',
      }}>
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontFamily: 'inherit' }}
        />
      </div>
    </div>
  );
}

function GlassSelect({ label, value, onChange, options, required, icon, placeholder, hint }) {
  return (
    <div>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 6,
        color: 'rgba(255,255,255,0.45)', fontSize: 11,
        fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 7,
      }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        {label}
        {required && <span style={{ color: '#ff3333' }}>*</span>}
        {hint && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({hint})</span>}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, padding: '12px 14px',
      }}>
        <select value={value} onChange={onChange} style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          color: value ? '#fff' : 'rgba(255,255,255,0.3)',
          fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', appearance: 'none',
        }}>
          <option value="" style={{ background: '#0a0a18' }}>{placeholder || 'Select...'}</option>
          {options.map(o => (
            <option key={o} value={o} style={{ background: '#0a0a18', color: '#fff' }}>{o}</option>
          ))}
        </select>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, flexShrink: 0 }}>▼</span>
      </div>
    </div>
  );
}

// ── Edit form section ────────────────────────────────────
function EditSection({ title, icon, accentColor, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${accentColor}22`,
      borderRadius: 18, marginBottom: 16, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 24px',
        borderBottom: `1px solid ${accentColor}18`,
        background: `${accentColor}08`,
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{title}</span>
      </div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {children}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────
export default function Profile() {
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const storedData = localStorage.getItem('resq_user');
  const savedUser  = storedData ? JSON.parse(storedData) : null;
  const isLocked   = !!savedUser;

  const [fullName,   setFullName]   = useState(savedUser?.fullName   || '');
  const [mobile,     setMobile]     = useState(savedUser?.mobile     || '');
  const [email,      setEmail]      = useState(savedUser?.email      || '');
  const [password,   setPassword]   = useState('');
  const [age,        setAge]        = useState(savedUser?.age        || '');
  const [gender,     setGender]     = useState(savedUser?.gender     || '');
  const [bloodGroup, setBloodGroup] = useState(savedUser?.bloodGroup || '');
  const [ecName,     setEcName]     = useState(savedUser?.ecName     || '');
  const [ecNumber,   setEcNumber]   = useState(savedUser?.ecNumber   || '');

  const initials = fullName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSave = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    localStorage.setItem('resq_user', JSON.stringify({
      fullName, mobile, email, age, gender, bloodGroup, ecName, ecNumber,
    }));
    window.location.reload();
  };

  return (
    <CustomerLayout>

      {/* ── Page header ───────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>👤 My Profile</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          {isLocked ? 'Your profile is saved and locked.' : 'Fill in your details. Once saved, they cannot be changed.'}
        </p>
      </div>

      {/* ── Avatar card ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18, padding: '24px 28px',
          marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 24,
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg,#ff2222,#ff8800)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 900, color: '#fff',
            boxShadow: '0 0 24px rgba(255,34,34,0.3)',
          }}>{initials || '?'}</div>
          <div style={{
            position: 'absolute', bottom: 2, right: 2,
            width: 18, height: 18, borderRadius: '50%',
            background: '#00cc66', border: '3px solid #05050f',
          }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, marginBottom: 3 }}>
            {fullName || 'Your Name'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
            Customer Account
          </div>
        </div>

        {isLocked && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'rgba(255,136,0,0.08)', border: '1px solid rgba(255,136,0,0.2)',
            borderRadius: 12, padding: '12px 18px', flexShrink: 0,
          }}>
            <span style={{ fontSize: 22 }}>🔒</span>
            <span style={{ color: '#ffaa00', fontSize: 11, fontWeight: 700 }}>LOCKED</span>
          </div>
        )}
      </motion.div>


      <form onSubmit={handleSave}>

        {/* ══════════════════════════════════════════════
            LOCKED VIEW — clean info rows
        ══════════════════════════════════════════════ */}
        {isLocked && (
          <>
            <Section title="Basic Information" icon="📋" accentColor="#3399ff">
              <InfoRow icon="👤" label="Full Name"     value={fullName} />
              <InfoRow icon="📱" label="Mobile"        value={mobile} />
              <InfoRow icon="📧" label="Email"         value={email} />
              <InfoRow icon="🔒" label="Password"      value="••••••••" last />
            </Section>

            <Section title="Emergency Medical Info" icon="🆘" accentColor="#ff3333">
              <InfoRow icon="🎂" label="Age"           value={age} />
              <InfoRow icon="👤" label="Gender"        value={gender} />
              <InfoRow icon="🩸" label="Blood Group"   value={bloodGroup} last />
            </Section>

            <Section title="Emergency Contact" icon="📞" accentColor="#ff8800">
              <InfoRow icon="👥" label="Contact Name"  value={ecName} />
              <InfoRow icon="📱" label="Contact Number" value={ecNumber} last />
            </Section>
          </>
        )}

        {/* ══════════════════════════════════════════════
            EDIT VIEW — form inputs
        ══════════════════════════════════════════════ */}
        {!isLocked && (
          <>
            <EditSection title="Basic Information" icon="📋" accentColor="#3399ff">
              <GlassInput label="Full Name"     value={fullName}  onChange={e => setFullName(e.target.value)}  placeholder="Rahul Sharma"          required icon="👤" />
              <GlassInput label="Mobile Number" value={mobile}    onChange={e => setMobile(e.target.value)}    placeholder="+91 98765 43210"         type="tel"    required icon="📱" />
              <GlassInput label="Email Address" value={email}     onChange={e => setEmail(e.target.value)}     placeholder="you@example.com"         type="email"  required icon="📧" />
              {/* Password row */}
              <div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: 'rgba(255,255,255,0.45)', fontSize: 11,
                  fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 7,
                }}>
                  <span style={{ fontSize: 14 }}>🔒</span>
                  Password
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, padding: '12px 14px',
                }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Set a password"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontFamily: 'inherit' }}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: 0 }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </EditSection>

            <EditSection title="Emergency Medical Info" icon="🆘" accentColor="#ff3333">
              <GlassInput    label="Age"         value={age}        onChange={e => setAge(e.target.value)}        placeholder="28"              type="number" required icon="🎂" />
              <GlassSelect   label="Gender"      value={gender}     onChange={e => setGender(e.target.value)}     options={genders}      required icon="👤" placeholder="Select gender" />
              <GlassSelect   label="Blood Group" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} options={bloodGroups}   icon="🩸" placeholder="Select" hint="optional" />
            </EditSection>

            <EditSection title="Emergency Contact" icon="📞" accentColor="#ff8800">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,136,0,0.06)', border: '1px solid rgba(255,136,0,0.18)',
                borderRadius: 10, padding: '10px 14px',
              }}>
                <span>⚠️</span>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                  This person will be notified when you book an ambulance.
                </span>
              </div>
              <GlassInput label="Contact Name"   value={ecName}   onChange={e => setEcName(e.target.value)}   placeholder="Parent / Friend"     required icon="👥" />
              <GlassInput label="Contact Number" value={ecNumber} onChange={e => setEcNumber(e.target.value)} placeholder="+91 87654 32109" type="tel" required icon="📱" />
            </EditSection>

            {/* Save button */}
            <button
              type="submit" disabled={saving}
              style={{
                marginTop: 8,
                width: '100%', padding: '15px', borderRadius: 12, border: 'none',
                background: saving ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg,#ff2222,#cc0000)',
                color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 15, fontWeight: 800,
                boxShadow: saving ? 'none' : '0 8px 24px rgba(255,34,34,0.3)',
                transition: 'all 0.3s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {saving ? (
                <>
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block' }}>⏳</motion.span>
                  Saving...
                </>
              ) : '💾 Save Profile'}
            </button>
          </>
        )}

      </form>
    </CustomerLayout>
  );
}
