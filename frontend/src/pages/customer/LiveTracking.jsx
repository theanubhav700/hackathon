import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import CustomerLayout from '../../layouts/CustomerLayout';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

// ── Custom map icons ─────────────────────────────────────
const ambulanceIcon = new L.DivIcon({
  html: `<div style="
    background:linear-gradient(135deg,#ff3333,#cc0000);
    border:3px solid #fff;
    border-radius:50%;
    width:38px;height:38px;
    display:flex;align-items:center;justify-content:center;
    font-size:20px;
    box-shadow:0 0 18px rgba(255,51,51,0.9),0 0 6px rgba(0,0,0,0.5);
    animation:pulse 1.2s infinite;
  ">🚑</div>
  <style>
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
  </style>`,
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const patientIcon = new L.DivIcon({
  html: `<div style="
    background:linear-gradient(135deg,#3399ff,#0055cc);
    border:3px solid #fff;
    border-radius:50%;
    width:36px;height:36px;
    display:flex;align-items:center;justify-content:center;
    font-size:18px;
    box-shadow:0 0 14px rgba(51,153,255,0.8);
  ">📍</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

// ── Smooth map pan to ambulance ───────────────────────────
function MapFollower({ center }) {
  const map = useMap();
  const prevCenter = useRef(null);
  useEffect(() => {
    if (!center) return;
    if (
      !prevCenter.current ||
      Math.abs(prevCenter.current[0] - center[0]) > 0.0001 ||
      Math.abs(prevCenter.current[1] - center[1]) > 0.0001
    ) {
      map.panTo(center, { animate: true, duration: 1 });
      prevCenter.current = center;
    }
  }, [center, map]);
  return null;
}

// ── Status steps ─────────────────────────────────────────
const TRIP_STEPS = [
  { key: 'confirmed',  label: 'Booking Confirmed',       icon: '✅' },
  { key: 'dispatched', label: 'Ambulance Dispatched',    icon: '🚑' },
  { key: 'en_route',   label: 'En Route to You',         icon: '📍' },
  { key: 'arrived',    label: 'Arrived at Location',     icon: '🏁' },
];

function StatusStepper({ status }) {
  const stepIndex = status === 'arrived' ? 3 : status === 'en_route' ? 2 : 1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
      {TRIP_STEPS.map((step, i) => {
        const done    = i <= stepIndex;
        const current = i === stepIndex;
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < TRIP_STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <motion.div
                animate={current ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: done
                    ? current
                      ? 'linear-gradient(135deg,#ff3333,#cc0000)'
                      : 'rgba(0,204,102,0.15)'
                    : 'rgba(255,255,255,0.05)',
                  border: done
                    ? current
                      ? '2px solid #ff3333'
                      : '2px solid #00cc66'
                    : '2px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 17,
                  boxShadow: current ? '0 0 14px rgba(255,51,51,0.6)' : 'none',
                }}>
                {done && !current ? '✓' : step.icon}
              </motion.div>
              <span style={{ color: done ? (current ? '#ff3333' : '#00cc66') : 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 700, textAlign: 'center', maxWidth: 70, lineHeight: 1.3 }}>{step.label}</span>
            </div>
            {i < TRIP_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < stepIndex ? '#00cc66' : 'rgba(255,255,255,0.08)', margin: '0 4px', marginBottom: 22, transition: 'background 0.5s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main LiveTracking Page ────────────────────────────────
export default function LiveTracking() {
  const [tripData, setTripData]       = useState(null);
  const [ambPos, setAmbPos]           = useState(null);   // [lat, lon]
  const [patientPos, setPatientPos]   = useState(null);   // [lat, lon]
  const [status, setStatus]           = useState('confirmed');
  const [eta, setEta]                 = useState(null);
  const [distanceKm, setDistanceKm]   = useState(null);
  const [arrived, setArrived]         = useState(false);
  const [toast, setToast]             = useState(null);
  const [tripId, setTripId]           = useState(null);
  const [routePath, setRoutePath]     = useState([]);
  const socketRef                     = useRef(null);
  const pathRef                       = useRef([]);

  // ── Show toast notification ─────────────────────────────
  const showToast = useCallback((msg, color = '#ff3333') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Load trip from localStorage (set after booking) ─────
  useEffect(() => {
    const stored = localStorage.getItem('resq_active_trip');
    if (stored) {
      const trip = JSON.parse(stored);
      setTripId(trip.tripId);
      setPatientPos([trip.patientLat, trip.patientLon]);
      setTripData(trip);
    }
  }, []);

  // ── Socket.io connection ─────────────────────────────────
  useEffect(() => {
    if (!tripId) return;

    const customer = JSON.parse(localStorage.getItem('resq_user') || '{}');
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('trip:join', { tripId });
      socket.emit('customer:register', { customerId: customer._id });
      setStatus('dispatched');
      showToast('🚑 Connected to live tracking!', '#3399ff');
    });

    // ── Driver accepted booking ────────────────────────
    socket.on('booking:accepted', (data) => {
      setStatus('en_route');
      setTripData(prev => ({ ...prev, driverName: data.driverName, ambulanceId: data.ambulanceId }));
      showToast(`✅ ${data.driverName} accepted! En route — ETA ${data.etaMin} min`, '#00cc66');
    });

    // ── Driver rejected booking ────────────────────────
    socket.on('booking:rejected', (data) => {
      showToast(data.message || '🔄 Driver declined. Finding another...', '#ff8800');
    });

    // ── Driver found after re-assign ──────────────────
    socket.on('booking:driver_found', (data) => {
      showToast(`🚑 ${data.driverName} notified — ETA ${data.etaMin} min`, '#3399ff');
    });

    // ── No driver available ───────────────────────────
    socket.on('booking:no_driver', (data) => {
      showToast(data.message || '⚠️ No drivers available', '#ff5555');
    });

    // Live location + ETA update
    socket.on('trip:update', (data) => {
      const newPos = [data.ambulanceLat, data.ambulanceLon];
      setAmbPos(newPos);
      setEta(data.eta);
      setDistanceKm(data.distanceKm?.toFixed(2));
      setStatus(data.status === 'arrived' ? 'arrived' : 'en_route');
      pathRef.current = [...pathRef.current, newPos].slice(-60);
      setRoutePath([...pathRef.current]);
    });

    // Arrived event
    socket.on('trip:arrived', ({ message }) => {
      setStatus('arrived');
      setArrived(true);
      setEta(0);
      setDistanceKm('0.00');
      showToast(message, '#00cc66');
    });

    socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
    socket.on('connect_error', () => showToast('⚠️ Connection lost. Reconnecting...', '#ffaa00'));

    return () => socket.disconnect();
  }, [tripId, showToast]);

  // ── Demo mode: auto-start if no stored trip ──────────────
  useEffect(() => {
    // If no stored trip, start demo with Noida coords
    if (!tripId) {
      const demoTripId = 'DEMO-' + Date.now();
      const patLat = 28.5355, patLon = 77.3910; // Noida
      const ambLat = patLat + 0.03, ambLon = patLon + 0.03;

      const demoTrip = {
        tripId: demoTripId,
        patientLat: patLat, patientLon: patLon,
        ambulanceLat: ambLat, ambulanceLon: ambLon,
        driverName: 'Ramesh Kumar',
        ambulanceId: 'AMB-001',
      };

      setTripId(demoTripId);
      setPatientPos([patLat, patLon]);
      setTripData(demoTrip);

      // Store demo trip
      localStorage.setItem('resq_active_trip', JSON.stringify(demoTrip));
    }
  }, []);

  // ── Start trip on socket after tripId + socket ready ────
  useEffect(() => {
    if (!tripId || !tripData || !socketRef.current) return;
    const socket = socketRef.current;

    const startTrip = () => {
      socket.emit('trip:start', tripData);
      setStatus('en_route');
    };

    if (socket.connected) {
      startTrip();
    } else {
      socket.once('connect', startTrip);
    }
  }, [tripId, tripData]);

  // Default map center
  const mapCenter = ambPos || patientPos || [28.5355, 77.3910];

  return (
    <CustomerLayout>
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            style={{
              position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
              zIndex: 9999, background: toast.color, color: '#fff',
              padding: '12px 28px', borderRadius: 30, fontWeight: 700, fontSize: 14,
              boxShadow: `0 8px 30px ${toast.color}88`,
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>
          📡 Live Tracking
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          Real-time ambulance location — updates every 2 seconds
        </p>
      </div>

      {/* Status stepper */}
      <StatusStepper status={status} />

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* ── Map ─────────────────────────────────────────── */}
        <div style={{
          borderRadius: 18, overflow: 'hidden',
          border: '1px solid rgba(255,51,51,0.25)',
          position: 'relative', minHeight: 500,
          boxShadow: '0 0 40px rgba(255,51,51,0.08)',
        }}>
          {/* LIVE badge */}
          <div style={{
            position: 'absolute', top: 14, left: 14, zIndex: 1000,
            background: arrived ? '#00cc66' : '#ff3333',
            color: '#fff', fontSize: 11, fontWeight: 800,
            padding: '4px 12px', borderRadius: 20,
            boxShadow: `0 4px 14px ${arrived ? 'rgba(0,204,102,0.6)' : 'rgba(255,51,51,0.6)'}`,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <motion.span
              animate={!arrived ? { opacity: [1, 0.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#fff' }}
            />
            {arrived ? 'ARRIVED' : 'LIVE'}
          </div>

          <MapContainer
            center={mapCenter}
            zoom={14}
            style={{ height: '100%', minHeight: 500, width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Ambulance marker */}
            {ambPos && (
              <Marker position={ambPos} icon={ambulanceIcon}>
                <Popup>
                  <div style={{ fontFamily: 'sans-serif' }}>
                    <strong>🚑 Ambulance</strong><br />
                    {tripData?.ambulanceId}<br />
                    Driver: {tripData?.driverName}<br />
                    ETA: <strong>{eta} min</strong>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Patient marker */}
            {patientPos && (
              <Marker position={patientPos} icon={patientIcon}>
                <Popup>
                  <div style={{ fontFamily: 'sans-serif' }}>
                    <strong>📍 Your Location</strong><br />
                    Pickup point
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Route trail */}
            {routePath.length > 1 && (
              <Polyline
                positions={routePath}
                color="#ff3333"
                weight={4}
                opacity={0.7}
                dashArray="8,6"
              />
            )}

            {/* Line from ambulance to patient */}
            {ambPos && patientPos && !arrived && (
              <Polyline
                positions={[ambPos, patientPos]}
                color="rgba(255,255,255,0.2)"
                weight={2}
                dashArray="4,8"
              />
            )}

            {/* Auto-follow ambulance */}
            {ambPos && <MapFollower center={ambPos} />}
          </MapContainer>
        </div>

        {/* ── Side panel ──────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ETA card */}
          <motion.div
            animate={!arrived ? { borderColor: ['rgba(255,51,51,0.2)', 'rgba(255,51,51,0.5)', 'rgba(255,51,51,0.2)'] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              background: arrived ? 'rgba(0,204,102,0.08)' : 'rgba(255,51,51,0.06)',
              border: `1px solid ${arrived ? 'rgba(0,204,102,0.3)' : 'rgba(255,51,51,0.2)'}`,
              borderRadius: 16, padding: '22px',
              textAlign: 'center',
            }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>
              {arrived ? '🏁' : '⏱️'}
            </div>
            <div style={{
              color: arrived ? '#00cc66' : '#ff3333',
              fontWeight: 900,
              fontSize: arrived ? 22 : 48,
              lineHeight: 1,
              marginBottom: 6,
            }}>
              {arrived ? 'Arrived!' : eta !== null ? `${eta}` : '—'}
            </div>
            {!arrived && (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                minutes away
              </div>
            )}
          </motion.div>

          {/* Distance card */}
          <div style={{
            background: 'rgba(51,153,255,0.06)',
            border: '1px solid rgba(51,153,255,0.2)',
            borderRadius: 16, padding: '18px 22px',
          }}>
            <div style={{ color: 'rgba(51,153,255,0.7)', fontSize: 11, fontWeight: 700, letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 10 }}>Distance Remaining</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ color: '#3399ff', fontWeight: 900, fontSize: 30 }}>
                {distanceKm !== null ? distanceKm : '—'}
              </span>
              <span style={{ color: 'rgba(51,153,255,0.5)', fontSize: 14 }}>km</span>
            </div>
          </div>

          {/* Ambulance info */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '18px 22px',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 14 }}>Ambulance Info</div>
            {[
              { label: 'Ambulance ID', value: tripData?.ambulanceId || '—' },
              { label: 'Driver',       value: tripData?.driverName  || '—' },
              { label: 'Status',       value: arrived ? '✅ Arrived' : status === 'en_route' ? '🚑 En Route' : '📡 Dispatched' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{row.label}</span>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Live indicator */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <motion.div
              animate={{ opacity: arrived ? 1 : [1, 0.2, 1] }}
              transition={{ duration: 1, repeat: arrived ? 0 : Infinity }}
              style={{
                width: 10, height: 10, borderRadius: '50%',
                background: arrived ? '#00cc66' : '#ff3333',
                boxShadow: `0 0 8px ${arrived ? '#00cc66' : '#ff3333'}`,
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                {arrived ? 'Trip Complete' : 'Live Tracking Active'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>
                {arrived ? 'Ambulance at pickup point' : 'Location updates every 2s'}
              </div>
            </div>
          </div>

          {/* Arrived — action buttons */}
          {arrived && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.3)',
                borderRadius: 14, padding: '16px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🏁</div>
                <div style={{ color: '#00cc66', fontWeight: 800, fontSize: 15 }}>Ambulance has arrived!</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>Please be ready at your pickup location</div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}
