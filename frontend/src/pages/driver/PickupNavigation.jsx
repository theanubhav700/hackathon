import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  MapContainer, TileLayer, Marker, Popup,
  Polyline, useMap, ZoomControl
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DriverLayout from '../../layouts/DriverLayout';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const ORS_KEY = import.meta.env.VITE_ORS_KEY;

// ── Custom map icons ──────────────────────────────────────
const ambulanceIcon = new L.DivIcon({
  html: `
    <div style="
      background:linear-gradient(135deg,#ff8800,#cc5500);
      border:3px solid #fff;border-radius:50%;
      width:44px;height:44px;
      display:flex;align-items:center;justify-content:center;
      font-size:22px;
      box-shadow:0 0 22px rgba(255,136,0,1),0 0 6px rgba(0,0,0,0.5);
    ">🚑</div>
    <div style="
      position:absolute;top:-6px;left:50%;transform:translateX(-50%);
      background:#ff8800;color:#fff;font-size:9px;font-weight:900;
      padding:2px 6px;border-radius:8px;white-space:nowrap;
      box-shadow:0 2px 8px rgba(255,136,0,0.6);
    ">YOU</div>`,
  className: '', iconSize: [44, 44], iconAnchor: [22, 22],
});

const patientIcon = new L.DivIcon({
  html: `
    <div style="
      background:linear-gradient(135deg,#ff3333,#cc0000);
      border:3px solid #fff;border-radius:50%;
      width:44px;height:44px;
      display:flex;align-items:center;justify-content:center;
      font-size:22px;
      box-shadow:0 0 22px rgba(255,51,51,1),0 0 6px rgba(0,0,0,0.5);
    ">🆘</div>
    <div style="
      position:absolute;top:-6px;left:50%;transform:translateX(-50%);
      background:#ff3333;color:#fff;font-size:9px;font-weight:900;
      padding:2px 6px;border-radius:8px;white-space:nowrap;
      box-shadow:0 2px 8px rgba(255,51,51,0.6);
    ">PATIENT</div>`,
  className: '', iconSize: [44, 44], iconAnchor: [22, 44],
});

// ── Fit map to both points ─────────────────────────────────
function FitBounds({ driverPos, customerPos }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (driverPos && customerPos && !fitted.current) {
      map.fitBounds([driverPos, customerPos], { padding: [80, 80], animate: true, duration: 1.5 });
      fitted.current = true;
    }
  }, [driverPos, customerPos]);
  return null;
}

