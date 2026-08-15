import DriverLayout from '../../layouts/DriverLayout';

export default function PatientTelemetry() {
  return (
    <DriverLayout>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>❤️ Patient Telemetry</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Live patient vitals monitoring</p>
      </div>

      {/* Vitals grid — empty */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '❤️', label: 'Heart Rate',      unit: 'bpm',  color: '#ff4466' },
          { icon: '💉', label: 'SpO₂',            unit: '%',    color: '#3399ff' },
          { icon: '🩺', label: 'Blood Pressure',  unit: 'mmHg', color: '#aa44ff' },
          { icon: '📊', label: 'Condition',        unit: '',     color: '#ff8800' },
        ].map(v => (
          <div key={v.label} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${v.color}20`, borderRadius: 14, padding: '20px' }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{v.icon}</div>
            <div style={{ color: 'rgba(255,255,255,0.15)', fontWeight: 900, fontSize: 26, marginBottom: 4 }}>—</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 6 }}>{v.label}</div>
            <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 11 }}>{v.unit}</div>
          </div>
        ))}
      </div>

      {/* ECG placeholder */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,204,102,0.1)', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ color: 'rgba(0,204,102,0.4)', fontWeight: 800, fontSize: 13, marginBottom: 16 }}>📈 ECG Monitor</div>
        <div style={{ height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 13 }}>No active patient — ECG data will appear here during a trip</div>
        </div>
      </div>

      {/* No active trip notice */}
      <div style={{ textAlign: 'center', padding: '30px 0' }}>
        <div style={{ fontSize: 48, opacity: 0.1, marginBottom: 14 }}>❤️</div>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 15 }}>No active trip</div>
        <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 13, marginTop: 6 }}>Patient vitals will stream here once a trip is in progress</div>
      </div>
    </DriverLayout>
  );
}
