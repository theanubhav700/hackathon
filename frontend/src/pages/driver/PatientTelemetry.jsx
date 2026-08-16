import { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { io } from 'socket.io-client';
import DriverLayout from '../../layouts/DriverLayout';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const VITALS = [
  { icon: '❤️', label: 'Heart Rate',     field: 'heartRate', unit: 'bpm',  color: '#ff4466', placeholder: 'e.g. 72',     hint: 'Normal: 60–100 bpm'       },
  { icon: '💉', label: 'SpO₂ (Oxygen)',  field: 'spo2',      unit: '%',    color: '#3399ff', placeholder: 'e.g. 98',     hint: 'Normal: 95–100%'          },
  { icon: '🩺', label: 'Blood Pressure', field: 'bp',        unit: 'mmHg', color: '#aa44ff', placeholder: 'e.g. 120/80', hint: 'Normal: 90/60 – 120/80'   },
  { icon: '🌡️', label: 'Temperature',   field: 'temp',      unit: '°C',   color: '#ff8800', placeholder: 'e.g. 37.2',   hint: 'Normal: 36.1–37.2 °C'     },
];

const SITUATIONS = [
  { value: 'critical', label: '🔴 Critical',  color: '#ff3333', bg: 'rgba(255,51,51,0.12)',  border: 'rgba(255,51,51,0.4)'  },
  { value: 'serious',  label: '🟠 Serious',   color: '#ff8800', bg: 'rgba(255,136,0,0.12)', border: 'rgba(255,136,0,0.4)'  },
  { value: 'stable',   label: '🟡 Stable',    color: '#ffcc00', bg: 'rgba(255,204,0,0.12)', border: 'rgba(255,204,0,0.4)'  },
  { value: 'normal',   label: '🟢 Normal',    color: '#00cc66', bg: 'rgba(0,204,102,0.12)', border: 'rgba(0,204,102,0.4)'  },
];

// Strip any non-latin characters (emojis etc.) that jsPDF can't render
function safe(str) {
  return String(str || '').replace(/[^\x00-\x7F]/g, '').trim() || '-';
}

function generatePDF(vitals, situation, patient) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw  = doc.internal.pageSize.getWidth();
  const ph  = doc.internal.pageSize.getHeight();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const sitLabels = { critical: 'CRITICAL', serious: 'SERIOUS', stable: 'STABLE', normal: 'NORMAL' };
  const sitColors = { critical: [220, 50, 50], serious: [220, 120, 0], stable: [200, 170, 0], normal: [0, 180, 90] };
  const [sr, sg, sb] = sitColors[situation] || [0, 180, 90];

  // ── Header bar ──────────────────────────────────────────
  doc.setFillColor(10, 10, 30);
  doc.rect(0, 0, pw, 28, 'F');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 136, 0);
  doc.text('ResQ  Patient Telemetry Report', 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 160);
  doc.text(`Generated: ${dateStr}  ${timeStr}`, 14, 21);
  doc.text(`Booking ID: ${safe(patient.bookingId)}`, pw - 14, 21, { align: 'right' });

  // ── Patient info box ────────────────────────────────────
  let y = 35;
  doc.setFillColor(18, 18, 40);
  doc.roundedRect(14, y, pw - 28, 30, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(150, 150, 200);
  doc.text('PATIENT DETAILS', 19, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 220);
  doc.text(`Name:`, 19, y + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(safe(patient.name), 40, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 220);
  doc.text(`Mobile:`, 19, y + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(safe(patient.mobile), 40, y + 22);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 220);
  doc.text(`Emergency:`, pw / 2, y + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(safe(patient.emergencyType), pw / 2 + 28, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 220);
  doc.text(`Address:`, pw / 2, y + 22);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text(safe(patient.address).substring(0, 40), pw / 2 + 22, y + 22);

  // ── Situation badge ─────────────────────────────────────
  y += 38;
  doc.setFillColor(18, 18, 40);
  doc.roundedRect(14, y, pw - 28, 14, 3, 3, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 180, 180);
  doc.text('Patient Situation:', 19, y + 9);

  doc.setTextColor(sr, sg, sb);
  doc.text(sitLabels[situation] || 'NORMAL', 70, y + 9);

  // Situation dot
  doc.setFillColor(sr, sg, sb);
  doc.circle(66, y + 6.5, 2.5, 'F');

  // ── Vitals table ────────────────────────────────────────
  y += 22;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('VITALS', 14, y);
  y += 5;

  // Table header row
  doc.setFillColor(30, 30, 65);
  doc.rect(14, y, pw - 28, 10, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(140, 140, 200);
  doc.text('Parameter',  19,  y + 7);
  doc.text('Recorded Value', 85, y + 7);
  doc.text('Unit',       130, y + 7);
  doc.text('Normal Range', 155, y + 7);
  y += 10;

  const rows = [
    { label: 'Heart Rate',     value: vitals.heartRate, unit: 'bpm',  ref: '60 - 100 bpm'    },
    { label: 'SpO2 (Oxygen)',  value: vitals.spo2,      unit: '%',    ref: '95 - 100 %'       },
    { label: 'Blood Pressure', value: vitals.bp,        unit: 'mmHg', ref: '90/60 - 120/80'   },
    { label: 'Temperature',    value: vitals.temp,      unit: 'C',    ref: '36.1 - 37.2 C'    },
  ];

  rows.forEach((row, i) => {
    const ry = y + i * 12;
    doc.setFillColor(i % 2 === 0 ? 15 : 20, i % 2 === 0 ? 15 : 20, i % 2 === 0 ? 32 : 40);
    doc.rect(14, ry, pw - 28, 12, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text(row.label, 19, ry + 8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(safe(row.value), 85, ry + 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 160);
    doc.text(row.unit, 130, ry + 8);
    doc.text(row.ref,  155, ry + 8);
  });

  // ── Footer ──────────────────────────────────────────────
  doc.setFillColor(10, 10, 25);
  doc.rect(0, ph - 14, pw, 14, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 110);
  doc.text('ResQ Emergency Response System  -  Confidential Medical Record', 14, ph - 5);
  doc.text('Page 1 of 1', pw - 14, ph - 5, { align: 'right' });

  const filename = `ResQ_Vitals_${safe(patient.name).replace(/\s+/g, '_') || 'Patient'}_${now.getTime()}.pdf`;
  doc.save(filename);
}

export default function PatientTelemetry() {
  const patient  = JSON.parse(localStorage.getItem('resq_patient_info') || '{}');
  const booking  = JSON.parse(localStorage.getItem('resq_active_booking') || '{}');
  const driver   = JSON.parse(localStorage.getItem('resq_user') || '{}');
  const bookingId = patient.bookingId || booking.bookingId || null;

  const [vitals, setVitals]         = useState({ heartRate: '', spo2: '', bp: '', temp: '' });
  const [situation, setSituation]   = useState('');
  const [saved, setSaved]           = useState(false);
  const [pdfReady, setPdfReady]     = useState(false);
  const [erPushed, setErPushed]     = useState(false);
  const [socketConn, setSocketConn] = useState(false);

  const socketRef = useRef(null);

  // ── Socket connect ─────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect',    () => setSocketConn(true));
    socket.on('disconnect', () => setSocketConn(false));
    return () => socket.disconnect();
  }, []);

  const allFilled = VITALS.every(v => vitals[v.field].trim() !== '') && situation !== '';

  const handleSave = () => {
    const record = { ...vitals, situation, savedAt: new Date().toISOString() };
    localStorage.setItem('resq_patient_vitals', JSON.stringify(record));
    setSaved(true);
    setPdfReady(true);
    setTimeout(() => setSaved(false), 2500);

    // ── Push to ER via socket ──────────────────────────
    if (socketRef.current?.connected && bookingId) {
      socketRef.current.emit('er:vitals_push', {
        bookingId,
        vitals,
        situation,
        patientName: patient.name || '—',
        driverName:  driver.fullName || '—',
      });

      // Start ECG stream (every 300ms for 30s)
      let count = 0;
      const ecgInterval = setInterval(() => {
        socketRef.current?.emit('er:ecg_push', { bookingId, situation });
        count++;
        if (count > 100) clearInterval(ecgInterval);
      }, 300);

      setErPushed(true);
      setTimeout(() => setErPushed(false), 4000);
    }
  };

  const handleDownloadPDF = () => {
    generatePDF(vitals, situation, patient);
  };

  return (
    <DriverLayout>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 22, margin: '0 0 4px' }}>❤️ Patient Report</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>Record patient vitals during transport</p>
      </div>

      {/* ── 4 Vital input cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 14 }}>
        {VITALS.map(v => (
          <div key={v.field} style={{
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${vitals[v.field] ? v.color + '50' : v.color + '18'}`,
            borderRadius: 14, padding: '16px 18px', transition: 'border-color 0.2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{v.icon}</span>
              <div>
                <div style={{ color: v.color, fontWeight: 800, fontSize: 13 }}>{v.label}</div>
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>{v.hint}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                value={vitals[v.field]}
                onChange={e => { setVitals(prev => ({ ...prev, [v.field]: e.target.value })); setPdfReady(false); }}
                placeholder={v.placeholder}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${vitals[v.field] ? v.color + '60' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 8, padding: '9px 12px',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s',
                }}
              />
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{v.unit}</span>
            </div>
            {vitals[v.field] && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.color, display: 'inline-block' }} />
                <span style={{ color: v.color, fontSize: 10, fontWeight: 700 }}>Recorded</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Situation selector ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 14,
      }}>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: 12, marginBottom: 12 }}>
          🚦 Patient Situation
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {SITUATIONS.map(s => {
            const active = situation === s.value;
            return (
              <button
                key={s.value}
                onClick={() => { setSituation(s.value); setPdfReady(false); }}
                style={{
                  padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
                  background: active ? s.bg : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? s.border : 'rgba(255,255,255,0.08)'}`,
                  color: active ? s.color : 'rgba(255,255,255,0.35)',
                  fontWeight: active ? 800 : 500, fontSize: 12,
                  fontFamily: 'inherit', transition: 'all 0.18s',
                  boxShadow: active ? `0 4px 14px ${s.border}` : 'none',
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Save button ── */}
      <button
        onClick={handleSave}
        disabled={!allFilled}
        style={{
          width: '100%', padding: '13px', borderRadius: 12,
          background: saved
            ? 'rgba(0,204,102,0.2)'
            : allFilled
              ? 'linear-gradient(135deg,#ff4466,#cc0033)'
              : 'rgba(255,255,255,0.05)',
          border: saved ? '1px solid rgba(0,204,102,0.4)' : '1px solid transparent',
          color: saved ? '#00cc66' : allFilled ? '#fff' : 'rgba(255,255,255,0.2)',
          cursor: allFilled ? 'pointer' : 'not-allowed',
          fontWeight: 900, fontSize: 14, fontFamily: 'inherit',
          transition: 'all 0.25s', marginBottom: 10,
          boxShadow: allFilled && !saved ? '0 6px 20px rgba(255,68,102,0.35)' : 'none',
        }}
      >
        {saved ? '✅ Vitals Saved!' : '💾 Save Vitals'}
      </button>

      {/* ── ER Push status ── */}
      {erPushed && (
        <div style={{
          background: 'rgba(0,204,102,0.08)', border: '1px solid rgba(0,204,102,0.25)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00cc66', boxShadow: '0 0 8px #00cc66', flexShrink: 0 }} />
          <div>
            <div style={{ color: '#00cc66', fontWeight: 800, fontSize: 12 }}>📡 Vitals sent to Hospital ER</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>ECG stream started — ER team notified</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: socketConn ? '#00cc66' : '#888', display: 'inline-block' }} />
            <span style={{ color: socketConn ? '#00cc66' : '#888', fontSize: 10 }}>{socketConn ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      )}

      {/* ── PDF download card — appears after save ── */}
      {pdfReady && (
        <div style={{
          background: 'rgba(51,153,255,0.06)', border: '1px solid rgba(51,153,255,0.25)',
          borderRadius: 14, padding: '18px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          {/* Info */}
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, marginBottom: 4 }}>📄 Vitals Report Ready</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
              Patient: <span style={{ color: '#fff' }}>{patient.name || '—'}</span>
              &nbsp;·&nbsp; Situation: <span style={{
                color: SITUATIONS.find(s => s.value === situation)?.color || '#fff',
                fontWeight: 700,
              }}>{SITUATIONS.find(s => s.value === situation)?.label || '—'}</span>
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'HR',   value: vitals.heartRate, unit: 'bpm'  },
                { label: 'SpO₂', value: vitals.spo2,      unit: '%'    },
                { label: 'BP',   value: vitals.bp,        unit: 'mmHg' },
                { label: 'Temp', value: vitals.temp,      unit: '°C'   },
              ].map(r => (
                <div key={r.label} style={{
                  background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '5px 10px',
                  display: 'flex', gap: 5, alignItems: 'baseline',
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{r.label}</span>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{r.value}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{r.unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={handleDownloadPDF}
            style={{
              padding: '12px 24px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#3399ff,#0055cc)',
              color: '#fff', fontWeight: 900, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 18px rgba(51,153,255,0.4)',
              display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            }}
          >
            ⬇️ Download PDF
          </button>
        </div>
      )}
    </DriverLayout>
  );
}