// ── Haversine fallback ─────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Format duration ────────────────────────────────────────
function formatDuration(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

// ── Fetch ORS route ────────────────────────────────────────
async function fetchORSRoute(fromLat, fromLon, toLat, toLon) {
  const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
  const body = {
    coordinates: [[fromLon, fromLat], [toLon, toLat]],
    instructions: true,
    language: 'en',
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': ORS_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ORS error: ${res.status}`);
  const data = await res.json();
  const feature = data.features[0];
  const coords  = feature.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
  const summary = feature.properties.summary;
  const steps   = feature.properties.segments[0]?.steps || [];
  return {
    coords,
    distanceKm: (summary.distance / 1000).toFixed(2),
    durationSec: summary.duration,
    steps: steps.map(s => ({
      instruction: s.instruction,
      distanceM:   Math.round(s.distance),
      durationSec: Math.round(s.duration),
    })),
  };
}

export default function PickupNavigation() {
  const navigate = useNavigate();
  const driver   = JSON.parse(localStorage.getItem('resq_user') || '{}');
  const booking  = JSON.parse(localStorage.getItem('resq_active_booking') || 'null');

  const [driverPos, setDriverPos]       = useState(null);
  const [customerPos, setCustomerPos]   = useState(null);
  const [routeCoords, setRouteCoords]   = useState([]);
  const [distanceKm, setDistanceKm]     = useState(null);
  const [durationSec, setDurationSec]   = useState(null);
  const [steps, setSteps]               = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError]     = useState('');
  const [arrived, setArrived]           = useState(false);
  const [gpsError, setGpsError]         = useState('');
  const [showSteps, setShowSteps]       = useState(false);

  const socketRef  = useRef(null);
  const watchRef   = useRef(null);
  const routeFetched = useRef(false);

  // ── Set customer position ──────────────────────────────
  useEffect(() => {
    if (booking?.customerLat && booking?.customerLon) {
      setCustomerPos([parseFloat(booking.customerLat), parseFloat(booking.customerLon)]);
    }
  }, []);

  // ── Socket ─────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('driver:register', { driverId: driver._id }));
    return () => socket.disconnect();
  }, []);

  // ── GPS Watch ─────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setGpsError('GPS not supported'); return; }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setDriverPos([lat, lon]);
        setGpsError('');
        localStorage.setItem('resq_driver_location', JSON.stringify({ lat, lon }));

        // Broadcast location
        socketRef.current?.emit('driver:location_broadcast', {
          driverId:    driver._id,
          driverName:  driver.fullName,
          ambulanceId: driver.assignedAmbulance?.vehicleId || '—',
          lat, lon, status: 'Busy',
        });

        // Live distance update
        if (booking?.customerLat && booking?.customerLon) {
          const d = haversineKm(lat, lon, booking.customerLat, booking.customerLon);
          setDistanceKm(d.toFixed(2));
          if (d < 0.08) setArrived(true);
        }
      },
      (err) => {
        const stored = JSON.parse(localStorage.getItem('resq_driver_location') || 'null');
        if (stored) setDriverPos([stored.lat, stored.lon]);
        else if (booking?.driverLat) setDriverPos([booking.driverLat, booking.driverLon]);
        setGpsError('Using last known location');
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );

    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, []);

  // ── Fetch ORS route when both positions ready ──────────
  useEffect(() => {
    if (!driverPos || !customerPos || routeFetched.current) return;
    routeFetched.current = true;
    setRouteLoading(true);
    setRouteError('');

    fetchORSRoute(driverPos[0], driverPos[1], customerPos[0], customerPos[1])
      .then(({ coords, distanceKm, durationSec, steps }) => {
        setRouteCoords(coords);
        setDistanceKm(distanceKm);
        setDurationSec(durationSec);
        setSteps(steps);
      })
      .catch((err) => {
        console.error('ORS route error:', err);
        setRouteError('Route fetch failed — showing straight line');
        setRouteCoords([driverPos, customerPos]);
        const d = haversineKm(driverPos[0], driverPos[1], customerPos[0], customerPos[1]);
        setDistanceKm(d.toFixed(2));
        setDurationSec(Math.round(d / 0.5) * 60);
      })
      .finally(() => setRouteLoading(false));
  }, [driverPos, customerPos]);

  const handleArrived = () => {
    setArrived(true);
    setTimeout(() => navigate('/driver/patient'), 1200);
  };

  const mapCenter = driverPos || customerPos || [28.5355, 77.3910];

  return (
    <DriverLayout>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 4px' }}>📍 Pickup Navigation</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          {booking
            ? `🆘 ${booking.customerName} · ${booking.emergencyType}`
            : 'Navigating to patient pickup'}
          {routeLoading && <span style={{ color: '#ffaa00', marginLeft: 12 }}>⏳ Calculating route...</span>}
          {routeError && <span style={{ color: '#ff5555', marginLeft: 12 }}>⚠️ {routeError}</span>}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>

        {/* ── MAP ──────────────────────────────────────── */}
        <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,136,0,0.2)', position: 'relative', boxShadow: '0 0 40px rgba(255,136,0,0.08)' }}>
          {/* Status badge */}
          <div style={{
            position: 'absolute', top: 14, left: 14, zIndex: 1000,
            background: arrived ? '#00cc66' : '#ff8800',
            color: '#fff', fontSize: 11, fontWeight: 800,
            padding: '5px 14px', borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: `0 4px 14px ${arrived ? 'rgba(0,204,102,0.5)' : 'rgba(255,136,0,0.5)'}`,
          }}>
            <motion.span
              animate={!arrived ? { opacity: [1, 0.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block' }}
            />
            {arrived ? '✅ ARRIVED' : '🧭 NAVIGATING'}
          </div>

          <MapContainer
            center={mapCenter} zoom={14}
            style={{ height: 520, width: '100%' }}
            zoomControl={false}
            scrollWheelZoom={true}
          >
            <ZoomControl position="bottomright" />

            {/* OpenStreetMap tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Driver marker */}
            {driverPos && (
              <Marker position={driverPos} icon={ambulanceIcon}>
                <Popup>
                  <div style={{ fontFamily: 'sans-serif', fontSize: 13 }}>
                    <strong>🚑 {driver.fullName || 'You'}</strong><br />
                    Your current location<br />
                    <small>{driverPos[0].toFixed(5)}, {driverPos[1].toFixed(5)}</small>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Patient marker */}
            {customerPos && (
              <Marker position={customerPos} icon={patientIcon}>
                <Popup>
                  <div style={{ fontFamily: 'sans-serif', fontSize: 13 }}>
                    <strong>🆘 {booking?.customerName || 'Patient'}</strong><br />
                    {booking?.emergencyType}<br />
                    <small>{customerPos[0].toFixed(5)}, {customerPos[1].toFixed(5)}</small>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* ORS Route polyline */}
            {routeCoords.length > 1 && (
              <>
                {/* Route shadow */}
                <Polyline positions={routeCoords} color="rgba(0,0,0,0.3)" weight={9} opacity={0.5} />
                {/* Main route */}
                <Polyline positions={routeCoords} color="#ff8800" weight={5} opacity={0.95} />
              </>
            )}

            <FitBounds driverPos={driverPos} customerPos={customerPos} />
          </MapContainer>
        </div>

        {/* ── SIDE PANEL ───────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ETA + Distance cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'rgba(255,136,0,0.08)', border: '1px solid rgba(255,136,0,0.25)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,136,0,0.6)', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5 }}>ETA</div>
              <div style={{ color: '#ff8800', fontWeight: 900, fontSize: 26, lineHeight: 1 }}>
                {durationSec !== null ? formatDuration(durationSec) : '—'}
              </div>
            </div>
            <div style={{ background: 'rgba(51,153,255,0.08)', border: '1px solid rgba(51,153,255,0.25)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
              <div style={{ color: 'rgba(51,153,255,0.6)', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5 }}>Distance</div>
              <div style={{ color: '#3399ff', fontWeight: 900, fontSize: 26, lineHeight: 1 }}>
                {distanceKm !== null ? `${distanceKm}` : '—'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>km</div>
            </div>
          </div>

          {/* Patient Emergency Details */}
          <div style={{ background: 'rgba(255,51,51,0.06)', border: '1px solid rgba(255,51,51,0.2)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ color: '#ff5555', fontWeight: 800, fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>🆘 Emergency</div>
            {[
              ['Patient',   booking?.customerName  || '—'],
              ['Type',      booking?.emergencyType || '—'],
              ['Notes',     booking?.message       || '—'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{l}</span>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, textAlign: 'right', maxWidth: '62%' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* GPS status */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div
              animate={driverPos ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: driverPos ? '#00cc66' : '#888', boxShadow: driverPos ? '0 0 8px #00cc66' : 'none', flexShrink: 0 }}
            />
            <div>
              <div style={{ color: driverPos ? '#00cc66' : 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700 }}>
                {driverPos ? 'GPS Active' : 'Getting GPS...'}
              </div>
              {driverPos && (
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 1 }}>
                  {driverPos[0].toFixed(4)}, {driverPos[1].toFixed(4)}
                </div>
              )}
              {gpsError && <div style={{ color: '#ffaa00', fontSize: 10 }}>{gpsError}</div>}
            </div>
          </div>

          {/* Turn-by-turn steps toggle */}
          {steps.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              <button onClick={() => setShowSteps(s => !s)} style={{
                width: '100%', padding: '12px 16px', background: 'none', border: 'none',
                color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontFamily: 'inherit',
              }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>🛣️ Turn-by-Turn ({steps.length} steps)</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, transform: showSteps ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
              </button>
              <AnimatePresence>
                {showSteps && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    style={{ overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
                    {steps.map((step, i) => (
                      <div key={i} style={{
                        padding: '9px 16px', borderTop: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                      }}>
                        <span style={{ color: '#ff8800', fontWeight: 800, fontSize: 11, flexShrink: 0, minWidth: 20 }}>{i + 1}.</span>
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.4 }}>{step.instruction}</div>
                          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 2 }}>
                            {step.distanceM < 1000 ? `${step.distanceM}m` : `${(step.distanceM / 1000).toFixed(1)}km`} · {formatDuration(step.durationSec)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ARRIVED button */}
          <AnimatePresence mode="wait">
            {!arrived ? (
              <motion.button key="btn" whileTap={{ scale: 0.97 }} onClick={handleArrived}
                style={{
                  width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg,#00cc66,#009944)',
                  color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 15,
                  boxShadow: '0 8px 24px rgba(0,204,102,0.4)',
                }}>
                📍 ARRIVED AT PICKUP
              </motion.button>
            ) : (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.3)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                <div style={{ color: '#00cc66', fontWeight: 900, fontSize: 15 }}>Arrived! Opening patient info...</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DriverLayout>
  );
}
