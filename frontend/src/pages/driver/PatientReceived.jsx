import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../layouts/DriverLayout';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatientReceived() {
  const navigate = useNavigate();
  const [received, setReceived] = useState(false);
  const [time, setTime]         = useState(null);

  const handleReceived = () => {
    setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setReceived(true);
  };

  return (
    <DriverLayout>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>✅ Patient Received</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Confirm patient pickup and start journey</p>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          {!received ? (
            <motion.div key="pre" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {/* Checklist */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px', marginBottom: 20 }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 18 }}>📋 Pre-Departure Checklist</div>
                {[
                  'Patient identity confirmed',
                  'Patient loaded safely into ambulance',
                  'Seatbelt / stretcher secured',
                  'IV line / oxygen checked',
                  'Destination hospital confirmed',
                ].map((item, i) => <CheckItem key={i} text={item} />)}
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleReceived}
                style={{ width: '100%', padding: '20px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#00cc66,#009944)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 17, boxShadow: '0 10px 30px rgba(0,204,102,0.4)' }}>
                ✅ PATIENT RECEIVED — Start Journey
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="post" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '40px 20px' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                style={{ fontSize: 72, marginBottom: 20 }}>✅</motion.div>
              <div style={{ color: '#00cc66', fontWeight: 900, fontSize: 24, marginBottom: 8 }}>Patient Received!</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 6 }}>Received at: <strong style={{ color: '#fff' }}>{time}</strong></div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 32 }}>Journey started — navigate to hospital</div>
              <button onClick={() => navigate('/driver/journey')} style={{ padding: '14px 36px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#ff8800,#cc5500)', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 15 }}>
                🗺️ Start Live Journey
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DriverLayout>
  );
}

function CheckItem({ text }) {
  const [checked, setChecked] = useState(false);
  return (
    <div onClick={() => setChecked(c => !c)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
      <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, transition: 'all 0.2s', background: checked ? '#00cc66' : 'transparent', border: checked ? '2px solid #00cc66' : '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>
        {checked ? '✓' : ''}
      </div>
      <span style={{ color: checked ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.75)', fontSize: 14, textDecoration: checked ? 'line-through' : 'none', transition: 'all 0.2s' }}>{text}</span>
    </div>
  );
}
