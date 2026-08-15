import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../layouts/DriverLayout';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { id: 1, label: 'Arrived at Hospital', icon: '🏥' },
  { id: 2, label: 'Patient Handed Over',  icon: '👨‍⚕️' },
  { id: 3, label: 'Paperwork Completed',  icon: '📋' },
];

export default function CompleteTrip() {
  const navigate = useNavigate();
  const [steps, setSteps]         = useState([false, false, false]);
  const [completed, setCompleted] = useState(false);
  const [compTime, setCompTime]   = useState(null);

  const toggleStep = (i) => setSteps(s => { const n = [...s]; n[i] = !n[i]; return n; });
  const allDone    = steps.every(Boolean);

  const handleComplete = () => {
    setCompTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setCompleted(true);
  };

  const tripSummary = [
    ['Trip ID',      '—'],
    ['Patient',      '—'],
    ['Emergency',    '—'],
    ['Hospital',     '—'],
    ['Pickup Time',  '—'],
    ['Arrival Time', compTime || '—'],
    ['Duration',     compTime ? '— min' : '—'],
    ['Distance',     '—'],
  ];

  return (
    <DriverLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>🏁 Complete Trip</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Mark trip as completed and hand over patient</p>
      </div>

      <AnimatePresence mode="wait">
        {!completed ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ maxWidth: 600, margin: '0 auto' }}>
            {/* Steps */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px', marginBottom: 20 }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 20 }}>📋 Completion Checklist</div>
              {STEPS.map((s, i) => (
                <motion.div key={s.id} whileHover={{ scale: 1.01 }} onClick={() => toggleStep(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 12, marginBottom: 10, cursor: 'pointer', background: steps[i] ? 'rgba(0,204,102,0.08)' : 'rgba(255,255,255,0.02)', border: steps[i] ? '1px solid rgba(0,204,102,0.25)' : '1px solid rgba(255,255,255,0.07)', transition: 'all 0.2s' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: steps[i] ? '#00cc66' : 'transparent', border: steps[i] ? '2px solid #00cc66' : '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', transition: 'all 0.2s' }}>
                    {steps[i] ? '✓' : ''}
                  </div>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <span style={{ color: steps[i] ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: steps[i] ? 700 : 400, fontSize: 14 }}>{s.label}</span>
                  {steps[i] && <span style={{ marginLeft: 'auto', color: '#00cc66', fontSize: 12, fontWeight: 700 }}>✓ Done</span>}
                </motion.div>
              ))}
            </div>

            {/* Trip summary */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 22px', marginBottom: 20 }}>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 700, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 }}>Trip Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 0' }}>
                {tripSummary.slice(0, 6).map(([l, v]) => (
                  <div key={l} style={{ padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginBottom: 2 }}>{l}</div>
                    <div style={{ color: v === '—' ? 'rgba(255,255,255,0.15)' : '#fff', fontSize: 13, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleComplete} disabled={!allDone}
              style={{ width: '100%', padding: '18px', borderRadius: 14, border: 'none', background: allDone ? 'linear-gradient(135deg,#00cc66,#009944)' : 'rgba(255,255,255,0.06)', color: allDone ? '#fff' : 'rgba(255,255,255,0.2)', cursor: allDone ? 'pointer' : 'not-allowed', fontWeight: 900, fontSize: 16, boxShadow: allDone ? '0 8px 24px rgba(0,204,102,0.4)' : 'none', transition: 'all 0.3s' }}>
              {allDone ? '🏁 COMPLETE TRIP' : `Complete all ${steps.filter(Boolean).length}/3 steps to finish`}
            </button>
          </motion.div>
        ) : (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 150 }} style={{ fontSize: 80, marginBottom: 20 }}>🏁</motion.div>
            <div style={{ color: '#00cc66', fontWeight: 900, fontSize: 28, marginBottom: 8 }}>Trip Completed!</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 6 }}>Completed at: <strong style={{ color: '#fff' }}>{compTime}</strong></div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 32 }}>Patient successfully handed over</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => navigate('/driver/history')} style={{ flex: 1, padding: '13px', borderRadius: 11, border: '1px solid rgba(51,153,255,0.25)', background: 'rgba(51,153,255,0.1)', color: '#3399ff', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>📋 View History</button>
              <button onClick={() => navigate('/driver/dashboard')} style={{ flex: 1, padding: '13px', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg,#ff8800,#cc5500)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>📊 Dashboard</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DriverLayout>
  );
}
