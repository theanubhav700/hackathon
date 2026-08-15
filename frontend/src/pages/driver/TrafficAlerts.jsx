import DriverLayout from '../../layouts/DriverLayout';

export default function TrafficAlerts() {
  return (
    <DriverLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>🚦 Traffic & Emergency Alerts</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>0 active alerts</p>
        </div>
      </div>

      {/* Corridor status banner */}
      <div style={{ background: 'rgba(51,153,255,0.05)', border: '1px solid rgba(51,153,255,0.15)', borderRadius: 14, padding: '14px 20px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(51,153,255,0.3)', flexShrink: 0 }} />
        <div>
          <div style={{ color: 'rgba(51,153,255,0.5)', fontWeight: 800, fontSize: 14 }}>Emergency Corridor: INACTIVE</div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 2 }}>No active trip. Corridor will activate when an emergency is accepted.</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: 52, opacity: 0.1, marginBottom: 14 }}>🚦</div>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 15 }}>No active alerts</div>
        <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 13, marginTop: 6 }}>Traffic and route alerts will appear here during an active trip</div>
      </div>
    </DriverLayout>
  );
}
