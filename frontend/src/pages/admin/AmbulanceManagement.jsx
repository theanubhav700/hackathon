import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_COLORS = {
  Available: { bg: 'rgba(0,204,102,0.12)', border: 'rgba(0,204,102,0.3)', fg: '#00cc66' },
  Busy:      { bg: 'rgba(255,136,0,0.12)', border: 'rgba(255,136,0,0.3)', fg: '#ff8800' },
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

const TYPES = ['Advanced Life Support', 'Basic Life Support', 'Critical Care', 'Patient Transport'];
const EMPTY_FORM = { vehicleId: '', type: '', plate: '', year: '', status: 'Available' };

export default function AmbulanceManagement() {
  const [ambulances, setAmbulances] = useState([]);
  const [drivers, setDrivers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('All');
  const [showAdd, setShowAdd]       = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');
  const [deleteId, setDeleteId]     = useState(null);
  const [assignModal, setAssignModal] = useState(null); // ambulance object
  const [assignDriver, setAssignDriver] = useState('');
  const [assigning, setAssigning]   = useState(false);

  const token   = localStorage.getItem('resq_token');
  const headers = { Authorization: `Bearer ${token}` };

  // ── fetch ambulances + drivers ─────────────────
  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get(`${API_BASE}/admin/ambulances`, { headers }),
      axios.get(`${API_BASE}/admin/drivers`,    { headers }),
    ]).then(([ambRes, drvRes]) => {
      setAmbulances(ambRes.data.ambulances || []);
      setDrivers(drvRes.data.drivers || []);
    }).catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const list = filter === 'All' ? ambulances : ambulances.filter(a => a.status === filter);

  // ── save new ambulance ─────────────────────────
  const handleSave = async () => {
    setFormError('');
    if (!form.vehicleId.trim() || !form.type || !form.plate.trim()) {
      setFormError('Vehicle ID, Type and Plate Number are required.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await axios.post(`${API_BASE}/admin/ambulances`, form, { headers });
      if (data.success) {
        setAmbulances(prev => [data.ambulance, ...prev]);
        setShowAdd(false);
        setForm(EMPTY_FORM);
      } else setFormError(data.message || 'Failed to save.');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Server error.');
    } finally { setSaving(false); }
  };

  // ── assign driver ──────────────────────────────
  const handleAssign = async () => {
    setAssigning(true);
    try {
      const { data } = await axios.patch(
        `${API_BASE}/admin/ambulances/${assignModal._id}/assign`,
        { driverId: assignDriver || null },
        { headers }
      );
      if (data.success) {
        setAmbulances(prev => prev.map(a => a._id === assignModal._id ? data.ambulance : a));
        setAssignModal(null);
        setAssignDriver('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Assignment failed.');
    } finally { setAssigning(false); }
  };

  // ── delete ─────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/admin/ambulances/${id}`, { headers });
      setAmbulances(prev => prev.filter(a => a._id !== id));
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
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>🚑 Ambulance Management</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
            Manage fleet — status, assignment, availability
            <span style={{ marginLeft: 10, color: '#3399ff', fontWeight: 700 }}>{ambulances.length} total</span>
          </p>
        </div>
        <button onClick={() => { setShowAdd(true); setFormError(''); setForm(EMPTY_FORM); }} style={{
          padding: '11px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#3399ff,#0055cc)', color: '#fff',
          fontWeight: 700, fontSize: 14, boxShadow: '0 6px 20px rgba(51,153,255,0.3)',
        }}>+ Add Ambulance</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Available', color: '#00cc66', count: ambulances.filter(a => a.status === 'Available').length },
          { label: 'Busy',      color: '#ff8800', count: ambulances.filter(a => a.status === 'Busy').length },
          { label: 'Offline',   color: '#888',    count: ambulances.filter(a => a.status === 'Offline').length },
          { label: 'Assigned',  color: '#aa44ff', count: ambulances.filter(a => a.driver).length },
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
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {['All', 'Available', 'Busy', 'Offline'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 18px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: filter === f ? 'rgba(51,153,255,0.15)' : 'rgba(255,255,255,0.04)',
            border: filter === f ? '1px solid rgba(51,153,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
            color: filter === f ? '#3399ff' : 'rgba(255,255,255,0.45)',
          }}>{f}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr 1.2fr 0.7fr 1.2fr 1fr 1fr', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          {['Vehicle ID', 'Type', 'Plate No.', 'Year', 'Assigned Driver', 'Status', 'Actions'].map(h => (
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
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚑</div>
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
              {filter !== 'All' ? `No ${filter} ambulances.` : "No ambulances yet."}
            </div>
          </div>
        )}

        {!loading && list.map((a, i) => (
          <div key={a._id} style={{
            display: 'grid', gridTemplateColumns: '1fr 1.8fr 1.2fr 0.7fr 1.2fr 1fr 1fr',
            padding: '14px 24px', alignItems: 'center',
            borderBottom: i < list.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ ...cell, fontWeight: 700, color: '#3399ff' }}>{a.vehicleId}</span>
            <span style={cell}>{a.type}</span>
            <span style={cell}>{a.plate}</span>
            <span style={cell}>{a.year || '—'}</span>

            {/* Driver assignment */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {a.driver ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#aa44ff,#7700cc)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
                  }}>
                    {a.driver.fullName?.[0]?.toUpperCase() || 'D'}
                  </div>
                  <span style={{ color: '#aa44ff', fontSize: 12, fontWeight: 600 }}>{a.driver.fullName}</span>
                </div>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Unassigned</span>
              )}
            </div>

            <StatusBadge status={a.status} />

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setAssignModal(a); setAssignDriver(a.driver?._id || ''); }}
                style={{
                  background: 'rgba(170,68,255,0.1)', border: '1px solid rgba(170,68,255,0.25)',
                  color: '#aa44ff', borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700,
                }}>
                👤 Assign
              </button>
              <button onClick={() => setDeleteId(a._id)} style={{
                background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.2)',
                color: '#ff5555', borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
                fontSize: 11, fontWeight: 600,
              }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Assign Driver Modal ───────────────────────────── */}
      <AnimatePresence>
        {assignModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setAssignModal(null)}
          >
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#0d0d20', border: '1px solid rgba(170,68,255,0.25)', borderRadius: 20, padding: 36, width: '100%', maxWidth: 440 }}
            >
              <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 20, margin: '0 0 6px' }}>👤 Assign Driver</h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '0 0 24px' }}>
                Ambulance: <strong style={{ color: '#3399ff' }}>{assignModal.vehicleId}</strong> — {assignModal.type}
              </p>

              {/* Current driver */}
              {assignModal.driver && (
                <div style={{ background: 'rgba(170,68,255,0.08)', border: '1px solid rgba(170,68,255,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 3 }}>CURRENTLY ASSIGNED</div>
                    <div style={{ color: '#aa44ff', fontWeight: 700, fontSize: 14 }}>{assignModal.driver.fullName}</div>
                  </div>
                  <button
                    onClick={() => { setAssignDriver(''); }}
                    style={{ background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.25)', color: '#ff5555', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    ✕ Remove
                  </button>
                </div>
              )}

              {/* Driver selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1.3, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                  Select Driver
                </label>

                {drivers.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, textAlign: 'center' }}>
                    No drivers available. Add drivers from Driver Management first.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                    {/* Unassign option */}
                    <div
                      onClick={() => setAssignDriver('')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                        borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                        background: assignDriver === '' ? 'rgba(255,255,255,0.06)' : 'transparent',
                        border: assignDriver === '' ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)',
                      }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>—</div>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No driver (Unassign)</span>
                      {assignDriver === '' && <span style={{ marginLeft: 'auto', color: '#3399ff', fontSize: 14 }}>✓</span>}
                    </div>

                    {drivers.map(d => {
                      const selected = assignDriver === d._id;
                      const hue = d.fullName ? [...d.fullName].reduce((a, c) => a + c.charCodeAt(0), 0) % 360 : 200;
                      return (
                        <div key={d._id}
                          onClick={() => setAssignDriver(d._id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                            borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                            background: selected ? 'rgba(170,68,255,0.1)' : 'rgba(255,255,255,0.02)',
                            border: selected ? '1px solid rgba(170,68,255,0.35)' : '1px solid rgba(255,255,255,0.06)',
                          }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: `hsl(${hue},55%,32%)`, border: `2px solid hsl(${hue},55%,48%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 800, color: '#fff',
                          }}>{d.fullName[0].toUpperCase()}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: selected ? '#aa44ff' : '#fff', fontWeight: selected ? 700 : 500, fontSize: 13 }}>{d.fullName}</div>
                            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 1 }}>
                              {d.mobile}
                              {d.assignedAmbulance && (
                                <span style={{ marginLeft: 8, color: '#ffaa00' }}>
                                  · Currently on {d.assignedAmbulance.vehicleId}
                                </span>
                              )}
                            </div>
                          </div>
                          {selected && <span style={{ color: '#aa44ff', fontSize: 16, flexShrink: 0 }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setAssignModal(null)} style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
                <button onClick={handleAssign} disabled={assigning} style={{
                  flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                  background: assigning ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#aa44ff,#7700cc)',
                  color: assigning ? 'rgba(255,255,255,0.3)' : '#fff',
                  cursor: assigning ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 14,
                }}>
                  {assigning ? '⏳ Assigning...' : assignDriver ? '✅ Assign Driver' : '✅ Confirm (Unassign)'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Ambulance Modal ───────────────────────────── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setShowAdd(false)}
          >
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#0d0d20', border: '1px solid rgba(51,153,255,0.2)', borderRadius: 20, padding: 36, width: '100%', maxWidth: 460 }}
            >
              <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 20, margin: '0 0 24px' }}>🚑 Add New Ambulance</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[['Vehicle ID *', 'vehicleId', 'AMB-009'], ['Plate Number *', 'plate', 'UP-32-AB-0001'], ['Year', 'year', '2024']].map(([label, key, ph]) => (
                  <div key={key}>
                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1.3, textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>{label}</label>
                    <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                ))}
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1.3, textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Type *</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: form.type ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}>
                    <option value="" style={{ background: '#0d0d20' }}>Select type</option>
                    {TYPES.map(t => <option key={t} value={t} style={{ background: '#0d0d20' }}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1.3, textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}>
                    {['Available', 'Busy', 'Offline'].map(s => <option key={s} value={s} style={{ background: '#0d0d20' }}>{s}</option>)}
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
                <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '12px', borderRadius: 10, background: saving ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#3399ff,#0055cc)', border: 'none', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 14 }}>
                  {saving ? '⏳ Saving...' : '✅ Save Ambulance'}
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
            style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              style={{ background: '#0d0d20', border: '1px solid rgba(255,60,60,0.25)', borderRadius: 20, padding: 32, maxWidth: 380, width: '90%', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
              <h3 style={{ color: '#fff', fontWeight: 800, margin: '0 0 8px' }}>Delete Ambulance?</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 24px' }}>This cannot be undone.</p>
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
