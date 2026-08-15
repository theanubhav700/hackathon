import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import CustomerLayout from '../../layouts/CustomerLayout';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom red pin icon
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

// Smoothly fly to new position
function FlyToLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 15, { duration: 1.4 });
  }, [coords]);
  return null;
}

const mockAmbulances = [
  { id: 'AMB-101', type: 'Advanced Life Support', status: 'Available', distance: '1.2 km', eta: '3 min', driver: 'Raj Kumar',   driverPhone: '+91 98765 43210', driverExp: '5 yrs', rating: 4.8, plate: 'UP-32-AB-1234', year: 2022, color: '#00cc66' },
  { id: 'AMB-203', type: 'Basic Life Support',    status: 'Available', distance: '2.4 km', eta: '6 min', driver: 'Suresh Verma', driverPhone: '+91 91234 56789', driverExp: '3 yrs', rating: 4.5, plate: 'UP-32-CD-5678', year: 2021, color: '#3399ff' },
  { id: 'AMB-305', type: 'Critical Care',          status: 'Available', distance: '3.8 km', eta: '9 min', driver: 'Mohan Singh',  driverPhone: '+91 87654 32109', driverExp: '7 yrs', rating: 4.9, plate: 'UP-32-EF-9012', year: 2023, color: '#aa44ff' },
  { id: 'AMB-118', type: 'Advanced Life Support', status: 'Available', distance: '4.1 km', eta: '11 min', driver: 'Vikram Das',  driverPhone: '+91 76543 21098', driverExp: '4 yrs', rating: 4.6, plate: 'UP-32-GH-3456', year: 2022, color: '#ffaa00' },
];

const emergencyTypes = [
  { id: 'accident',  label: 'Road Accident',      icon: '🚗', desc: 'Vehicle collision or road injury' },
  { id: 'cardiac',   label: 'Cardiac Arrest',     icon: '❤️', desc: 'Heart attack or chest pain' },
  { id: 'fire',      label: 'Fire / Burn Injury', icon: '🔥', desc: 'Burns or fire-related injuries' },
  { id: 'maternity', label: 'Maternity',          icon: '🤱', desc: 'Labor pain or pregnancy emergency' },
  { id: 'stroke',    label: 'Stroke',             icon: '🧠', desc: 'Sudden numbness or speech difficulty' },
  { id: 'fall',      label: 'Fall / Fracture',    icon: '🦴', desc: 'Bone fracture or serious fall' },
  { id: 'breathing', label: 'Breathing Problem',  icon: '🫁', desc: 'Difficulty breathing or asthma' },
  { id: 'other',     label: 'Other Emergency',    icon: '🚨', desc: 'Any other medical emergency' },
];

