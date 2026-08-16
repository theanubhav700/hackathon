import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import DriverLayout from '../../layouts/DriverLayout';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Nominatim geocode search
async function geocodeSearch(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  if (!res.ok) throw new Error('Geocode failed');
  return res.json();
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const driver  = JSON.parse(localStorage.getItem('resq_user') || '{}');
  const booking = JSON.parse(localStorage.getItem('resq_active_booking') || 'null');

  // ── Core state ───────────────────────────────────────
  const [status,     setStatus]     = useState('Online');
  const [time,       setTime]       = useState(new Date());
  const [socketConn, setSocketConn] = useState(false);
  const [toast,      setToast]      = useState(null);
  const [locationOn, setLocationOn] = useState(true);

  // ── Map / nav state ──────────────────────────────────
  const [driverPos,   setDriverPos]   = useState(null);
  const [customerPos, setCustomerPos] = useState(null);
  const [mapSrc,      setMapSrc]      = useState('');
  const [distanceKm,  setDistanceKm]  = useState(null);
  const [arrived,     setArrived]     = useState(false);
  const [gpsError,    setGpsError]    = useState('');

  // ── Search state ─────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching,     setSearching]     = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [customDest,    setCustomDest]    = useState(null); // { lat, lon, name }
  const searchDebounce = useRef(null);

  const socketRef = useRef(null);
  const watchRef  = useRef(null);

  // ── Clock ────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const showToast = useCallback((msg, color = '#ff8800') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Socket ───────────────────────────────────────────
  useEffect(() => {
    if (!driver?._id) return;
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'], reconnection: true });
    socketRef.current = socket;
    socket.on('connect', () => {
      setSocketConn(true);
      socket.emit('driver:register', {
        driverId:    driver._id,
        driverName:  driver.fullName || driver.name || 'Driver',
        ambulanceId: driver.assignedAmbulance?.vehicleId || 'AMB-01',
      });
    });
    socket.on('disconnect', () => setSocketConn(false));
    socket.on('booking:request', () => showToast('🚨 New Emergency Request!', '#ff3333'));
    return () => socket.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Customer position from booking ──────────────────
  useEffect(() => {
    if (booking?.customerLat && booking?.customerLon) {
      setCustomerPos([parseFloat(booking.customerLat), parseFloat(booking.customerLon)]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── GPS watch ────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setGpsError('GPS not supported'); return; }
    const stored = JSON.parse(localStorage.getItem('resq_driver_location') || 'null');
    if (stored) setDriverPos([stored.lat, stored.lon]);

    watchRef.current = navigator.geolocation.watchPosition(
      ({ coords: { latitude: lat, longitude: lon } }) => {
        setDriverPos([lat, lon]);
        setGpsError('');
        localStorage.setItem('resq_driver_location', JSON.stringify({ lat, lon }));
        socketRef.current?.emit('driver:location_broadcast', {
          driverId: driver._id, lat, lon, status: 'Online',
        });
        const dest = customDest
          ? { lat: customDest.lat, lon: customDest.lon }
          : booking?.customerLat
            ? { lat: parseFloat(booking.customerLat), lon: parseFloat(booking.customerLon) }
            : null;
        if (dest) {
          const d = haversineKm(lat, lon, dest.lat, dest.lon);
          setDistanceKm(d.toFixed(2));
          if (d < 0.08 && !customDest) setArrived(true);
        }
      },
      () => setGpsError('Using last known location'),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Build map src whenever positions change ──────────
  useEffect(() => {
    const dest = customDest
      ? [customDest.lat, customDest.lon]
      : customerPos;

    if (driverPos && dest) {
      setMapSrc(`https://maps.google.com/maps?saddr=${driverPos[0]},${driverPos[1]}&daddr=${dest[0]},${dest[1]}&output=embed&t=k`);
    } else if (driverPos) {
      setMapSrc(`https://maps.google.com/maps?q=${driverPos[0]},${driverPos[1]}&output=embed&t=k&z=15`);
    } else if (dest) {
      setMapSrc(`https://maps.google.com/maps?q=${dest[0]},${dest[1]}&output=embed&t=k&z=15`);
    }
  }, [driverPos, customerPos, customDest]);

  // ── Search debounce ──────────────────────────────────
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(searchDebounce.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await geocodeSearch(val);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const handleSelectResult = (result) => {
    const dest = { lat: parseFloat(result.lat), lon: parseFloat(result.lon), name: result.display_name };
    setCustomDest(dest);
    setSearchQuery(result.display_name);
    setSearchResults([]);
    setSearchFocused(false);
    if (driverPos) {
      const d = haversineKm(driverPos[0], driverPos[1], dest.lat, dest.lon);
      setDistanceKm(d.toFixed(2));
    }
  };

  const clearCustomDest = () => {
    setCustomDest(null);
    setSearchQuery('');
    setSearchResults([]);
    if (driverPos && booking?.customerLat) {
      const d = haversineKm(driverPos[0], driverPos[1], parseFloat(booking.customerLat), parseFloat(booking.customerLon));
      setDistanceKm(d.toFixed(2));
    } else {
      setDistanceKm(null);
    }
  };

  const handleArrived = () => {
    setArrived(true);
    setTimeout(() => navigate('/driver/patient'), 1200);
  };

  const statusColors = {
    Online:  { bg: 'rgba(0,204,102,0.15)',   border: 'rgba(0,204,102,0.4)',   fg: '#00cc66' },
    Busy:    { bg: 'rgba(255,136,0,0.15)',   border: 'rgba(255,136,0,0.4)',   fg: '#ff8800' },
    Offline: { bg: 'rgba(120,120,120,0.12)', border: 'rgba(120,120,120,0.3)', fg: '#888'    },
  };

  const activeDest = customDest
    ? customDest.name
    : booking
      ? `${booking.customerName} · ${booking.emergencyType}`
      : null;

  return (
    <DriverLayout>
      {/* ── Toast ─────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            style={{
              position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
              zIndex: 9999, background: toast.color, color: '#fff',
              padding: '11px 26px', borderRadius: 30, fontWeight: 700, fontSize: 13,
              boxShadow: '0 8px 28px rgba(0,0,0,0.5)', pointerEvents: 'none',
            }}
          >{toast.msg}</motion.div>
        )}
      </AnimatePresence>

      {/* ── Header row ───────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 18, flexWrap: 'wrap', gap: 12,
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,#ff8800,#cc5500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 0 18px rgba(255,136,0,0.3)',
          }}>🚑</div>
          <div>
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 20, margin: 0, lineHeight: 1.2 }}>
              Driver Dashboard
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
              <span style={{ color: '#ff8800', fontWeight: 700, fontSize: 13 }}>{driver.fullName || 'Driver'}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: socketConn ? '#00cc66' : '#ff3333', display: 'inline-block' }} />
                <span style={{ color: socketConn ? '#00cc66' : '#ff5555', fontSize: 11, fontWeight: 600 }}>
                  {socketConn ? 'Live' : 'Connecting...'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right — location toggle + status pills + full screen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Location ON/OFF toggle */}
          <button
            onClick={() => {
              const next = !locationOn;
              setLocationOn(next);
              if (!next) {
                // Stop GPS watch
                if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
                setGpsError('Location sharing OFF');
              } else {
                // Restart GPS watch
                setGpsError('');
                watchRef.current = navigator.geolocation.watchPosition(
                  ({ coords: { latitude: lat, longitude: lon } }) => {
                    setDriverPos([lat, lon]);
                    setGpsError('');
                    localStorage.setItem('resq_driver_location', JSON.stringify({ lat, lon }));
                    socketRef.current?.emit('driver:location_broadcast', {
                      driverId: driver._id, lat, lon, status: 'Online',
                    });
                  },
                  () => setGpsError('Using last known location'),
                  { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
                );
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
              background: locationOn ? 'rgba(0,204,102,0.12)' : 'rgba(255,85,85,0.1)',
              border: `1px solid ${locationOn ? 'rgba(0,204,102,0.35)' : 'rgba(255,85,85,0.3)'}`,
              fontFamily: 'inherit', transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 14 }}>{locationOn ? '📍' : '📵'}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: locationOn ? '#00cc66' : '#ff5555' }}>
              {locationOn ? 'Location ON' : 'Location OFF'}
            </span>
            {/* Toggle pill */}
            <div style={{
              width: 32, height: 18, borderRadius: 9,
              background: locationOn ? '#00cc66' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${locationOn ? '#00cc66' : 'rgba(255,255,255,0.15)'}`,
              position: 'relative', transition: 'background 0.2s',
              flexShrink: 0,
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 2,
                left: locationOn ? 16 : 2,
                transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </div>
          </button>

          {['Online', 'Busy', 'Offline'].map(s => (
            <button key={s} onClick={() => setStatus(s)} style={{
              padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: status === s ? statusColors[s].bg : 'rgba(255,255,255,0.04)',
              border: `1px solid ${status === s ? statusColors[s].border : 'rgba(255,255,255,0.08)'}`,
              color: status === s ? statusColors[s].fg : 'rgba(255,255,255,0.3)',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}>{s}</button>
          ))}
          <Link to="/driver/navigation" style={{
            padding: '7px 15px', borderRadius: 10, fontSize: 12, fontWeight: 700,
            background: 'rgba(0,204,102,0.08)', border: '1px solid rgba(0,204,102,0.22)',
            color: '#00cc66', textDecoration: 'none',
          }}>Full Screen →</Link>
        </div>
      </div>

      {/* ── Search bar — above map ───────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 12,
        padding: '10px 14px',
        marginBottom: 14,
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            placeholder="Search location manually — type any address or place..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: 13, fontFamily: 'inherit',
              caretColor: '#ff8800',
            }}
          />
          {searching && (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: 14, flexShrink: 0 }}
            >⏳</motion.span>
          )}
          {searchQuery && !searching && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 15, padding: 0, flexShrink: 0, fontFamily: 'inherit' }}
            >✕</button>
          )}
        </div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {searchFocused && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
                background: '#0d0d22',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
              }}
            >
              {searchResults.map((r, i) => (
                <div
                  key={r.place_id || i}
                  onMouseDown={() => handleSelectResult(r)}
                  style={{
                    padding: '11px 16px',
                    borderBottom: i < searchResults.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,136,0,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>📍</span>
                  <div>
                    <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
                      {r.display_name.split(',').slice(0, 2).join(',')}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 2 }}>
                      {r.display_name.split(',').slice(2, 5).join(',')}
                    </div>
                  </div>
                  {r.type && (
                    <span style={{
                      marginLeft: 'auto', flexShrink: 0,
                      background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)',
                      fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 6, textTransform: 'uppercase',
                    }}>{r.type}</span>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Main grid — map left, panel right ────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 290px', gap: 14, alignItems: 'stretch',
        margin: '0 -32px -28px -32px',
        padding: '0 32px 28px 32px',
      }}>

        {/* ══ MAP COLUMN ═══════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: 0 }}>

          {/* Map container — grows to fill */}
          <div style={{
            borderRadius: 16, overflow: 'hidden',
            border: '1px solid rgba(255,136,0,0.18)',
            position: 'relative',
            boxShadow: '0 0 40px rgba(255,136,0,0.07)',
            flex: 1,
          }}>
            {/* Status badge — top left */}
            <div style={{
              position: 'absolute', top: 12, left: 12, zIndex: 10,
              background: 'rgba(5,5,15,0.9)', backdropFilter: 'blur(10px)',
              border: `1px solid ${arrived ? 'rgba(0,204,102,0.45)' : activeDest ? 'rgba(255,136,0,0.45)' : 'rgba(255,255,255,0.12)'}`,
              padding: '5px 13px', borderRadius: 20,
              display: 'flex', alignItems: 'center', gap: 7,
              pointerEvents: 'none',
            }}>
              <motion.span
                animate={activeDest && !arrived ? { opacity: [1, 0.2, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: arrived ? '#00cc66' : activeDest ? '#ff8800' : '#3399ff',
                  display: 'inline-block',
                  boxShadow: `0 0 7px ${arrived ? '#00cc66' : activeDest ? '#ff8800' : '#3399ff'}`,
                }}
              />
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>
                {arrived ? '✅ ARRIVED AT PICKUP'
                  : activeDest ? '🧭 NAVIGATING'
                  : '📡 STANDBY'}
              </span>
            </div>

            {/* Distance badge — top right */}
            {distanceKm && (
              <div style={{
                position: 'absolute', top: 12, right: 12, zIndex: 10,
                background: 'rgba(5,5,15,0.9)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(51,153,255,0.35)',
                borderRadius: 12, padding: '7px 13px', textAlign: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{ color: '#3399ff', fontWeight: 900, fontSize: 18, lineHeight: 1 }}>{distanceKm} km</div>
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, marginTop: 2, letterSpacing: 1 }}>DISTANCE</div>
              </div>
            )}

            {/* GPS badge — bottom left */}
            {driverPos && (
              <div style={{
                position: 'absolute', bottom: 12, left: 12, zIndex: 10,
                background: 'rgba(5,5,15,0.85)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0,204,102,0.25)',
                borderRadius: 14, padding: '4px 11px',
                display: 'flex', alignItems: 'center', gap: 6,
                pointerEvents: 'none',
              }}>
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: '#00cc66', display: 'inline-block' }}
                />
                <span style={{ color: '#00cc66', fontSize: 10, fontWeight: 700 }}>GPS</span>
                <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10 }}>
                  {driverPos[0].toFixed(4)}, {driverPos[1].toFixed(4)}
                </span>
              </div>
            )}

            {/* Custom dest badge — bottom right */}
            {customDest && (
              <div style={{
                position: 'absolute', bottom: 12, right: 12, zIndex: 10,
                background: 'rgba(5,5,15,0.88)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(170,102,255,0.35)',
                borderRadius: 14, padding: '4px 11px',
                display: 'flex', alignItems: 'center', gap: 6,
                maxWidth: 200,
              }}>
                <span style={{ fontSize: 12 }}>📍</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {customDest.name.split(',')[0]}
                </span>
                <button
                  onClick={clearCustomDest}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,100,100,0.7)', cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1, flexShrink: 0 }}
                >✕</button>
              </div>
            )}

            {/* Google Maps iframe */}
            {mapSrc ? (
              <iframe
                key={mapSrc}
                title="Driver Live Map"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ display: 'block', minHeight: 560 }}
                referrerPolicy="no-referrer-when-downgrade"
                src={mapSrc}
                allowFullScreen
              />
            ) : (
              <div style={{
                minHeight: 560,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.015)', gap: 10,
              }}>
                <motion.div
                  animate={{ opacity: [0.04, 0.14, 0.04] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ fontSize: 60 }}
                >🛰️</motion.div>
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600 }}>Acquiring GPS...</div>
                <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>Map will load once location is detected</div>
                {gpsError && <div style={{ color: '#ffaa00', fontSize: 11, marginTop: 4 }}>⚠️ {gpsError}</div>}
              </div>
            )}
          </div>

          {/* search bar moved above map */}
        </div>

        {/* ══ SIDE PANEL ═══════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>

          {/* Distance + GPS row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <InfoTile
              label="Distance"
              value={distanceKm ? `${distanceKm}` : '—'}
              unit="km"
              color="#3399ff"
              icon="📍"
            />
            <InfoTile
              label="GPS"
              value={driverPos ? 'Active' : 'Getting...'}
              color={driverPos ? '#00cc66' : '#888'}
              icon={driverPos ? '🛰️' : '⏳'}
            />
          </div>

          {/* Destination */}
          <div style={{
            background: 'rgba(255,136,0,0.05)', border: '1px solid rgba(255,136,0,0.16)',
            borderRadius: 13, padding: '14px 16px', minHeight: 160,
          }}>
            <div style={{ color: '#ff8800', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 9 }}>
              🎯 Destination
            </div>
            {customDest ? (
              <>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1.4, marginBottom: 6 }}>
                  📍 {customDest.name.split(',').slice(0, 2).join(',')}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 8 }}>
                  {customDest.name.split(',').slice(2, 4).join(',')}
                </div>
                <button
                  onClick={clearCustomDest}
                  style={{
                    fontSize: 11, fontWeight: 700, color: 'rgba(255,100,100,0.7)', background: 'none',
                    border: '1px solid rgba(255,100,100,0.2)', borderRadius: 6, padding: '3px 10px',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >✕ Clear</button>
              </>
            ) : booking ? (
              <>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 5 }}>
                  🆘 {booking.customerName}
                </div>
                <DetailRow label="Type"     value={booking.emergencyType || '—'} color="#ff8800" />
                <DetailRow label="Location" value={booking.customerLocation || '—'} small />
                <DetailRow label="Notes"    value={booking.message || '—'} small />
              </>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.18)', fontSize: 12, textAlign: 'center', padding: '10px 0' }}>
                No active booking<br />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)' }}>Use search to set a custom destination</span>
              </div>
            )}
          </div>

          {/* GPS error */}
          {gpsError && (
            <div style={{
              background: 'rgba(255,204,0,0.06)', border: '1px solid rgba(255,204,0,0.2)',
              borderRadius: 10, padding: '8px 12px',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span style={{ color: '#ffcc00', fontSize: 11, fontWeight: 600 }}>{gpsError}</span>
            </div>
          )}

          {/* Action button */}
          <AnimatePresence mode="wait">
            {booking && !arrived && !customDest ? (
              <motion.button
                key="arrived-btn"
                whileTap={{ scale: 0.97 }}
                onClick={handleArrived}
                style={{
                  width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg,#00cc66,#009944)',
                  color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 14,
                  fontFamily: 'inherit',
                  boxShadow: '0 6px 20px rgba(0,204,102,0.3)',
                }}
              >📍 ARRIVED AT PICKUP</motion.button>
            ) : arrived ? (
              <Link
                key="nav-arrived"
                to="/driver/patient"
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  width: '100%', padding: '13px', borderRadius: 12, boxSizing: 'border-box',
                  background: 'rgba(0,204,102,0.08)', border: '1px solid rgba(0,204,102,0.25)',
                  color: '#00cc66', fontWeight: 800, fontSize: 13, textAlign: 'center', cursor: 'pointer',
                }}>👤 View Patient Info</div>
              </Link>
            ) : customDest ? (
              <a
                key="gmaps-link"
                href={`https://www.google.com/maps/dir/?api=1&origin=${driverPos?.[0]},${driverPos?.[1]}&destination=${customDest.lat},${customDest.lon}&travelmode=driving`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '13px', borderRadius: 12, textDecoration: 'none',
                  background: 'linear-gradient(135deg,#4285F4,#1a73e8)',
                  color: '#fff', fontWeight: 800, fontSize: 13,
                  boxShadow: '0 6px 20px rgba(66,133,244,0.3)',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Open in Google Maps
              </a>
            ) : (
              <Link
                key="nav-link"
                to="/driver/navigation"
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  width: '100%', padding: '13px', borderRadius: 12, boxSizing: 'border-box',
                  background: 'rgba(255,136,0,0.08)', border: '1px solid rgba(255,136,0,0.25)',
                  color: '#ff8800', fontWeight: 800, fontSize: 13, textAlign: 'center', cursor: 'pointer',
                }}>🗺️ Start Navigation</div>
              </Link>
            )}
          </AnimatePresence>

          {/* Quick links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { icon: '👤', label: 'Patient Info',   link: '/driver/patient',    color: '#3399ff' },
              { icon: '🏥', label: 'Hospital Info',  link: '/driver/hospital',   color: '#00cc66' },
              { icon: '🔔', label: 'Pre-Alert',      link: '/driver/prealert',   color: '#ff8800' },
              { icon: '❤️', label: 'Vitals Report',  link: '/driver/telemetry',  color: '#ff4466' },
            ].map(q => (
              <Link key={q.link} to={q.link} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: `${q.color}08`, border: `1px solid ${q.color}20`,
                  borderRadius: 10, padding: '10px 12px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = `${q.color}14`}
                  onMouseLeave={e => e.currentTarget.style.background = `${q.color}08`}
                >
                  <span style={{ fontSize: 16 }}>{q.icon}</span>
                  <span style={{ color: q.color, fontSize: 12, fontWeight: 700 }}>{q.label}</span>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </DriverLayout>
  );
}

// ── Sub-components ──────────────────────────────────────

function InfoTile({ label, value, unit, color, icon }) {
  return (
    <div style={{
      background: `${color}08`, border: `1px solid ${color}22`,
      borderRadius: 12, padding: '12px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ color, fontWeight: 900, fontSize: 18, lineHeight: 1 }}>
        {value}{unit && value !== '—' ? <span style={{ fontSize: 11, marginLeft: 2, opacity: 0.7 }}>{unit}</span> : ''}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
    </div>
  );
}

function DetailRow({ label, value, color, small }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
      <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: small ? 11 : 12, flexShrink: 0 }}>{label}</span>
      <span style={{
        color: color || (value === '—' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.65)'),
        fontSize: small ? 11 : 12, fontWeight: 600,
        textAlign: 'right', maxWidth: '65%',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{value}</span>
    </div>
  );
}
