import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../layouts/DriverLayout';

export default function HospitalInfo() {
  const navigate = useNavigate();

  return (
    <DriverLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>🏥 Hospital Information</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Destination hospital details and arrival status</p>
      </div>

      {/* Empty hospital card */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,204,102,0.1)', borderRadius: 16, padding: '22px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(0,204,102,0.06)', border: '1px solid rgba(0,204,102,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, opacity: 0.4 }}>🏥</div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 700, fontSize: 16 }}>No hospital assigned</div>
            <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 13, marginTop: 4 }}>Accept an emergency to see destination hospital</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
        <InfoSection title="🚨 Emergency Department" color="#ff3333">
          <Row label="Department"     value="—" />
          <Row label="Available Beds" value="—" />
          <Row label="ICU Beds"       value="—" />
          <Row label="Emergency Beds" value="—" />
        </InfoSection>
        <InfoSection title="📡 Arrival Status" color="#3399ff">
          <Row label="Hospital Notified" value="—" />
          <Row label="Emergency Team"    value="—" />
          <Row label="Patient Type"      value="—" />
          <Row label="Expected ETA"      value="—" />
        </InfoSection>
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        <button onClick={() => navigate('/driver/prealert')} style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#ff8800,#cc5500)', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 14 }}>📡 Send Pre-Alert</button>
        <button onClick={() => navigate('/driver/complete')} style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#00cc66,#009944)', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 14 }}>🏁 Complete Trip</button>
      </div>
    </DriverLayout>
  );
}

function InfoSection({ title, color, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}15`, borderRadius: 14, padding: '18px 22px' }}>
      <div style={{ color, fontWeight: 800, fontSize: 13, marginBottom: 14, opacity: 0.7 }}>{title}</div>
      {children}
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