// ── Custom Emergency Dropdown ─────────────────────────────
function EmergencyDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = emergencyTypes.find(e => e.id === value);

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger button */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'rgba(255,51,51,0.07)',
          border: `1px solid ${open ? 'rgba(255,51,51,0.5)' : 'rgba(255,51,51,0.2)'}`,
          borderRadius: 12, padding: '14px 18px',
          cursor: 'pointer', transition: 'all 0.2s',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 22, flexShrink: 0 }}>{selected?.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{selected?.label}</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{selected?.desc}</div>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, flexShrink: 0 }}
        >▼</motion.span>
      </div>

      {/* Dropdown list */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              background: '#0d0d20',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, overflow: 'hidden',
              zIndex: 200,
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            }}
          >
            {emergencyTypes.map((et, i) => {
              const isSelected = et.id === value;
              return (
                <div
                  key={et.id}
                  onClick={() => { onChange(et.id); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '13px 18px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(255,51,51,0.12)' : 'transparent',
                    borderBottom: i < emergencyTypes.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>{et.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: isSelected ? '#ff4444' : '#fff', fontWeight: isSelected ? 700 : 500, fontSize: 14 }}>{et.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 2 }}>{et.desc}</div>
                  </div>
                  {isSelected && <span style={{ color: '#ff4444', fontSize: 16 }}>✓</span>}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Real Leaflet Map Preview ──────────────────────────────
function MapPreview({ coords, locationName }) {
  if (!coords) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.4 }}
      style={{ marginTop: 16, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,51,51,0.25)', position: 'relative' }}
    >
      {/* LIVE badge */}
      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 1000,
        background: '#ff3333', color: '#fff',
        fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 4,
        boxShadow: '0 2px 8px rgba(255,51,51,0.5)',
      }}>● LIVE</div>

      <MapContainer
        center={coords}
        zoom={15}
        style={{ height: 220, width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={false}
      >
        {/* Esri World Imagery — satellite view */}
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        {/* Road/label overlay on top of satellite */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          opacity={0.6}
        />
        <FlyToLocation coords={coords} />
        <Marker position={coords} icon={redIcon}>
          <Popup>
            <div style={{ fontFamily: 'sans-serif', fontSize: 13 }}>
              <strong>📍 Your Location</strong><br />
              {locationName}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </motion.div>
  );
}

// ── Ambulance Card ────────────────────────────────────────
function AmbulanceCard({ amb, selected, onSelect, onBook }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: selected ? `${amb.color}0d` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${selected ? amb.color + '55' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 16, overflow: 'hidden', transition: 'all 0.3s',
        boxShadow: selected ? `0 0 30px ${amb.color}22` : 'none',
      }}
    >
      <div onClick={() => { onSelect(amb.id); setExpanded(e => !e); }}
        style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20 }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: `${amb.color}18`, border: `2px solid ${amb.color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>🚑</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{amb.vehicleId || amb.id}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: amb.color, background: `${amb.color}18`, border: `1px solid ${amb.color}33`, padding: '2px 10px', borderRadius: 20 }}>{amb.type}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#00cc66', background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.25)', padding: '2px 10px', borderRadius: 20 }}>● {amb.status}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            Driver: <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{amb.driver}</span>
            {amb.driverExp !== '—' && <><span style={{ margin: '0 8px', opacity: 0.3 }}>·</span>{amb.driverExp} exp</>}
            <span style={{ margin: '0 8px', opacity: 0.3 }}>·</span> ⭐ {amb.rating}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#3399ff', fontWeight: 800, fontSize: 18 }}>{amb.distance}</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Distance</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#ff3333', fontWeight: 800, fontSize: 18 }}>{amb.eta}</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>ETA</div>
          </div>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s', flexShrink: 0 }}>▼</div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Driver Details</div>
                  {[{ label: 'Name', value: amb.driver }, { label: 'Phone', value: amb.driverPhone }, { label: 'Experience', value: amb.driverExp }, { label: 'Rating', value: `⭐ ${amb.rating} / 5.0` }].map(d => (
                    <div key={d.label} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, minWidth: 80 }}>{d.label}</span>
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{d.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Ambulance Details</div>
                  {[{ label: 'Vehicle ID', value: amb.vehicleId || amb.id }, { label: 'Type', value: amb.type }, { label: 'Plate', value: amb.plate || '—' }, { label: 'Year', value: amb.year || '—' }].map(d => (
                    <div key={d.label} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, minWidth: 80 }}>{d.label}</span>
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{d.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', flex: 1, minWidth: 150 }}>
                  <button onClick={(e) => { e.stopPropagation(); onBook(amb); }}
                    style={{
                      padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      fontWeight: 800, fontSize: 14,
                      background: `linear-gradient(135deg, ${amb.color}, ${amb.color}cc)`,
                      color: '#fff', boxShadow: `0 8px 24px ${amb.color}44`, transition: 'all 0.25s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >🚑 Book Now</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Booking Confirm Modal ─────────────────────────────────
function BookingModal({ amb, location, onClose, onConfirm }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#0a0a18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '36px', maxWidth: 460, width: '100%', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚑</div>
          <h2 style={{ color: '#fff', fontWeight: 900, margin: '0 0 8px' }}>Confirm Booking</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>Review details before booking</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px', marginBottom: 24 }}>
          {[{ label: 'Ambulance', value: `${amb.vehicleId || amb.id} — ${amb.type}` }, { label: 'Plate', value: amb.plate || '—' }, { label: 'Driver', value: amb.driver }, { label: 'Distance', value: amb.distance }, { label: 'ETA', value: amb.eta }, { label: 'Pickup', value: location }].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>{row.label}</span>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 2, padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg,#ff2222,#cc0000)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 800, boxShadow: '0 8px 24px rgba(255,34,34,0.4)' }}>🚑 Confirm Booking</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main BookAmbulance Page ───────────────────────────────
export default function BookAmbulance() {
  const [location, setLocation]       = useState('');
  const [locLoading, setLocLoading]   = useState(false);
  const [locDetected, setLocDetected] = useState(false);
  const [coords, setCoords]           = useState(null);
  const [emergency, setEmergency]     = useState('accident');
  const [message, setMessage]         = useState('');
  const [selectedAmb, setSelectedAmb] = useState(null);
  const [bookingAmb, setBookingAmb]   = useState(null);
  const [booked, setBooked]           = useState(false);
  const [bookedInfo, setBookedInfo]   = useState(null);
  const [searching, setSearching]     = useState(false);
  const [ambulances, setAmbulances]   = useState([]);
  const [searched, setSearched]       = useState(false);
  const [driverAssigned, setDriverAssigned] = useState(null);
  const [noDriver, setNoDriver]             = useState(false);
  const [toast, setToast]                   = useState(null);
  const socketRef = useRef(null);
  const customer  = JSON.parse(localStorage.getItem('resq_user') || '{}');

  const showToast = (msg, color = '#ff3333', duration = 5000) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), duration);
  };

  // ── Socket connection ────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Register as customer for direct callbacks
      socket.emit('customer:register', { customerId: customer._id });
    });

    // Driver found — waiting for acceptance (single handler, covers both first assign & re-assign)
    socket.on('booking:driver_found', (data) => {
      setDriverAssigned(data);
      showToast(`🚑 ${data.driverName} notified — waiting for acceptance...`, '#3399ff', 6000);
    });

    // Driver accepted ✅
    socket.on('booking:accepted', (data) => {
      setDriverAssigned(prev => ({ ...prev, ...data, accepted: true }));
      showToast(`✅ ${data.driverName} accepted! En route in ${data.etaMin} min`, '#00cc66', 7000);
      // Save trip for live tracking
      const stored = JSON.parse(localStorage.getItem('resq_active_trip') || '{}');
      localStorage.setItem('resq_active_trip', JSON.stringify({
        ...stored,
        driverName:   data.driverName,
        ambulanceId:  data.ambulanceId,
        driverLat:    data.driverLat,
        driverLon:    data.driverLon,
        etaMin:       data.etaMin,
        distanceKm:   data.distanceKm,
        driverAccepted: true,
      }));
    });

    // Driver rejected ❌ — backend auto-finds next driver
    socket.on('booking:rejected', (data) => {
      showToast(data.message || '🔄 Driver declined. Finding another...', '#ff8800', 5000);
      setDriverAssigned(null);
    });

    // No driver available at all
    socket.on('booking:no_driver', (data) => {
      setNoDriver(true);
      showToast(data.message || '⚠️ No drivers available right now', '#ff5555', 6000);
    });

    return () => socket.disconnect();
  }, [customer._id]);

  // Auto detect using browser Geolocation API
  const detectLocation = () => {
    setLocLoading(true);
    setLocDetected(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords([latitude, longitude]);
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await res.json();
            const addr = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setLocation(addr);
          } catch {
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
          setLocDetected(true);
          setLocLoading(false);
        },
        () => {
          // Fallback
          setCoords([26.8467, 80.9462]); // Lucknow fallback
          setLocation('Sector 12, Noida, Uttar Pradesh — 201301');
          setLocDetected(true);
          setLocLoading(false);
        }
      );
    } else {
      setCoords([26.8467, 80.9462]);
      setLocation('Sector 12, Noida, Uttar Pradesh — 201301');
      setLocDetected(true);
      setLocLoading(false);
    }
  };

  // ── Haversine distance calculator ──────────────────────
  const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ── Fetch ambulances from backend + calculate distance ──
  const searchAmbulances = async () => {
    if (!coords) {
      alert('Please detect your location first!');
      return;
    }
    setSearching(true);
    setAmbulances([]);
    setSearched(false);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res  = await fetch(`${API_BASE}/ambulances/available`);
      const data = await res.json();

      if (data.success && data.ambulances.length > 0) {
        // Only available ambulances
        const available = data.ambulances.filter(a => a.status === 'Available');

        // Assign simulated nearby coords to each ambulance & calculate real distance
        const COLORS = ['#00cc66', '#3399ff', '#aa44ff', '#ffaa00', '#ff6600'];
        const withDistance = available.map((a, i) => {
          // Simulate ambulance location — random offset ±0.02 deg (~2km) from patient
          const ambLat = coords[0] + (Math.random() - 0.5) * 0.04;
          const ambLon = coords[1] + (Math.random() - 0.5) * 0.04;
          const distKm = haversineKm(coords[0], coords[1], ambLat, ambLon);
          const etaMin = Math.max(1, Math.round(distKm / 0.5)); // ~30 km/h avg speed

          return {
            ...a,
            ambLat, ambLon,
            distance: `${distKm.toFixed(1)} km`,
            distanceRaw: distKm,
            eta: `${etaMin} min`,
            driver: a.driver?.fullName || 'Assigned Driver',
            driverPhone: a.driver?.mobile || '—',
            driverExp: '—',
            rating: (4.2 + Math.random() * 0.7).toFixed(1),
            color: COLORS[i % COLORS.length],
          };
        });

        // Sort by distance — nearest first
        withDistance.sort((a, b) => a.distanceRaw - b.distanceRaw);
        setAmbulances(withDistance);
      } else {
        setAmbulances([]);
      }
    } catch (err) {
      console.error('Failed to fetch ambulances:', err);
      setAmbulances([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  };

  const handleConfirmBooking = () => {
    const amb = bookingAmb;

    // Generate booking ID
    const bookingId = 'BK-' + Date.now();

    // Save trip data for live tracking
    const tripData = {
      tripId:      bookingId,
      patientLat:  coords ? coords[0] : 28.5355,
      patientLon:  coords ? coords[1] : 77.3910,
      ambulanceLat: amb.ambLat || (coords ? coords[0] + 0.03 : 28.565),
      ambulanceLon: amb.ambLon || (coords ? coords[1] + 0.03 : 77.421),
      driverName:  amb.driver,
      ambulanceId: amb.vehicleId || amb.id,
    };
    localStorage.setItem('resq_active_trip', JSON.stringify(tripData));

    // ── Emit to socket → nearest driver will receive it ──
    if (socketRef.current?.connected) {
      socketRef.current.emit('booking:new', {
        bookingId,
        customerId:    customer._id,
        customerLat:   coords ? coords[0] : 28.5355,
        customerLon:   coords ? coords[1] : 77.3910,
        customerName:  customer.fullName || 'Customer',
        emergencyType: emergency,
        message:       message || '',
        ambulanceId:   amb.vehicleId || amb.id,
        ambulanceType: amb.type,
      });
    }

    setBookingAmb(null);
    setBookedInfo({ ...amb, tripId: bookingId });
    setBooked(true);
  };

  if (booked && bookedInfo) {
    return (
      <CustomerLayout>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ maxWidth: 520, margin: '60px auto', background: 'rgba(0,204,102,0.06)', border: '1px solid rgba(0,204,102,0.25)', borderRadius: 24, padding: '48px 40px', textAlign: 'center' }}
        >
          <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 28, margin: '0 0 12px' }}>Booking Confirmed!</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginBottom: 32 }}>
            {driverAssigned
              ? `🚑 ${driverAssigned.driverName} is on the way — ${driverAssigned.etaMin} min ETA`
              : noDriver ? '⚠️ No drivers online right now. Please try again.'
              : '🔍 Notifying nearest driver...'}
          </p>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px', marginBottom: 28, textAlign: 'left' }}>
            {[
              { label: 'Booking ID',  value: bookedInfo.tripId },
              { label: 'Ambulance',   value: `${bookedInfo.vehicleId || bookedInfo.id} — ${bookedInfo.type}` },
              { label: 'Driver',      value: driverAssigned?.driverName || '🔍 Assigning...' },
              { label: 'ETA',         value: driverAssigned ? `${driverAssigned.etaMin} min` : bookedInfo.eta },
              { label: 'Status',      value: driverAssigned ? '🟢 Driver Assigned & En Route' : noDriver ? '🔴 No Driver Available' : '🟡 Notifying Driver...' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>{row.label}</span>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{row.value}</span>
              </div>
            ))}
          </div>
          <a href="/customer/tracking" style={{ display: 'block', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#ff2222,#cc0000)', color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: 15, boxShadow: '0 8px 24px rgba(255,34,34,0.4)' }}>
            📡 Track Live →
          </a>
        </motion.div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -40, x: '-50%' }}
            style={{
              position: 'fixed', top: 20, left: '50%',
              zIndex: 9999, background: toast.color, color: '#fff',
              padding: '13px 28px', borderRadius: 30,
              fontWeight: 700, fontSize: 14,
              boxShadow: `0 8px 30px ${toast.color}88`,
              maxWidth: 420, textAlign: 'center',
              pointerEvents: 'none',
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bookingAmb && (
          <BookingModal amb={bookingAmb} location={location} onClose={() => setBookingAmb(null)} onConfirm={handleConfirmBooking} />
        )}
      </AnimatePresence>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 28, margin: '0 0 6px' }}>🚑 Book Ambulance</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>Find and book the nearest available ambulance</p>
      </div>

      <div style={{ display: 'flex', gap: 24, flexDirection: 'column', maxWidth: '100%' }}>

        {/* ── Steps 1 & 2 side by side ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* ── Step 1: Location ── */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ff3333', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>1</div>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0 }}>Your Location</h3>
            {locDetected && <span style={{ fontSize: 11, fontWeight: 700, color: '#00cc66', background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.3)', padding: '2px 10px', borderRadius: 20 }}>✅ GPS Detected</span>}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '13px 16px' }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Enter or auto-detect your location"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontFamily: 'inherit' }}
              />
              {location && <span onClick={() => { setLocation(''); setLocDetected(false); setCoords(null); }} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 16 }}>✕</span>}
            </div>
            <button onClick={detectLocation} disabled={locLoading}
              style={{ padding: '13px 20px', borderRadius: 12, border: '1px solid rgba(51,153,255,0.3)', background: locDetected ? 'rgba(0,204,102,0.15)' : 'rgba(51,153,255,0.15)', color: locDetected ? '#00cc66' : '#3399ff', cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.2s' }}
            >{locLoading ? '⏳ Detecting...' : locDetected ? '✅ Detected' : '🎯 Auto Detect'}</button>
          </div>

          {/* Map preview */}
          {locDetected && location && <MapPreview coords={coords} locationName={location.split(',')[0]} />}
        </div>

        {/* ── Step 2: Emergency Type + Message ── */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ff8800', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>2</div>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0 }}>Emergency Type</h3>
          </div>

          {/* Emergency dropdown */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
              Select Emergency Type <span style={{ color: '#ff3333' }}>*</span>
            </label>
            <EmergencyDropdown value={emergency} onChange={setEmergency} />
          </div>

          {/* Additional message box */}
          <div>
            <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
              Additional Details <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe the situation in detail... e.g. Patient is unconscious, bleeding from head, on 3rd floor of building..."
              rows={3}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '13px 16px',
                color: '#fff', fontSize: 14, fontFamily: 'inherit',
                resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                transition: 'border 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 4 }}>
              {message.length} / 300 characters
            </div>
          </div>
        </div>

        </div> {/* grid end */}

        {/* ── Step 3: Search button ── */}
        <button onClick={searchAmbulances} disabled={searching}
          style={{
            padding: '18px', borderRadius: 14, border: 'none',
            background: searching ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#ff2222,#cc0000)',
            color: '#fff', cursor: searching ? 'not-allowed' : 'pointer',
            fontSize: 16, fontWeight: 800, letterSpacing: 0.5,
            boxShadow: searching ? 'none' : '0 8px 30px rgba(255,34,34,0.4)',
            transition: 'all 0.3s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          }}
        >
          {searching ? (
            <>
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', fontSize: 20 }}>🔄</motion.span>
              Searching Nearby Ambulances...
            </>
          ) : '🔍 Find Nearby Ambulances'}
        </button>

        {/* ── Ambulance List / No Results ── */}
        <AnimatePresence>
          {ambulances.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 18, margin: 0 }}>Nearby Ambulances</h3>
                  <span style={{ background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.3)', color: '#00cc66', fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>{ambulances.length} Available</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>📍 Near {location.split(',')[0] || 'Your Location'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ambulances.map((amb, i) => (
                  <motion.div key={amb.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <AmbulanceCard amb={amb} selected={selectedAmb === amb.id} onSelect={setSelectedAmb} onBook={(a) => { setSelectedAmb(a.id); setBookingAmb(a); }} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {searched && ambulances.length === 0 && !searching && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: 'center', padding: '48px 24px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 18,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 14 }}>🚑</div>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 18, margin: '0 0 8px' }}>No Ambulances Available</h3>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: '0 0 20px' }}>
                No ambulances with assigned drivers are available right now. Please try again shortly.
              </p>
              <button
                onClick={searchAmbulances}
                style={{
                  padding: '11px 28px', borderRadius: 10, border: '1px solid rgba(255,51,51,0.3)',
                  background: 'rgba(255,51,51,0.1)', color: '#ff4444',
                  cursor: 'pointer', fontWeight: 700, fontSize: 14,
                }}
              >🔄 Try Again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CustomerLayout>
  );
}
