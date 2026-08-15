import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../layouts/DriverLayout';
import { motion } from 'framer-motion';

export default function PatientInfo() {
  const navigate = useNavigate();

  // In a real app this would come from route state / context / API
  const patient = null;

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

  return (
    <DriverLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>👤 Patient Information</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Review patient details before pickup</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Section title="👤 Basic Information" color="#3399ff">
          <Row label="Name"        value={patient.name} highlight />
          <Row label="Age"         value={patient.age ? `${patient.age} years` : '—'} />
          <Row label="Gender"      value={patient.gender || '—'} />
          <Row label="Blood Group" value={patient.bloodGroup || '—'} color="#ff4466" />
          <Row label="Mobile"      value={patient.mobile || '—'} />
        </Section>

        <Section title="🚨 Emergency Details" color="#ff3333">
          <Row label="Emergency Type" value={patient.emergencyType || '—'} color="#ff3333" highlight />
          <Row label="Allergies"      value={patient.allergies || '—'} color="#ffaa00" />
          <Row label="Medications"    value={patient.medications || '—'} />
        </Section>

        <Section title="📝 Emergency Notes" color="#ff8800">
          <div style={{ background: 'rgba(255,136,0,0.08)', border: '1px solid rgba(255,136,0,0.2)', borderRadius: 10, padding: '12px 14px', color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.7 }}>
            {patient.notes || 'No notes provided.'}
          </div>
        </Section>

        <Section title="🆘 Emergency Contact" color="#00cc66">
          <Row label="Contact Name"   value={patient.ecName   || '—'} />
          <Row label="Contact Number" value={patient.ecNumber || '—'} />
        </Section>
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/driver/received')}
        style={{ marginTop: 24, width: '100%', padding: '18px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#3399ff,#0055cc)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 16, boxShadow: '0 8px 24px rgba(51,153,255,0.4)' }}>
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
      <span style={{ color: color || (highlight ? '#fff' : 'rgba(255,255,255,0.7)'), fontSize: 13, fontWeight: highlight ? 700 : 500 }}>{value}</span>
    </div>
  );
}
