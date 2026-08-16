import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../layouts/DriverLayout';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { id: 1, label: 'Arrived at Hospital',  icon: '🏥' },
  { id: 2, label: 'Patient Handed Over',  icon: '👨‍⚕️' },
  { id: 3, label: 'Paperwork Completed',  icon: '📋' },
];

// Keys to wipe after trip completes
// NOTE: resq_actioned_bookings is intentionally kept so that the server
//       cannot re-deliver the completed booking's notification on reconnect.
//       resq_driver_notifications is also kept so past history isn't lost.
const TRIP_KEYS = [
  'resq_active_booking',
  'resq_patient_info',
  'resq_patient_vitals',
  'resq_boarded_at',
  'resq_dest_hospital',
  'resq_corridor_signal_count',
  'resq_prealert_sent',
];

export default function CompleteTrip() {
  const navigate = useNavigate();

  // Read all current trip data
  const booking      = JSON.parse(localStorage.getItem('resq_active_booking')  || 'null');
  const patient      = JSON.parse(localStorage.getItem('resq_patient_info')    || 'null');
  const vitals       = JSON.parse(localStorage.getItem('resq_patient_vitals')  || 'null');
  const destHospital = JSON.parse(localStorage.getItem('resq_dest_hospital')   || 'null');
  const boardedAt    = localStorage.getItem('resq_boarded_at');

  const [steps,     setSteps]     = useState([false, false, false]);
  const [completed, setCompleted] = useState(false);
  const [tripRecord, setTripRecord] = useState(null);

  const toggleStep = (i) => setSteps(s => { const n = [...s]; n[i] = !n[i]; return n; });
  const allDone    = steps.every(Boolean);

  const calcDuration = () => {
    if (!boardedAt) return '—';
    const ms = Date.now() - new Date(boardedAt).getTime();
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const handleComplete = () => {
    const now     = new Date();
    const compTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const compDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const record = {
      id:           booking?.bookingId || `TRP-${Date.now()}`,
      patient:      patient?.name      || booking?.customerName  || '—',
      mobile:       patient?.mobile    || booking?.customerPhone || '—',
      emergency:    patient?.emergencyType || booking?.emergencyType || '—',
      problem:      patient?.problem   || '—',
      address:      patient?.address   || booking?.customerLocation || '—',
      hospital:     destHospital?.name || '—',
      date:         compDate,
      time:         compTime,
      completedAt:  now.toISOString(),
      boardedAt:    boardedAt || null,
      duration:     calcDuration(),
      distance:     destHospital?.dist ? `${parseFloat(destHospital.dist).toFixed(1)} km` : '—',
      vitals: vitals ? {
        hr:   vitals.hr   || vitals.heartRate || '—',
        spo2: vitals.spo2 || '—',
        bp:   vitals.bp   || '—',
        temp: vitals.temp || '—',
        situation: vitals.situation || '—',
      } : null,
    };

    // Save to trip history
    const history = JSON.parse(localStorage.getItem('resq_trip_history') || '[]');
    localStorage.setItem('resq_trip_history', JSON.stringify([record, ...history]));

    // Update admin requests — mark this booking as Done
    const adminReqs = JSON.parse(localStorage.getItem('resq_admin_requests') || '[]');
    const updatedAdminReqs = adminReqs.map(r =>
      r.bookingId === record.id ? { ...r, status: 'Done', completedAt: now.toISOString() } : r
    );
    localStorage.setItem('resq_admin_requests', JSON.stringify(updatedAdminReqs));

    // Wipe all trip-related keys
    TRIP_KEYS.forEach(k => localStorage.removeItem(k));

    setTripRecord(record);
    setCompleted(true);
  };

  // Live summary preview (before completing)
  const preview = [
    ['Trip ID',    booking?.bookingId?.slice(-10) || '—'],
    ['Patient',    patient?.name || booking?.customerName || '—'],
    ['Emergency',  patient?.emergencyType || booking?.emergencyType || '—'],
    ['Hospital',   destHospital?.name || '—'],
    ['Distance',   destHospital?.dist ? `${parseFloat(destHospital.dist).toFixed(1)} km` : '—'],
    ['Duration',   calcDuration()],
  ];

  return (
    <DriverLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 22, margin: '0 0 4px' }}>🏁 Complete Trip</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
          Mark trip as completed — all data will be saved to history
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!completed ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}
          >
            {/* Left — checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: '20px',
              }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, marginBottom: 16 }}>📋 Completion Checklist</div>
                {STEPS.map((s, i) => (
                  <motion.div
                    key={s.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => toggleStep(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px', borderRadius: 12, marginBottom: 8, cursor: 'pointer',
                      background: steps[i] ? 'rgba(0,204,102,0.08)' : 'rgba(255,255,255,0.02)',
                      border: steps[i] ? '1px solid rgba(0,204,102,0.25)' : '1px solid rgba(255,255,255,0.07)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                      background: steps[i] ? '#00cc66' : 'transparent',
                      border: steps[i] ? '2px solid #00cc66' : '2px solid rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 13, fontWeight: 900, transition: 'all 0.2s',
                    }}>
                      {steps[i] ? '✓' : ''}
                    </div>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <span style={{
                      color: steps[i] ? '#fff' : 'rgba(255,255,255,0.55)',
                      fontWeight: steps[i] ? 700 : 400, fontSize: 13, flex: 1,
                    }}>{s.label}</span>
                    {steps[i] && <span style={{ color: '#00cc66', fontSize: 11, fontWeight: 700 }}>✓ Done</span>}
                  </motion.div>
                ))}
              </div>

              {/* Progress indicator */}
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Progress</span>
                  <span style={{ color: '#00cc66', fontSize: 12, fontWeight: 700 }}>{steps.filter(Boolean).length}/3</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${(steps.filter(Boolean).length / 3) * 100}%` }}
                    transition={{ duration: 0.3 }}
                    style={{ height: '100%', background: 'linear-gradient(90deg,#00cc66,#009944)', borderRadius: 3 }}
                  />
                </div>
              </div>

              {/* Complete button */}
              <button
                onClick={handleComplete}
                disabled={!allDone}
                style={{
                  width: '100%', padding: '15px', borderRadius: 13, border: 'none',
                  background: allDone ? 'linear-gradient(135deg,#00cc66,#009944)' : 'rgba(255,255,255,0.05)',
                  color: allDone ? '#fff' : 'rgba(255,255,255,0.2)',
                  cursor: allDone ? 'pointer' : 'not-allowed',
                  fontWeight: 900, fontSize: 15, fontFamily: 'inherit',
                  boxShadow: allDone ? '0 8px 24px rgba(0,204,102,0.35)' : 'none',
                  transition: 'all 0.3s',
                }}
              >
                {allDone ? '🏁 COMPLETE TRIP & SAVE' : `Complete all ${steps.filter(Boolean).length}/3 steps to finish`}
              </button>
            </div>

            {/* Right — trip summary preview */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '20px',
            }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, fontSize: 13, marginBottom: 14 }}>
                📊 Trip Summary Preview
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {preview.map(([label, value]) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{label}</span>
                    <span style={{
                      color: value === '—' ? 'rgba(255,255,255,0.12)' : '#fff',
                      fontSize: 12, fontWeight: 600, textAlign: 'right', maxWidth: '60%',
                    }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Vitals if available */}
              {vitals && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Final Vitals</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                    {[
                      ['🫀 HR',    vitals.hr || vitals.heartRate || '—', 'bpm', '#ff4466'],
                      ['💉 SpO₂', vitals.spo2 || '—', '%', '#3399ff'],
                      ['🩺 BP',   vitals.bp   || '—', '',  '#ffaa00'],
                      ['🌡️ Temp', vitals.temp  || '—', '°C', '#00cc66'],
                    ].map(([l, v, u, c]) => (
                      <div key={l} style={{ background: `${c}0d`, border: `1px solid ${c}22`, borderRadius: 9, padding: '7px 10px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{l}</div>
                        <div style={{ color: c, fontWeight: 800, fontSize: 13 }}>{v}{u && v !== '—' ? ` ${u}` : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 14, background: 'rgba(255,204,0,0.06)', border: '1px solid rgba(255,204,0,0.18)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ color: '#ffcc00', fontSize: 11, fontWeight: 700 }}>⚠️ After completion:</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 3, lineHeight: 1.6 }}>
                  All trip data will be saved to history and the dashboard will reset for a new request.
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 150 }}
              style={{ fontSize: 72, marginBottom: 16 }}
            >🏁</motion.div>
            <div style={{ color: '#00cc66', fontWeight: 900, fontSize: 26, marginBottom: 6 }}>Trip Completed!</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 24 }}>
              Trip saved to history · Dashboard reset for new requests
            </div>

            {/* Saved record preview */}
            {tripRecord && (
              <div style={{
                background: 'rgba(0,204,102,0.05)', border: '1px solid rgba(0,204,102,0.2)',
                borderRadius: 14, padding: '16px 20px', marginBottom: 20, textAlign: 'left',
              }}>
                {[
                  ['Trip ID',   tripRecord.id],
                  ['Patient',   tripRecord.patient],
                  ['Emergency', tripRecord.emergency],
                  ['Hospital',  tripRecord.hospital],
                  ['Duration',  tripRecord.duration],
                  ['Distance',  tripRecord.distance],
                  ['Time',      `${tripRecord.date} · ${tripRecord.time}`],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{l}</span>
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{v || '—'}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => navigate('/driver/history')}
                style={{
                  flex: 1, padding: '12px', borderRadius: 11,
                  border: '1px solid rgba(51,153,255,0.25)', background: 'rgba(51,153,255,0.1)',
                  color: '#3399ff', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                }}
              >📋 View History</button>
              <button
                onClick={() => navigate('/driver/dashboard')}
                style={{
                  flex: 1, padding: '12px', borderRadius: 11,
                  border: 'none', background: 'linear-gradient(135deg,#ff8800,#cc5500)',
                  color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                  boxShadow: '0 4px 16px rgba(255,136,0,0.3)',
                }}
              >📊 New Trip</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DriverLayout>
  );
}
