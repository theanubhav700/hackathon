import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../layouts/DriverLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

// ── Condition helpers ────────────────────────────────────
const CONDITION_MAP = {
  critical: { label: 'Critical',  color: '#ff3333', bg: 'rgba(255,51,51,0.12)',   icon: '🔴' },
  serious:  { label: 'Serious',   color: '#ff8800', bg: 'rgba(255,136,0,0.12)',  icon: '🟠' },
  stable:   { label: 'Stable',    color: '#ffcc00', bg: 'rgba(255,204,0,0.10)',  icon: '🟡' },
  normal:   { label: 'Normal',    color: '#00cc66', bg: 'rgba(0,204,102,0.10)', icon: '🟢' },
};

export default function HospitalPreAlert() {
  const navigate = useNavigate();

  // ── Load all saved data ──────────────────────────────
  const hospital = JSON.parse(localStorage.getItem('resq_dest_hospital')  || 'null');
  const patient  = JSON.parse(localStorage.getItem('resq_patient_info')   || 'null');
  const booking  = JSON.parse(localStorage.getItem('resq_active_booking') || 'null');
  const vitals   = JSON.parse(localStorage.getItem('resq_patient_vitals') || 'null');
  const driver   = JSON.parse(localStorage.getItem('resq_user')           || '{}');

  // ── State ────────────────────────────────────────────
  const [sending,   setSending]   = useState(false);  const [sent,      setSent]      = useState(false);
  const [sentAt,    setSentAt]    = useState(null);
  const [callPulse, setCallPulse] = useState(false);
  const [copied,    setCopied]    = useState(false);
  const socketRef = useRef(null);

  // Derived patient data
  const patientName  = patient?.name     || booking?.customerName  || '—';
  const emergency    = patient?.emergencyType || booking?.emergencyType || '—';
  const phone        = patient?.mobile   || booking?.customerPhone  || null;
  // bookingId is read once from localStorage — stable for the lifetime of this page
  const bookingId    = booking?.bookingId || `BK-${Date.now()}`;
  const cond         = CONDITION_MAP[vitals?.situation] || CONDITION_MAP.stable;

  // ── Connect socket ────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    return () => socket.disconnect();
  }, []);

  // ── Build pre-alert message ───────────────────────────
  const buildMessage = () => {
    const lines = [
      `🚨 AMBULANCE PRE-ALERT — ResQ Emergency`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `📋 Booking ID   : ${bookingId}`,
      `👤 Patient       : ${patientName}`,
      `🆘 Emergency     : ${emergency}`,
      `⚠️  Condition     : ${cond.label}`,
      ``,
      `🏥 Destination   : ${hospital?.name || '—'}`,
      `⏱️  ETA           : ${hospital?.eta ? `${hospital.eta} min` : '—'}`,
      `📍 Distance      : ${hospital?.dist ? `${parseFloat(hospital.dist).toFixed(1)} km` : '—'}`,
      ``,
      `🫀 Vitals`,
      `  HR    : ${vitals?.hr   || vitals?.heartRate || '—'} bpm`,
      `  SpO₂  : ${vitals?.spo2 || '—'}%`,
      `  BP    : ${vitals?.bp   || '—'}`,
      `  Temp  : ${vitals?.temp || '—'}°C`,
      ``,
      `👨‍🚑 Driver   : ${driver?.fullName || driver?.name || '—'}`,
      `🚑 Ambulance : ${driver?.assignedAmbulance?.vehicleId || 'AMB-01'}`,
    ];
    lines.push('', `━━━━━━━━━━━━━━━━━━━━━━`);
    return lines.join('\n');
  };

  // ── Send pre-alert ────────────────────────────────────
  const handleSend = () => {
    setSending(true);

    const payload = {
      bookingId,
      driverId:      driver._id,
      driverName:    driver?.fullName || driver?.name || '—',
      ambulanceId:   driver?.assignedAmbulance?.vehicleId || 'AMB-01',
      hospitalName:  hospital?.name  || '—',
      hospitalPhone: hospital?.phone || null,
      patientName,
      emergencyType: emergency,
      condition:     vitals?.situation || 'stable',
      eta:           hospital?.eta     || null,
      distanceKm:    hospital?.dist    || null,
      vitals: {
        hr:   vitals?.hr   || vitals?.heartRate || '—',
        spo2: vitals?.spo2 || '—',
        bp:   vitals?.bp   || '—',
        temp: vitals?.temp || '—',
      },
      notes: '',
      sentAt: new Date().toISOString(),
    };

    socketRef.current?.emit('prealert:send', payload);

    // Simulate network delay + confirm
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setSentAt(new Date());
      localStorage.setItem('resq_prealert_sent', JSON.stringify({ ...payload, sentAt: new Date().toISOString() }));
    }, 1400);
  };

  // ── Copy message to clipboard ─────────────────────────
  const handleCopy = () => {
    navigator.clipboard?.writeText(buildMessage()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── No hospital selected guard ────────────────────────
  const noHospital = !hospital;

  return (
    <DriverLayout>
      {/* ── Page header ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg,#ff8800,#cc5500)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, boxShadow: '0 0 18px rgba(255,136,0,0.35)',
        }}>🔔</div>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 20, margin: 0 }}>Hospital Pre-Alert</h1>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: '3px 0 0' }}>
            Notify the hospital before arrival — give them time to prepare
          </p>
        </div>
        {sent && (
          <div style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(0,204,102,0.12)', border: '1px solid rgba(0,204,102,0.3)',
            padding: '6px 14px', borderRadius: 20,
          }}>
            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.4 }}>✅</motion.span>
            <span style={{ color: '#00cc66', fontSize: 12, fontWeight: 800 }}>Alert Sent</span>
          </div>
        )}
      </div>

      {/* ── No hospital warning ───────────────────────── */}
      {noHospital && (
        <div style={{
          background: 'rgba(255,204,0,0.06)', border: '1px solid rgba(255,204,0,0.2)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <div style={{ color: '#ffcc00', fontWeight: 700, fontSize: 13 }}>No hospital selected</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              Go to Hospital Info and select a destination first.{' '}
              <span
                onClick={() => navigate('/driver/hospital')}
                style={{ color: '#3399ff', cursor: 'pointer', textDecoration: 'underline' }}
              >Go now →</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* ══ LEFT COLUMN ══════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Hospital Card ─────────────────────────── */}
          <Section title="🏥 Destination Hospital" accent="#3399ff">
            {noHospital ? (
              <Empty text="No hospital selected" />
            ) : (
              <>
                {/* Hospital name row */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  background: 'rgba(51,153,255,0.06)', border: '1px solid rgba(51,153,255,0.18)',
                  borderRadius: 12, padding: '12px 14px', marginBottom: 12,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(51,153,255,0.15)', border: '1px solid rgba(51,153,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>🏥</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, lineHeight: 1.3 }}>
                      {hospital.name}
                    </div>
                    {hospital.address && (
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 3 }}>
                        📍 {hospital.address}
                      </div>
                    )}
                    {hospital.type && (
                      <span style={{
                        display: 'inline-block', marginTop: 5,
                        background: 'rgba(51,153,255,0.12)', border: '1px solid rgba(51,153,255,0.25)',
                        color: '#3399ff', fontSize: 10, fontWeight: 700,
                        padding: '2px 8px', borderRadius: 8,
                      }}>{hospital.type?.toUpperCase()}</span>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                  <StatBox label="ETA" value={hospital.eta ? `${hospital.eta} min` : '—'} color="#ff8800" icon="⏱️" />
                  <StatBox label="Distance" value={hospital.dist ? `${parseFloat(hospital.dist).toFixed(1)} km` : '—'} color="#3399ff" icon="📍" />
                  <StatBox label="Emergency" value={hospital.emergency ? 'Yes 24/7' : 'Unknown'} color={hospital.emergency ? '#00cc66' : '#888'} icon="🚨" />
                </div>

                {/* Phone section */}
                <div style={{
                  background: hospital.phone ? 'rgba(0,204,102,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${hospital.phone ? 'rgba(0,204,102,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 12, padding: '12px 14px',
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                    📞 Hospital Phone
                  </div>
                  {hospital.phone ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, fontFamily: 'monospace', letterSpacing: 1 }}>
                        {hospital.phone}
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {/* Copy */}
                        <button
                          onClick={() => { navigator.clipboard?.writeText(hospital.phone); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                          style={{
                            padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                            background: copied ? 'rgba(0,204,102,0.15)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${copied ? 'rgba(0,204,102,0.3)' : 'rgba(255,255,255,0.1)'}`,
                            color: copied ? '#00cc66' : 'rgba(255,255,255,0.5)', fontFamily: 'inherit',
                            transition: 'all 0.2s',
                          }}
                        >{copied ? '✓ Copied' : '📋 Copy'}</button>
                        {/* Call */}
                        <motion.a
                          href={`tel:${hospital.phone}`}
                          animate={callPulse ? { scale: [1, 1.05, 1] } : {}}
                          onMouseEnter={() => setCallPulse(true)}
                          onMouseLeave={() => setCallPulse(false)}
                          style={{
                            padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 800,
                            background: 'linear-gradient(135deg,#00cc66,#009944)',
                            border: 'none', color: '#fff', textDecoration: 'none',
                            display: 'flex', alignItems: 'center', gap: 5,
                            boxShadow: '0 4px 14px rgba(0,204,102,0.3)',
                          }}
                        >
                          📞 Call Now
                        </motion.a>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                      Number not available in database.{' '}
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(hospital.name + ' phone number')}`}
                        target="_blank" rel="noreferrer"
                        style={{ color: '#3399ff', textDecoration: 'none' }}
                      >Search on Google →</a>
                    </div>
                  )}
                </div>
              </>
            )}
          </Section>

          {/* ── Patient Status Card ───────────────────── */}
          <Section title="👤 Patient Details" accent="#ff4466">
            {/* Condition banner */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: cond.bg, border: `1px solid ${cond.color}30`,
              borderRadius: 12, padding: '11px 14px', marginBottom: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: `${cond.color}20`, border: `2px solid ${cond.color}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0,
              }}>{cond.icon}</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>{patientName}</div>
                <div style={{ color: cond.color, fontSize: 12, fontWeight: 700, marginTop: 1 }}>
                  {cond.label} Condition · {emergency}
                </div>
              </div>
              <div style={{
                marginLeft: 'auto', background: `${cond.color}15`,
                border: `1px solid ${cond.color}35`,
                borderRadius: 8, padding: '4px 10px',
                color: cond.color, fontSize: 11, fontWeight: 800,
              }}>{cond.icon} {cond.label}</div>
            </div>

            {/* Detail rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
              <DetailRow label="Booking ID"  value={bookingId} />
              <DetailRow label="Emergency"   value={emergency} color="#ff8800" />
              <DetailRow label="Mobile"      value={phone || '—'} mono />
              <DetailRow label="Address"     value={patient?.address || booking?.customerLocation || '—'} small />
              {patient?.notes && <DetailRow label="Notes"  value={patient.notes} small />}
            </div>

            {/* Vitals grid */}
            {vitals ? (
              <>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0 10px' }} />
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Live Vitals</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                  <VitalBox label="Heart Rate" value={vitals.hr || vitals.heartRate || '—'} unit="bpm" color="#ff4466" icon="🫀" />
                  <VitalBox label="SpO₂"       value={vitals.spo2 || '—'}                   unit="%"   color="#3399ff" icon="💉" />
                  <VitalBox label="Blood Pressure" value={vitals.bp || '—'}                 unit=""    color="#ffaa00" icon="🩺" />
                  <VitalBox label="Temperature"    value={vitals.temp || '—'}               unit="°C"  color="#00cc66" icon="🌡️" />
                </div>
              </>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12, textAlign: 'center', padding: '10px 0' }}>
                No vitals recorded yet — go to Patient Report to add
              </div>
            )}
          </Section>
        </div>

        {/* ══ RIGHT COLUMN ═════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Message Preview ───────────────────────── */}
          <Section title="📋 Pre-Alert Message Preview" accent="#ff8800">
            <div style={{
              background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '14px 16px',
              fontFamily: "'Courier New', monospace",
              fontSize: 12, color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.8, whiteSpace: 'pre-wrap',
              maxHeight: 300, overflowY: 'auto',
            }}>
              {buildMessage()}
            </div>
            <button
              onClick={handleCopy}
              style={{
                marginTop: 10, width: '100%', padding: '9px', borderRadius: 9,
                background: copied ? 'rgba(0,204,102,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${copied ? 'rgba(0,204,102,0.3)' : 'rgba(255,255,255,0.1)'}`,
                color: copied ? '#00cc66' : 'rgba(255,255,255,0.45)',
                fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
            >{copied ? '✅ Copied to clipboard!' : '📋 Copy Message'}</button>
          </Section>

          {/* ── Action Buttons ────────────────────────── */}
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div key="actions" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Call hospital */}
                {hospital?.phone ? (
                  <a href={`tel:${hospital.phone}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                    padding: '13px', borderRadius: 12, textDecoration: 'none',
                    background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.3)',
                    color: '#00cc66', fontWeight: 800, fontSize: 14,
                  }}>
                    📞 Call Hospital Directly
                  </a>
                ) : (
                  <div style={{
                    padding: '12px', borderRadius: 12, textAlign: 'center',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.2)', fontSize: 13,
                  }}>
                    📞 No phone number available for direct call
                  </div>
                )}

                {/* Send pre-alert */}
                <motion.button
                  onClick={handleSend}
                  disabled={sending || noHospital}
                  whileHover={!sending && !noHospital ? { scale: 1.01 } : {}}
                  whileTap={!sending && !noHospital ? { scale: 0.99 } : {}}
                  style={{
                    padding: '15px', borderRadius: 12, border: 'none',
                    background: noHospital
                      ? 'rgba(255,255,255,0.05)'
                      : sending
                        ? 'rgba(255,136,0,0.3)'
                        : 'linear-gradient(135deg,#ff8800,#cc5500)',
                    color: noHospital ? 'rgba(255,255,255,0.2)' : '#fff',
                    cursor: sending || noHospital ? 'not-allowed' : 'pointer',
                    fontWeight: 900, fontSize: 15, fontFamily: 'inherit',
                    boxShadow: !sending && !noHospital ? '0 8px 24px rgba(255,136,0,0.3)' : 'none',
                    transition: 'all 0.3s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}
                >
                  {sending ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span>
                      Sending Pre-Alert...
                    </>
                  ) : (
                    <>📡 SEND PRE-ALERT TO HOSPITAL</>
                  )}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {/* Success card */}
                <div style={{
                  background: 'rgba(0,204,102,0.07)', border: '1px solid rgba(0,204,102,0.25)',
                  borderRadius: 14, padding: '18px 20px', textAlign: 'center',
                }}>
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    style={{ fontSize: 42, marginBottom: 8 }}
                  >✅</motion.div>
                  <div style={{ color: '#00cc66', fontWeight: 900, fontSize: 17 }}>Pre-Alert Sent!</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 4 }}>
                    Hospital notified at {sentAt?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 2 }}>
                    They are preparing for your arrival
                  </div>
                </div>

                {/* Post-alert actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    onClick={() => { setSent(false); setSentAt(null); }}
                    style={{
                      padding: '11px', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
                      background: 'rgba(255,136,0,0.08)', border: '1px solid rgba(255,136,0,0.2)',
                      color: '#ff8800', fontSize: 13, fontFamily: 'inherit',
                    }}
                  >🔄 Resend Alert</button>
                  <button
                    onClick={() => navigate('/driver/journey')}
                    style={{
                      padding: '11px', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
                      background: 'rgba(51,153,255,0.1)', border: '1px solid rgba(51,153,255,0.25)',
                      color: '#3399ff', fontSize: 13, fontFamily: 'inherit',
                    }}
                  >🗺️ Live Journey</button>
                </div>
                <button
                  onClick={() => navigate('/driver/complete')}
                  style={{
                    padding: '13px', borderRadius: 12, cursor: 'pointer', fontWeight: 800, fontSize: 14,
                    background: 'linear-gradient(135deg,#00cc66,#009944)',
                    border: 'none', color: '#fff', fontFamily: 'inherit',
                    boxShadow: '0 6px 20px rgba(0,204,102,0.25)',
                  }}
                >🏁 Complete Trip</button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </DriverLayout>
  );
}

// ── Sub-components ───────────────────────────────────────

function Section({ title, accent, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid ${accent}18`,
      borderRadius: 14, padding: '15px 17px',
    }}>
      <div style={{
        color: accent, fontWeight: 800, fontSize: 11,
        textTransform: 'uppercase', letterSpacing: 1,
        marginBottom: 13,
      }}>{title}</div>
      {children}
    </div>
  );
}

function StatBox({ label, value, color, icon }) {
  return (
    <div style={{
      background: `${color}0d`, border: `1px solid ${color}22`,
      borderRadius: 10, padding: '9px 10px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 14, marginBottom: 3 }}>{icon}</div>
      <div style={{ color, fontWeight: 900, fontSize: 14, lineHeight: 1 }}>{value}</div>
      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function DetailRow({ label, value, color, small, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 12, flexShrink: 0 }}>{label}</span>
      <span style={{
        color: color || (value === '—' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)'),
        fontSize: small ? 11 : 12, fontWeight: 600,
        fontFamily: mono ? 'monospace' : 'inherit',
        textAlign: 'right', maxWidth: '65%',
      }}>{value}</span>
    </div>
  );
}

function VitalBox({ label, value, unit, color, icon }) {
  return (
    <div style={{
      background: `${color}0d`, border: `1px solid ${color}22`,
      borderRadius: 10, padding: '8px 10px',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ color, fontWeight: 800, fontSize: 13, lineHeight: 1 }}>
          {value}{unit && value !== '—' ? ` ${unit}` : ''}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 0', color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>
      {text}
    </div>
  );
}
