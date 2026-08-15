import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../layouts/DriverLayout';
import { motion, AnimatePresence } from 'framer-motion';

export default function HospitalPreAlert() {
  const navigate  = useNavigate();
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
  };

  const channels = [
    { icon: '📱', name: 'Hospital Emergency App' },
    { icon: '📞', name: 'Emergency Hotline' },
    { icon: '🖥️', name: 'Admin Dashboard' },
    { icon: '👨‍⚕️', name: 'Attending Physician' },
  ];

  return (
    <DriverLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>🔔 Hospital Pre-Alert</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Alert the hospital before arrival with patient details</p>
      </div>

      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        {/* Preview — empty state */}
        <div style={{ background: 'rgba(255,136,0,0.04)', border: '1px solid rgba(255,136,0,0.15)', borderRadius: 16, padding: '24px', marginBottom: 20 }}>
          <div style={{ color: 'rgba(255,136,0,0.6)', fontWeight: 800, fontSize: 14, marginBottom: 18 }}>📋 Pre-Alert Message Preview</div>
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: '16px 20px', fontFamily: 'monospace', fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 2 }}>
            <div>🏥 Hospital: <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span></div>
            <div>🚨 Emergency: <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span></div>
            <div>👤 Patient: <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span></div>
            <div>⏱️ ETA: <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span></div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div>❤️ HR: — &nbsp;|&nbsp; 💉 SpO₂: —</div>
              <div>🩺 BP: — &nbsp;|&nbsp; ⚠️ Status: —</div>
            </div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12, marginTop: 12 }}>Accept an emergency trip to populate this pre-alert</div>
        </div>

        {/* Notification channels */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 22px', marginBottom: 20 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, fontSize: 14, marginBottom: 14 }}>📡 Notification Channels</div>
          {channels.map(ch => (
            <div key={ch.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{ch.icon} {ch.name}</span>
              <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sent ? 'rgba(0,204,102,0.12)' : 'rgba(255,255,255,0.04)', border: sent ? '1px solid rgba(0,204,102,0.3)' : '1px solid rgba(255,255,255,0.08)', color: sent ? '#00cc66' : 'rgba(255,255,255,0.2)' }}>
                {sent ? '✓ Sent' : '⏳ Pending'}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.button key="send" onClick={handleSend} disabled={sending}
              style={{ width: '100%', padding: '18px', borderRadius: 14, border: 'none', background: sending ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#ff8800,#cc5500)', color: sending ? 'rgba(255,255,255,0.4)' : '#fff', cursor: sending ? 'not-allowed' : 'pointer', fontWeight: 900, fontSize: 16, transition: 'all 0.3s' }}>
              {sending ? '⏳ Sending Pre-Alert...' : '📡 SEND PRE-ALERT TO HOSPITAL'}
            </motion.button>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
              <div style={{ background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.3)', borderRadius: 14, padding: '20px', marginBottom: 14 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                <div style={{ color: '#00cc66', fontWeight: 900, fontSize: 16 }}>Pre-Alert Sent Successfully!</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>Hospital is prepared for your arrival</div>
              </div>
              <button onClick={() => navigate('/driver/complete')} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#00cc66,#009944)', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 15 }}>
                🏁 Complete Trip
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DriverLayout>
  );
}
