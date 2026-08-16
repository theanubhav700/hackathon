import { useState } from 'react';
import DriverLayout from '../../layouts/DriverLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';

const EMERGENCY_COLORS = {
  'cardiac arrest': '#ff3333', 'road accident': '#ff8800', 'stroke': '#aa44ff',
  'breathing': '#3399ff', 'breathing issue': '#3399ff', 'maternity': '#ff66aa',
  'fall': '#ffaa00', 'burn': '#ff5500', 'fire': '#ff5500',
};

function emergencyColor(type = '') {
  const key = type.toLowerCase();
  for (const k of Object.keys(EMERGENCY_COLORS)) {
    if (key.includes(k)) return EMERGENCY_COLORS[k];
  }
  return '#888';
}

function downloadHistoryPDF(trips) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;

  const addPage = () => {
    doc.addPage();
    // dark bg
    doc.setFillColor(5, 5, 20);
    doc.rect(0, 0, W, 297, 'F');
  };

  // Cover page bg
  doc.setFillColor(5, 5, 20);
  doc.rect(0, 0, W, 297, 'F');

  // Header bar
  doc.setFillColor(255, 136, 0);
  doc.rect(0, 0, W, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('ResQ — Complete Trip History', 14, 15);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}  |  Total Trips: ${trips.length}`, W - 14, 15, { align: 'right' });

  let y = 36;

  trips.forEach((t, idx) => {
    // Check if new page needed
    if (y > 255) { addPage(); y = 20; }

    // Trip header
    doc.setFillColor(25, 25, 45);
    doc.roundedRect(10, y - 5, W - 20, 9, 2, 2, 'F');
    doc.setTextColor(255, 136, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Trip #${idx + 1}  —  ${t.id || '—'}`, 14, y);
    doc.setTextColor(150, 150, 170);
    doc.setFontSize(8);
    doc.text(`${t.date || '—'}  ${t.time || ''}`, W - 14, y, { align: 'right' });
    y += 10;

    const field = (label, value, col) => {
      if (y > 270) { addPage(); y = 20; }
      doc.setTextColor(120, 120, 140);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(label, 16, y);
      doc.setTextColor(...(col || [220, 220, 230]));
      doc.setFont('helvetica', 'bold');
      const lines = doc.splitTextToSize(String(value || '—'), 110);
      doc.text(lines, 72, y);
      y += lines.length * 5 + 1;
    };

    field('Patient',    t.patient,   [255, 255, 255]);
    field('Mobile',     t.mobile);
    field('Emergency',  t.emergency, [255, 136, 0]);
    field('Problem',    t.problem);
    field('Address',    t.address);
    field('Hospital',   t.hospital,  [51, 153, 255]);
    field('Duration',   t.duration,  [0, 204, 102]);
    field('Distance',   t.distance,  [0, 204, 102]);

    if (t.vitals) {
      field('HR',   t.vitals.hr   ? `${t.vitals.hr} bpm`  : '—', [255, 68, 102]);
      field('SpO₂', t.vitals.spo2 ? `${t.vitals.spo2}%`   : '—', [51, 153, 255]);
      field('BP',   t.vitals.bp   || '—',                         [255, 170, 0]);
      field('Temp', t.vitals.temp ? `${t.vitals.temp}°C`  : '—', [0, 204, 102]);
    }

    // Divider
    y += 3;
    doc.setDrawColor(40, 40, 65);
    doc.line(10, y, W - 10, y);
    y += 8;
  });

  // Footer on last page
  doc.setTextColor(60, 60, 80);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('ResQ Emergency Response System — Confidential Trip Records', W / 2, 291, { align: 'center' });

  doc.save(`ResQ_TripHistory_${Date.now()}.pdf`);
}

