import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_COLORS = {
  Available: { bg: 'rgba(0,204,102,0.12)',  border: 'rgba(0,204,102,0.3)',  fg: '#00cc66' },
  'On Duty': { bg: 'rgba(255,170,0,0.12)',  border: 'rgba(255,170,0,0.3)',  fg: '#ffaa00' },
  Offline:   { bg: 'rgba(120,120,120,0.12)', border: 'rgba(120,120,120,0.3)', fg: '#888' },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.Offline;
  return (
    <span style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.fg,
      borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
      {status}
    </span>
  );
}

function Avatar({ name }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const hue = name ? [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360 : 200;
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},55%,32%)`, border: `2px solid hsl(${hue},55%,48%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 800, color: '#fff',
    }}>{initials}</div>
  );
}

const EMPTY_FORM = {
  fullName: '', mobile: '', email: '', password: '',
  licenseNo: '', experience: '', driverStatus: 'Available',
};

export default function DriverManagement() {
  const [drivers, setDrivers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('All');
  const [showAdd, setShowAdd]       = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');
  const [deleteId, setDeleteId]     = useState(null);
  const [showPass, setShowPass]     = useState(false);

  const token   = localStorage.getItem('resq_token');
  const headers = { Authorization: `Bearer ${token}` };

  // ── fetch ──────────────────────────────────────
  const fetchDrivers = () => {
    setLoading(true);
    axios.get(`${API_BASE}/admin/drivers`, { headers })
      .then(r => setDrivers(r.data.drivers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDrivers(); }, []);

  // ── filtered list ──────────────────────────────
  const list = filter === 'All' ? drivers : drivers.filter(d => d.driverStatus === filter);

  // ── save ───────────────────────────────────────
  const handleSave = async () => {
    setFormError('');
    if (!form.fullName.trim() || !form.mobile.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Full Name, Mobile, Email and Password are required.');
      return;
    }
    if (form.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await axios.post(`${API_BASE}/admin/drivers`, form, { headers });
      if (data.success) {
        setDrivers(prev => [data.driver, ...prev]);
        setShowAdd(false);
        setForm(EMPTY_FORM);
        setShowPass(false);
      } else {
        setFormError(data.message || 'Failed to save.');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Server error.');
    } finally {
      setSaving(false);
    }
  };

  // ── delete ─────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/admin/drivers/${id}`, { headers });
      setDrivers(prev => prev.filter(d => d._id !== id));
      setDeleteId(null);
    } catch {}
  };

  const col  = { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' };
  const cell = { color: 'rgba(255,255,255,0.75)', fontSize: 13 };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>👨‍✈️ Driver Management</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
            Manage drivers, assignments and availability
            <span style={{ marginLeft: 10, color: '#ffaa00', fontWeight: 700 }}>{drivers.length} total</span>
          </p>
        </div>
        <button onClick={() => { setShowAdd(true); setFormError(''); setForm(EMPTY_FORM); setShowPass(false); }} style={{
          padding: '11px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#ffaa00,#cc7700)', color: '#fff',
          fontWeight: 700, fontSize: 14, boxShadow: '0 6px 20px rgba(255,170,0,0.3)',
        }}>+ Add Driver</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Available', color: '#00cc66', count: drivers.filter(d => d.driverStatus === 'Available').length },
          { label: 'On Duty',   color: '#ffaa00', count: drivers.filter(d => d.driverStatus === 'On Duty').length },
          { label: 'Offline',   color: '#888',    count: drivers.filter(d => d.driverStatus === 'Offline').length },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.color}30`,
            borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ color: s.color, fontWeight: 800, fontSize: 20 }}>{s.count}</span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {['All', 'Available', 'On Duty', 'Offline'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 18px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: filter === f ? 'rgba(255,170,0,0.15)' : 'rgba(255,255,255,0.04)',
            border: filter === f ? '1px solid rgba(255,170,0,0.35)' : '1px solid rgba(255,255,255,0.08)',
            color: filter === f ? '#ffaa00' : 'rgba(255,255,255,0.45)',
          }}>{f}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.1fr 1.2fr 0.8fr 1.2fr 1fr 0.5fr', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          {['Name', 'Mobile', 'License No.', 'Exp.', 'Assigned Amb.', 'Status', ''].map(h => (
            <span key={h} style={col}>{h}</span>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>Loading...
          </div>
        )}

        {!loading && list.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍✈️</div>
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
              {filter !== 'All' ? `No ${filter} drivers.` : "No drivers added yet. Click '+ Add Driver' to register one."}
            </div>
          </div>
        )}

        {!loading && list.map((d, i) => (
          <div key={d._id} style={{
            display: 'grid', gridTemplateColumns: '1.8fr 1.1fr 1.2fr 0.8fr 1.2fr 1fr 0.5fr',
            padding: '14px 24px', alignItems: 'center',
            borderBottom: i < list.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Name + avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={d.fullName} />
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{d.fullName}</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{d.email}</div>
              </div>
            </div>

            <span style={cell}>{d.mobile}</span>
            <span style={{ color: d.licenseNo ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)', fontSize: 13 }}>
              {d.licenseNo || '—'}
            </span>
            <span style={{ ...cell, color: d.experience ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)' }}>
              {d.experience ? `${d.experience} yr` : '—'}
            </span>
            <span style={{ color: d.assignedAmbulance ? '#3399ff' : 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: d.assignedAmbulance ? 600 : 400 }}>
              {d.assignedAmbulance?.vehicleId || 'Unassigned'}
            </span>
            <StatusBadge status={d.driverStatus || 'Offline'} />
            <button onClick={() => setDeleteId(d._id)} style={{
              background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.2)',
              color: '#ff5555', borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
            }}>Delete</button>
          </div>
        ))}
      </div>

      {/* Add Driver Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setShowAdd(false)}
          >
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#0d0d20', border: '1px solid rgba(255,170,0,0.2)', borderRadius: 20, padding: 36, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}
            >
              <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 20, margin: '0 0 6px' }}>👨‍✈️ Add New Driver</h2>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: '0 0 24px' }}>A login account will be created for this driver.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Required fields */}
                <div style={{ color: '#ffaa00', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>Account Info</div>

                {[['Full Name *', 'fullName', 'Ramesh Kumar', 'text'],
                  ['Mobile *',    'mobile',   '+91 98765 43210', 'text'],
                  ['Email *',     'email',    'driver@resq.com', 'email'],
                ].map(([label, key, ph, type]) => (
                  <div key={key}>
                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1.3, textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>{label}</label>
                    <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                ))}

                {/* Password with toggle */}
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1.3, textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters"
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 44px 11px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 15, padding: 0 }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* Driver-specific */}
                <div style={{ color: '#ffaa00', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 6, marginBottom: 2 }}>Driver Details</div>

                {[['License No.', 'licenseNo', 'DL-XXXXXX'], ['Experience (years)', 'experience', '3']].map(([label, key, ph]) => (
                  <div key={key}>
                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1.3, textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>{label}</label>
                    <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                ))}

                <div>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1.3, textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Status</label>
                  <select value={form.driverStatus} onChange={e => setForm(f => ({ ...f, driverStatus: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}>
                    {['Available', 'On Duty', 'Offline'].map(s => <option key={s} value={s} style={{ background: '#0d0d20' }}>{s}</option>)}
                  </select>
                </div>
              </div>

              {formError && (
                <div style={{ marginTop: 14, background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.25)', borderRadius: 10, padding: '10px 14px', color: '#ff6666', fontSize: 13 }}>
                  ⚠️ {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '12px', borderRadius: 10, background: saving ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#ffaa00,#cc7700)', border: 'none', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 14 }}>
                  {saving ? '⏳ Creating...' : '✅ Create Driver Account'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              style={{ background: '#0d0d20', border: '1px solid rgba(255,60,60,0.25)', borderRadius: 20, padding: 32, maxWidth: 380, width: '90%', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
              <h3 style={{ color: '#fff', fontWeight: 800, margin: '0 0 8px' }}>Delete Driver?</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 24px' }}>Their account will be permanently removed.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,40,40,0.15)', border: '1px solid rgba(255,40,40,0.3)', color: '#ff5555', cursor: 'pointer', fontWeight: 700 }}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
