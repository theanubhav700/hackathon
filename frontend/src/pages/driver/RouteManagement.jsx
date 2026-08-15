import DriverLayout from '../../layouts/DriverLayout';

export default function RouteManagement() {
  return (
    <DriverLayout>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>🛣️ Route Management</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Compare routes and select the fastest path to hospital</p>
      </div>

      {/* ETA comparison bar — empty */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 }}>ETA Comparison</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', height: 80 }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 40, background: 'rgba(255,255,255,0.04)', borderRadius: '4px 4px 0 0', border: '1px solid rgba(255,255,255,0.07)' }} />
              <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, marginTop: 6 }}>R{n}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Route cards — empty */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontWeight: 900, fontSize: 14 }}>R{n}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 600, fontSize: 14 }}>Route {n}</div>
              <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12, marginTop: 2 }}>No active trip</div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.1)', fontWeight: 900, fontSize: 20 }}>—</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '40px 0 10px' }}>
        <div style={{ color: 'rgba(255,255,255,0.12)', fontSize: 13 }}>Route data will appear once a trip is in progress</div>
      </div>
    </DriverLayout>
  );
}
