import AdminLayout from '../../layouts/AdminLayout';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const CENTER = [20.5937, 78.9629]; // India center

export default function LiveMap() {
  return (
    <AdminLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>🗺️ Live Map</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Real-time location of all active ambulances</p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['#00cc66','Available'],['#ff8800','On Trip'],['#666','Offline']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '5px 14px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3333', display: 'inline-block', boxShadow: '0 0 6px #ff3333' }} />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600 }}>0 active now</span>
        </div>
      </div>

      {/* Map */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', height: 520 }}>
        <MapContainer center={CENTER} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom zoomControl>
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            opacity={0.6}
          />
        </MapContainer>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 12, textAlign: 'center' }}>
        Ambulance markers will appear here once drivers are online and active trips begin.
      </p>
    </AdminLayout>
  );
}