export default function TripHistory() {
  const [trips]  = useState(() => JSON.parse(localStorage.getItem('resq_trip_history') || '[]'));
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState(null);

  const filtered = trips.filter(t =>
    !search ||
    (t.patient  || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.hospital || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.id       || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.emergency|| '').toLowerCase().includes(search.toLowerCase())
  );

  const col = { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' };

  return (
    <DriverLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 22, margin: '0 0 4px' }}>📋 Trip History</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
            All completed emergency trips — <span style={{ color: '#3399ff', fontWeight: 700 }}>{trips.length}</span> total
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* PDF Download */}
          {trips.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => downloadHistoryPDF(trips)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 10, cursor: 'pointer', border: 'none',
                background: 'linear-gradient(135deg,#cc3300,#991100)',
                color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(204,51,0,0.3)',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Save All as PDF
            </motion.button>
          )}
          {trips.length > 0 && (
            <button
              onClick={() => { if (window.confirm('Clear all trip history?')) { localStorage.removeItem('resq_trip_history'); window.location.reload(); } }}
              style={{
                padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: 'rgba(255,51,51,0.07)', border: '1px solid rgba(255,51,51,0.2)',
                color: 'rgba(255,100,100,0.6)', fontFamily: 'inherit',
              }}
            >🗑 Clear</button>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 11, padding: '10px 14px', marginBottom: 16,
      }}>
        <span style={{ fontSize: 15 }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by patient name, hospital, trip ID, emergency type..."
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, fontFamily: 'inherit' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 15, padding: 0 }}>✕</button>
        )}
      </div>

      {/* Trip list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '70px 0' }}>
          <div style={{ fontSize: 44, opacity: 0.1, marginBottom: 12 }}>📋</div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
            {search ? 'No trips match your search.' : 'No trips yet. Completed trips will appear here.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '0.9fr 1.2fr 1.3fr 1fr 0.7fr 0.7fr 0.9fr',
            padding: '10px 18px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
          }}>
            {['Trip ID', 'Patient', 'Hospital', 'Date', 'Duration', 'Distance', 'Emergency'].map(h => (
              <span key={h} style={col}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          <AnimatePresence>
            {filtered.map((t, i) => {
              const color  = emergencyColor(t.emergency);
              const isOpen = expanded === t.id;
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    background: isOpen ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isOpen ? color + '30' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 12, overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* Main row */}
                  <div
                    onClick={() => setExpanded(isOpen ? null : t.id)}
                    style={{
                      display: 'grid', gridTemplateColumns: '0.9fr 1.2fr 1.3fr 1fr 0.7fr 0.7fr 0.9fr',
                      padding: '13px 18px', alignItems: 'center', cursor: 'pointer',
                    }}
                    onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ color: '#3399ff', fontWeight: 700, fontSize: 11, fontFamily: 'monospace' }}>
                      {(t.id || '—').slice(-10)}
                    </span>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{t.patient || '—'}</span>
                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{t.hospital || '—'}</span>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{t.date || '—'}</div>
                      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>{t.time || '—'}</div>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{t.duration || '—'}</span>
                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{t.distance || '—'}</span>
                    <span style={{
                      background: `${color}15`, border: `1px solid ${color}30`,
                      color, borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 700,
                      display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
                    }}>{t.emergency || '—'}</span>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 18px 16px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 24px' }}>
                            {[
                              ['Booking ID',  t.id],
                              ['Patient',     t.patient],
                              ['Mobile',      t.mobile],
                              ['Address',     t.address],
                              ['Problem',     t.problem],
                              ['Hospital',    t.hospital],
                              ['Duration',    t.duration],
                              ['Distance',    t.distance],
                              ['Completed',   t.date ? `${t.date} · ${t.time}` : '—'],
                            ].map(([l, v]) => (
                              <div key={l}>
                                <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>{l}</div>
                                <div style={{ color: v && v !== '—' ? '#fff' : 'rgba(255,255,255,0.15)', fontSize: 12, fontWeight: 600, marginTop: 2 }}>{v || '—'}</div>
                              </div>
                            ))}
                          </div>

                          {/* Vitals */}
                          {t.vitals && (
                            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                                Final Vitals
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {[
                                  ['🫀', 'HR',    t.vitals.hr,   'bpm', '#ff4466'],
                                  ['💉', 'SpO₂', t.vitals.spo2, '%',   '#3399ff'],
                                  ['🩺', 'BP',   t.vitals.bp,   '',    '#ffaa00'],
                                  ['🌡️', 'Temp', t.vitals.temp, '°C',  '#00cc66'],
                                ].map(([icon, label, val, unit, c]) => (
                                  <div key={label} style={{ background: `${c}0d`, border: `1px solid ${c}22`, borderRadius: 8, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 13 }}>{icon}</span>
                                    <div>
                                      <div style={{ color: c, fontWeight: 800, fontSize: 12 }}>{val || '—'}{unit && val && val !== '—' ? ` ${unit}` : ''}</div>
                                      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>{label}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </DriverLayout>
  );
}
