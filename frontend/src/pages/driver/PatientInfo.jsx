import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../layouts/DriverLayout';
import { motion } from 'framer-motion';

export default function PatientInfo() {
  const navigate = useNavigate();

  // Load from localStorage — saved on accept
  const patient = JSON.parse(localStorage.getItem('resq_patient_info') || 'null');

  if (!patient) {
    return (
      <DriverLayout>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>👤 Patient Information</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Review patient details before pickup</p>
        </div>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <div style={{ fontSize: 56, opacity: 0.1, marginBottom: 16 }}>👤</div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 15 }}>No active patient</div>
          <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 13, marginTop: 6 }}>Accept an emergency request to see patient details</div>
        </div>
      </DriverLayout>
    );
  }

  const acceptedTime = patient.acceptedAt
    ? new Date(patient.acceptedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <DriverLayout>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>👤 Patient Information</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Accepted at {acceptedTime}</p>
        </div>
        <div style={{ background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.3)', borderRadius: 20, padding: '5px 16px' }}>
          <span style={{ color: '#00cc66', fontSize: 12, fontWeight: 700 }}>● Active Booking</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>

        {/* Basic Info */}
        <Section title="👤 Patient Details" color="#3399ff">
          <Row label="Name"   value={patient.name}   highlight />
          <Row label="Mobile" value={patient.mobile} color="#00cc66" />
          <Row label="Booking ID" value={patient.bookingId?.slice(-10) || '—'} />
        </Section>

        {/* Emergency */}
        <Section title="🚨 Emergency Details" color="#ff3333">
          <Row label="Type"    value={patient.emergencyType} color="#ff3333" highlight />
          <Row label="Problem" value={patient.problem}       color="#ff8800" />
          <Row label="ETA"     value={patient.etaMin ? `${patient.etaMin} min` : '—'} />
        </Section>

        {/* Address / Location */}
        <Section title="📍 Pickup Address" color="#ffaa00">
          <div style={{
            background: 'rgba(255,170,0,0.06)', border: '1px solid rgba(255,170,0,0.18)',
            borderRadius: 10, padding: '12px 14px',
            color: '#fff', fontSize: 14, lineHeight: 1.6,
          }}>
            {patient.address || '—'}
          </div>
          {patient.lat && patient.lon && (
            <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
              GPS: {Number(patient.lat).toFixed(5)}, {Number(patient.lon).toFixed(5)}
            </div>
          )}
        </Section>

        {/* Notes */}
        <Section title="📝 Patient Notes" color="#aa44ff">
          <div style={{
            background: 'rgba(170,68,255,0.06)', border: '1px solid rgba(170,68,255,0.18)',
            borderRadius: 10, padding: '12px 14px',
            color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.7,
          }}>
            {patient.notes && patient.notes !== '—' ? patient.notes : 'No additional notes.'}
          </div>
        </Section>
      </div>

      {/* Call button */}
      {patient.mobile && patient.mobile !== '—' && (
        <a
          href={`tel:${patient.mobile}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', padding: '14px', borderRadius: 14, marginBottom: 12,
            background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.3)',
            color: '#00cc66', textDecoration: 'none', fontWeight: 800, fontSize: 15,
            boxShadow: '0 4px 16px rgba(0,204,102,0.15)',
          }}
        >
          📞 Call Patient — {patient.mobile}
        </a>
      )}

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/driver/received')}
        style={{
          width: '100%', padding: '16px', borderRadius: 14, border: 'none',
          background: 'linear-gradient(135deg,#3399ff,#0055cc)',
          color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 16,
          boxShadow: '0 8px 24px rgba(51,153,255,0.4)',
        }}>
        ✅ Patient Reviewed — Proceed to Receive
      </motion.button>
    </DriverLayout>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}25`, borderRadius: 16, padding: '20px 22px' }}>
      <div style={{ color, fontWeight: 800, fontSize: 14, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, highlight, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</span>
      <span style={{ color: color || (highlight ? '#fff' : 'rgba(255,255,255,0.7)'), fontSize: 13, fontWeight: highlight ? 700 : 500, textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
    </div>
  );
}
