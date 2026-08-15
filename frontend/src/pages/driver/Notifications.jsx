import { useState, useEffect } from 'react';
import DriverLayout from '../../layouts/DriverLayout';
import { motion, AnimatePresence } from 'framer-motion';

export default function Notifications() {
  const [notifs, setNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('resq_driver_notifications') || '[]'); } catch { return []; }
  });

  const loadFromStorage = () => {
    try {
      const data = JSON.parse(localStorage.getItem('resq_driver_notifications') || '[]');
      setNotifs(data);
    } catch {}
  };

  useEffect(() => {
    loadFromStorage();
    const handleUpdate = () => loadFromStorage();
    window.addEventListener('resq_new_notification', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('resq_new_notification', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const clearAll = () => {
    localStorage.removeItem('resq_driver_notifications');
    setNotifs([]);
  };

  return (
    <DriverLayout>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 4px' }}>Notifications & Alerts</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>Live incoming patient emergency requests</p>
          </div>
          {notifs.length > 0 && (
            <button
              onClick={clearAll}
              style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 12 }}
            >Clear All</button>
          )}
        </div>

        {notifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'rgba(255,255,255,0.02)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 44, opacity: 0.2, marginBottom: 12 }}>🔔</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 15 }}>No notifications right now</div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 4 }}>When customers book an ambulance, emergency details will appear here instantly.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {notifs.map((n, i) => (
              <motion.div
                key={n.id || i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: n.status === 'pending' ? '1px solid rgba(255,51,51,0.3)' : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16, padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>🚨</span>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{n.title}</span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{n.time}</span>
                </div>

                <div style={{
                  background: 'rgba(255,51,51,0.06)', border: '1px solid rgba(255,51,51,0.15)',
                  borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Patient Name:</span>
                    <strong style={{ color: '#fff' }}>{n.customerName || '—'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Mobile Number:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ color: '#00cc66' }}>{n.customerPhone || '—'}</strong>
                      {n.customerPhone && n.customerPhone !== '—' && (
                        <a
                          href={`tel:${n.customerPhone}`}
                          style={{
                            background: 'rgba(0,204,102,0.15)', border: '1px solid rgba(0,204,102,0.35)',
                            color: '#00cc66', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: 'none',
                          }}
                        >📞 Call</a>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Current Location:</span>
                    <strong style={{ color: '#fff', maxWidth: '65%', textAlign: 'right' }}>📍 {n.customerLocation || '—'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Problem / Issue:</span>
                    <strong style={{ color: '#ffaa00' }}>⚠️ {n.problem || n.emergencyType || 'Emergency'}</strong>
                  </div>
                  {n.message && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Additional Notes:</span>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>{n.message}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DriverLayout>
  );
}
