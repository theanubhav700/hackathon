import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../layouts/DriverLayout';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';

function downloadPatientPDF(patient) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const accent = [255, 136, 0];
  const dark   = [5, 5, 20];
  const white  = [255, 255, 255];

  // Background
  doc.setFillColor(...dark);
  doc.rect(0, 0, W, 297, 'F');

  // Header bar
  doc.setFillColor(...accent);
  doc.rect(0, 0, W, 22, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ResQ — Patient Pre-Alert Record', 14, 14);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, W - 14, 14, { align: 'right' });

  let y = 34;

  const sectionHeader = (title, color = accent) => {
    doc.setFillColor(...color, 0.15);
    doc.setDrawColor(...color);
    doc.roundedRect(12, y - 5, W - 24, 8, 2, 2, 'FD');
    doc.setTextColor(...color);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 16, y);
    y += 8;
  };

  const row = (label, value) => {
    doc.setTextColor(160, 160, 180);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 16, y);
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value || '—'), 70, y);
    y += 7;
  };

  const divider = () => {
    doc.setDrawColor(40, 40, 60);
    doc.line(12, y, W - 12, y);
    y += 5;
  };

  // ── Patient Details ──
  sectionHeader('PATIENT DETAILS');
  row('Booking ID',      patient.bookingId || '—');
  row('Name',            patient.name);
  row('Mobile',          patient.mobile);
  row('Accepted At',     patient.acceptedAt ? new Date(patient.acceptedAt).toLocaleString('en-IN') : '—');
  divider();

  // ── Emergency ──
  y += 2;
  sectionHeader('EMERGENCY DETAILS', [255, 51, 51]);
  row('Type',            patient.emergencyType);
  row('Problem',         patient.problem);
  row('ETA',             patient.etaMin ? `${patient.etaMin} min` : '—');
  divider();

  // ── Location ──
  y += 2;
  sectionHeader('PICKUP LOCATION', [255, 170, 0]);
  row('Address',         patient.address);
  row('Coordinates',     patient.lat ? `${Number(patient.lat).toFixed(5)}, ${Number(patient.lon).toFixed(5)}` : '—');
  divider();

  // ── Notes ──
  y += 2;
  sectionHeader('NOTES', [170, 68, 255]);
  const notes = patient.notes && patient.notes !== '—' ? patient.notes : 'No additional notes.';
  doc.setTextColor(...white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(notes, W - 32);
  doc.text(lines, 16, y);
  y += lines.length * 6 + 4;
  divider();

  // Footer
  doc.setTextColor(80, 80, 100);
  doc.setFontSize(7);
  doc.text('ResQ Emergency Response System — Confidential Medical Record', W / 2, 290, { align: 'center' });

  const fname = `ResQ_Patient_${patient.bookingId || 'record'}_${Date.now()}.pdf`;
  doc.save(fname);
}

export default function PatientInfo() {
  const navigate = useNavigate();

  const patient = JSON.parse(localStorage.getItem('resq_patient_info') || 'null');

  if (!patient) {
    return (
      <DriverLayout>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 20, margin: '0 0 3px' }}>👤 Patient Information</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>Review patient details before pickup</p>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, opacity: 0.1, marginBottom: 12 }}>👤</div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No active patient</div>
          <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12, marginTop: 4 }}>Accept an emergency request to see patient details</div>
        </div>
      </DriverLayout>
    );
  }

  const acceptedTime = patient.acceptedAt
    ? new Date(patient.acceptedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <DriverLayout>
      {/* ── Header ── */}
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 20, margin: '0 0 3px' }}>👤 Patient Information</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>Accepted at {acceptedTime}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* PDF Download */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => downloadPatientPDF(patient)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 16px', borderRadius: 10, cursor: 'pointer', border: 'none',
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
            Save as PDF
          </motion.button>
          <div style={{ background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.3)', borderRadius: 20, padding: '4px 12px' }}>
            <span style={{ color: '#00cc66', fontSize: 11, fontWeight: 700 }}>● Active Booking</span>
          </div>
        </div>
      </div>

      {/* ── Cards grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

        {/* Patient Details */}
        <Section title="👤 Patient Details" color="#3399ff">
          <Row label="Name"       value={patient.name}                    highlight />
          <Row label="Mobile"     value={patient.mobile}                  color="#00cc66" />
          <Row label="Booking ID" value={patient.bookingId?.slice(-10) || '—'} />
        </Section>

        {/* Emergency Details */}
        <Section title="🚨 Emergency" color="#ff3333">
          <Row label="Type"    value={patient.emergencyType} color="#ff3333" highlight />
          <Row label="Problem" value={patient.problem}       color="#ff8800" />
          <Row label="ETA"     value={patient.etaMin ? `${patient.etaMin} min` : '—'} />
        </Section>

        {/* Pickup Address */}
        <Section title="📍 Pickup Address" color="#ffaa00">
          <div style={{
            background: 'rgba(255,170,0,0.06)', border: '1px solid rgba(255,170,0,0.18)',
            borderRadius: 8, padding: '8px 10px',
            color: '#fff', fontSize: 12, lineHeight: 1.5,
          }}>
            {patient.address || '—'}
          </div>
          {patient.lat && patient.lon && (
            <div style={{ marginTop: 5, color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
              GPS: {Number(patient.lat).toFixed(5)}, {Number(patient.lon).toFixed(5)}
            </div>
          )}
        </Section>

        {/* Notes */}
        <Section title="📝 Notes" color="#aa44ff">
          <div style={{
            background: 'rgba(170,68,255,0.06)', border: '1px solid rgba(170,68,255,0.18)',
            borderRadius: 8, padding: '8px 10px',
            color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.5,
          }}>
            {patient.notes && patient.notes !== '—' ? patient.notes : 'No additional notes.'}
          </div>
        </Section>
      </div>

      {/* ── Call button ── */}
      {patient.mobile && patient.mobile !== '—' && (
        <a
          href={`tel:${patient.mobile}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '10px', borderRadius: 10, marginBottom: 8,
            background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.3)',
            color: '#00cc66', textDecoration: 'none', fontWeight: 800, fontSize: 13,
            boxShadow: '0 4px 12px rgba(0,204,102,0.12)',
          }}
        >
          📞 Call Patient — {patient.mobile}
        </a>
      )}

      {/* ── Proceed button ── */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/driver/received')}
        style={{
          width: '100%', padding: '12px', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg,#3399ff,#0055cc)',
          color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 13,
          boxShadow: '0 6px 18px rgba(51,153,255,0.35)',
        }}>
        ✅ Patient Reviewed — Proceed to Receive
      </motion.button>
    </DriverLayout>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${color}25`,
      borderRadius: 12,
      padding: '12px 14px',
    }}>
      <div style={{ color, fontWeight: 800, fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, highlight, color }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 7, padding: '4px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</span>
      <span style={{ color: color || (highlight ? '#fff' : 'rgba(255,255,255,0.7)'), fontSize: 12, fontWeight: highlight ? 700 : 500, textAlign: 'right', maxWidth: '62%' }}>{value || '—'}</span>
    </div>
  );
}
