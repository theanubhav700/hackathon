import { Link, useNavigate } from 'react-router-dom';
import DriverLayout from '../../layouts/DriverLayout';

export default function LiveJourney() {
  const navigate = useNavigate();

  return (
    <DriverLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>🗺️ Live Emergency Journey</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Navigating to hospital with patient on board</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Map */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(51,153,255,0.15)', borderRadius: 16, minHeight: 460, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(51,153,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(51,153,255,0.03) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.1 }}>🚑</div>
            <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 14 }}>No active journey</div>
            <div style={{ color: 'rgba(255,255,255,0.08)', fontSize: 12, marginTop: 6 }}>Start a trip to see live map</div>
          </div>

          {/* ETA/Distance overlays — empty */}
          <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(51,153,255,0.2)', borderRadius: 10, padding: '10px 16px' }}>
            <div style={{ color: 'rgba(51,153,255,0.4)', fontWeight: 900, fontSize: 20 }}>— min</div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>ETA to hospital</div>
          </div>
          <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,136,0,0.2)', borderRadius: 10, padding: '10px 16px' }}>
            <div style={{ color: 'rgba(255,136,0,0.4)', fontWeight: 900, fontSize: 20 }}>— km</div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>Distance left</div>
          </div>
        </div>

        {/* Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InfoCard title="🏥 Destination" color="#3399ff">
            <Row label="Hospital" value="—" />
            <Row label="ETA"      value="—" />
            <Row label="Distance" value="—" />
          </InfoCard>

          <InfoCard title="👤 Patient Status" color="#ff4466">
            <Row label="Patient"        value="—" />
            <Row label="Condition"      value="—" />
            <Row label="On Board Since" value="—" />
          </InfoCard>

          <InfoCard title="🚦 Traffic & Route" color="#ffaa00">
            <Row label="Current Traffic" value="—" />
            <Row label="Route"           value="—" />
            <Row label="Corridor"        value="—" />
          </InfoCard>

          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/driver/routes" style={{ flex: 1, padding: '12px', borderRadius: 12, textAlign: 'center', textDecoration: 'none', background: 'rgba(255,136,0,0.08)', border: '1px solid rgba(255,136,0,0.18)', color: 'rgba(255,136,0,0.6)', fontWeight: 700, fontSize: 13 }}>🛣️ Routes</Link>
            <Link to="/driver/traffic" style={{ flex: 1, padding: '12px', borderRadius: 12, textAlign: 'center', textDecoration: 'none', background: 'rgba(255,60,60,0.06)', border: '1px solid rgba(255,60,60,0.15)', color: 'rgba(255,85,85,0.6)', fontWeight: 700, fontSize: 13 }}>🚦 Alerts</Link>
          </div>

          <button onClick={() => navigate('/driver/hospital')} style={{ padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#3399ff,#0055cc)', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 14, boxShadow: '0 6px 20px rgba(51,153,255,0.3)' }}>
            🏥 View Hospital Info
          </button>
        </div>
      </div>
    </DriverLayout>
  );
}

function InfoCard({ title, color, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}18`, borderRadius: 14, padding: '14px 18px' }}>
      <div style={{ color, fontWeight: 800, fontSize: 13, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{label}</span>
      <span style={{ color: value === '—' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
