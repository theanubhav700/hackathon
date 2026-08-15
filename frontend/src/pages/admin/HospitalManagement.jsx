import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { EmptyState } from './AdminDashboard';
import { motion, AnimatePresence } from 'framer-motion';

export default function HospitalManagement() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ name: '', address: '', phone: '', beds: '', speciality: '', status: 'Active' });

  return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>🏥 Hospital Management</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Manage hospitals, beds and incoming patients</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          padding: '11px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#00cc66,#009944)', color: '#fff',
          fontWeight: 700, fontSize: 14, boxShadow: '0 6px 20px rgba(0,204,102,0.3)',
        }}>+ Add Hospital</button>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1fr 0.8fr', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          {['Hospital Name', 'Address', 'Phone', 'Total Beds', 'Speciality', 'Status'].map(h => (
            <span key={h} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>
        <EmptyState icon="🏥" text="No hospitals added yet. Click '+ Add Hospital' to register one." />
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setShowAdd(false)}
          >
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#0d0d20', border: '1px solid rgba(0,204,102,0.2)', borderRadius: 20, padding: 36, width: '100%', maxWidth: 480 }}
            >
              <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 20, margin: '0 0 24px' }}>🏥 Add New Hospital</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[['Hospital Name','name','City Hospital'],['Address','address','123, Main Street, Lucknow'],['Phone','phone','+91 522 XXXXXXX'],['Total Beds','beds','200'],['Speciality','speciality','Multi-Speciality']].map(([label, key, ph]) => (
                  <div key={key}>
                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1.3, textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>{label}</label>
                    <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                ))}
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1.3, textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', appearance: 'none' }}>
                    {['Active','Inactive'].map(s => <option key={s} value={s} style={{ background: '#0d0d20' }}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
                <button style={{ flex: 2, padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg,#00cc66,#009944)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 14 }}>Save Hospital</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
