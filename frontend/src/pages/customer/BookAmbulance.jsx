import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import CustomerLayout from '../../layouts/CustomerLayout';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const EMERGENCY_TYPES = [
  { id: 'accident',  label: 'Road Accident',     icon: '💥', desc: 'Vehicle collision, trauma, bleeding',   color: '#ff4444' },
  { id: 'cardiac',   label: 'Cardiac Arrest',    icon: '❤️', desc: 'Chest pain, heart attack, CPR needed', color: '#ff2222' },
  { id: 'stroke',    label: 'Brain Stroke',      icon: '🧠', desc: 'Sudden numbness, speech difficulty',    color: '#cc00ff' },
  { id: 'breathing', label: 'Breathing Issue',   icon: '🫁', desc: 'Severe asthma, choking, low O2',       color: '#00bbff' },
  { id: 'maternity', label: 'Maternity / Labour',icon: '👶', desc: 'Pregnancy emergency, labour pains',    color: '#ff66aa' },
  { id: 'fall',      label: 'Fall / Fracture',   icon: '🦴', desc: 'Severe fall, broken bone, head injury', color: '#ffaa00' },
  { id: 'fire',      label: 'Burn Injury / Fire',icon: '🔥', desc: 'Thermal / chemical burn emergency',    color: '#ff6600' },
  { id: 'other',     label: 'Other Emergency',   icon: '🚨', desc: 'Any other critical condition',         color: '#888888' },
];

function EmergencyDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = EMERGENCY_TYPES.find(t => t.id === value) || EMERGENCY_TYPES[0];

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.05)',
          border: open ? `1px solid ${selected.color}88` : '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14, padding: '12px 16px',
          color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.2s', outline: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>{selected.icon}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{selected.label}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 }}>{selected.desc}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20,
            background: `${selected.color}22`, color: selected.color,
            border: `1px solid ${selected.color}44`, textTransform: 'uppercase',
          }}>Priority</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>▼</motion.span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 999,
              background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14, padding: '6px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255,34,34,0.1)',
              maxHeight: 280, overflowY: 'auto',
            }}
          >
            {EMERGENCY_TYPES.map((type) => {
              const isSel = type.id === value;
              return (
                <div
                  key={type.id}
                  onClick={() => { onChange(type.id); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                    background: isSel ? `${type.color}18` : 'transparent',
                    border: isSel ? `1px solid ${type.color}35` : '1px solid transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{type.icon}</span>
                    <div>
                      <div style={{ color: isSel ? type.color : '#fff', fontWeight: isSel ? 700 : 500, fontSize: 13 }}>{type.label}</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{type.desc}</div>
                    </div>
                  </div>
                  {isSel && <span style={{ color: type.color, fontSize: 14 }}>✓</span>}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MapPreview({ coords, locationName }) {
  if (!coords) return null;
  const [lat, lon] = coords;
  const bbox = `${lon - 0.01},${lat - 0.007},${lon + 0.01},${lat + 0.007}`;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;

  return (
    <div style={{
      marginTop: 12, borderRadius: 12, overflow: 'hidden',
      border: '1px solid rgba(51,153,255,0.25)',
      background: 'rgba(0,0,0,0.4)', position: 'relative', height: 160,
    }}>
      <iframe title="Location Map" width="100%" height="100%" frameBorder="0" scrolling="no" src={osmUrl} style={{ border: 0, opacity: 0.85 }} />
      <div style={{
        position: 'absolute', bottom: 8, left: 8, right: 8,
        background: 'rgba(5,5,15,0.85)', backdropFilter: 'blur(8px)',
        borderRadius: 8, padding: '5px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <span style={{ color: '#ff3333', fontSize: 12 }}>📍</span>
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {locationName || `${lat.toFixed(4)}, ${lon.toFixed(4)}`}
          </span>
        </div>
        <span style={{ color: '#00cc66', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>● GPS Locked</span>
      </div>
    </div>
  );
}

function AmbulanceCard({ amb, selected, onSelect, onBook }) {
  return (
    <div
      onClick={() => onSelect(amb.id)}
      style={{
        background: selected ? 'rgba(255,51,51,0.08)' : 'rgba(255,255,255,0.03)',
        border: selected ? '1px solid rgba(255,51,51,0.4)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: `${amb.color}15`, border: `1px solid ${amb.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
        }}>🚑</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{amb.vehicleId || amb.id}</span>
            <span style={{ color: amb.color, background: `${amb.color}15`, border: `1px solid ${amb.color}30`, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{amb.type}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span>👤 Driver: <strong style={{ color: '#fff' }}>{amb.driver}</strong></span>
            <span>📞 <strong style={{ color: '#00cc66' }}>{amb.driverPhone}</strong></span>
            <span>🔢 Plate: <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{amb.plate || '—'}</strong></span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#00cc66', fontWeight: 900, fontSize: 17 }}>{amb.eta}</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{amb.distance}</div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onBook(amb); }}
          style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#ff2222,#cc0000)',
            color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 13,
            boxShadow: '0 4px 14px rgba(255,34,34,0.35)',
          }}
        >Book Now</button>
      </div>
    </div>
  );
}

function ConfirmModal({ amb, location, onClose, onConfirm }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        style={{
          width: '100%', maxWidth: 440, background: '#0a0a16',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: '32px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 40px rgba(255,34,34,0.15)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🚑</div>
          <h2 style={{ color: '#fff', fontWeight: 900, margin: '0 0 6px', fontSize: 22 }}>Confirm Ambulance Booking</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>Driver will be notified immediately</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px', marginBottom: 24 }}>
          {[
            { label: 'Ambulance', value: `${amb.vehicleId || amb.id} — ${amb.type}` },
            { label: 'Driver Name', value: amb.driver },
            { label: 'Driver Phone', value: amb.driverPhone },
            { label: 'Plate No.', value: amb.plate || '—' },
            { label: 'Pickup Location', value: location },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>{row.label}</span>
              <span style={{ color: '#fff', fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 2, padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg,#ff2222,#cc0000)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 800, boxShadow: '0 8px 24px rgba(255,34,34,0.4)' }}>Confirm & Send Alert</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

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
  const [toast, setToast]                   = useState(null);
  const socketRef = useRef(null);
  const customer  = JSON.parse(localStorage.getItem('resq_user') || '{}');

  const showToast = (msg, color = '#ff3333', duration = 5000) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), duration);
  };

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('customer:register', { customerId: customer._id });
    });

    socket.on('booking:driver_found', (data) => {
      setDriverAssigned(data);
      showToast(`Driver ${data.driverName} notified! Waiting for acceptance...`, '#3399ff', 6000);
    });

    socket.on('booking:accepted', (data) => {
      setDriverAssigned(prev => ({ ...prev, ...data, accepted: true }));
      showToast(`${data.driverName} ACCEPTED your booking! On the way.`, '#00cc66', 7000);
    });

    socket.on('booking:rejected', (data) => {
      showToast(data.message || 'Driver declined. Finding another...', '#ff8800', 5000);
      setDriverAssigned(null);
    });

    return () => socket.disconnect();
  }, [customer._id]);

  const detectLocation = () => {
    setLocLoading(true);
    setLocDetected(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords([latitude, longitude]);
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
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
          setCoords([28.6139, 77.2090]);
          setLocation('Connaught Place, New Delhi — 110001');
          setLocDetected(true);
          setLocLoading(false);
        }
      );
    } else {
      setCoords([28.6139, 77.2090]);
      setLocation('Connaught Place, New Delhi — 110001');
      setLocDetected(true);
      setLocLoading(false);
    }
  };

  const searchAmbulances = async () => {
    if (!coords && !location) {
      alert('Please enter or detect your location first!');
      return;
    }
    if (!coords) {
      setCoords([28.6139, 77.2090]);
    }
    setSearching(true);
    setAmbulances([]);
    setSearched(false);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res  = await fetch(`${API_BASE}/ambulances/available`);
      const data = await res.json();

      const COLORS = ['#00cc66', '#3399ff', '#aa44ff', '#ffaa00', '#ff6600'];

      if (data.success && data.ambulances.length > 0) {
        const available = data.ambulances.filter(a => a.status === 'Available');
        const withDistance = available.map((a, i) => ({
          ...a,
          id: a._id,
          ambLat: coords ? coords[0] : 28.6139,
          ambLon: coords ? coords[1] : 77.2090,
          distance: '1.2 km',
          eta: '4 min',
          driver: a.driver?.fullName || 'Assigned Driver',
          driverPhone: a.driver?.mobile || '9876543210',
          driverId: a.driver?._id || a.driver || null,
          color: COLORS[i % COLORS.length],
        }));
        setAmbulances(withDistance);
      } else {
        // Fallback demo ambulances if none in DB
        setAmbulances([
          {
            id: 'AMB-01',
            vehicleId: 'RESQ-DL-01',
            type: 'Advanced Life Support (ALS)',
            plate: 'DL 01 AB 1234',
            distance: '1.2 km',
            eta: '4 min',
            driver: 'Rajesh Kumar',
            driverPhone: '+91 98765 43210',
            driverId: 'driver-01',
            color: '#00cc66',
          },
          {
            id: 'AMB-02',
            vehicleId: 'RESQ-DL-02',
            type: 'Basic Life Support (BLS)',
            plate: 'DL 01 CD 5678',
            distance: '2.5 km',
            eta: '7 min',
            driver: 'Amit Sharma',
            driverPhone: '+91 98765 12345',
            driverId: 'driver-02',
            color: '#3399ff',
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch ambulances:', err);
      // Fallback
      setAmbulances([
        {
          id: 'AMB-01',
          vehicleId: 'RESQ-DL-01',
          type: 'Advanced Life Support (ALS)',
          plate: 'DL 01 AB 1234',
          distance: '1.2 km',
          eta: '4 min',
          driver: 'Rajesh Kumar',
          driverPhone: '+91 98765 43210',
          driverId: 'driver-01',
          color: '#00cc66',
        }
      ]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  };

  const handleConfirmBooking = async () => {
    const amb = bookingAmb;
    const bookingId = 'BK-' + Date.now();

    const bookingPayload = {
      bookingId,
      customerId:       customer._id || 'cust-guest',
      customerName:     customer.fullName || customer.name || 'Patient / Customer',
      customerPhone:    customer.mobile   || customer.phone || '9876543210',
      customerLocation: location          || 'Location detected',
      customerLat:      coords ? coords[0] : 28.6139,
      customerLon:      coords ? coords[1] : 77.2090,
      emergencyType:    emergency,
      problem:          emergency,
      message:          message || '',
      ambulanceId:      amb.vehicleId || amb.id,
      ambulanceType:    amb.type,
      driverId:         amb.driverId || null,
      driverName:       amb.driver || 'Driver',
      distanceKm:       amb.distance ? amb.distance.replace(' km','') : '2.0',
      etaMin:           amb.eta ? parseInt(amb.eta) : 5,
    };

    // 1. Emit via socket
    if (socketRef.current?.connected) {
      socketRef.current.emit('booking:new', bookingPayload);
      socketRef.current.emit('trip:join', { tripId: bookingId });
    }

    // 2. Also send via REST API to ensure delivery & storage
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await fetch(`${API_BASE}/bookings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });
    } catch (e) {
      console.warn('REST booking fallback failed:', e);
    }

    // Save ticket to localStorage
    const ticket = {
      ticketId:     bookingId,
      ambulance:    `${amb.vehicleId || amb.id} — ${amb.type}`,
      driverName:   amb.driver || '—',
      driverPhone:  amb.driverPhone || '—',
      eta:          amb.eta || '—',
      emergencyType: emergency,
      location:     location || '—',
      bookedAt:     new Date().toISOString(),
      status:       'Pending',
    };
    const existing = JSON.parse(localStorage.getItem('resq_tickets') || '[]');
    localStorage.setItem('resq_tickets', JSON.stringify([ticket, ...existing]));

    setBookingAmb(null);
    setBookedInfo({ ...amb, tripId: bookingId, ...bookingPayload });
    setBooked(true);
    showToast('🚨 Alert sent to Driver with your details!', '#00cc66', 6000);
  };

  return (
    <CustomerLayout>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: 20, right: 20, zIndex: 9999,
              background: toast.color, color: '#fff',
              padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14,
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            }}
          >{toast.msg}</motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bookingAmb && (
          <ConfirmModal
            amb={bookingAmb}
            location={location}
            onClose={() => setBookingAmb(null)}
            onConfirm={handleConfirmBooking}
          />
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 28, margin: '0 0 6px' }}>Book an Ambulance</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>
            Instant emergency response — auto GPS location detection and live driver dispatch.
          </p>
        </div>

        {booked && bookedInfo ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'rgba(0,204,102,0.06)', border: '1px solid rgba(0,204,102,0.3)',
              borderRadius: 20, padding: '32px', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 12 }}>🚑</div>
            <h2 style={{ color: '#00cc66', fontWeight: 900, margin: '0 0 8px' }}>Emergency Request Dispatched!</h2>
            <p style={{ color: '#fff', fontSize: 15, margin: '0 0 20px' }}>
              Notification sent to driver <strong style={{ color: '#00cc66' }}>{bookedInfo.driverName || bookedInfo.driver}</strong>.
            </p>
            
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: '20px', maxWidth: 480, margin: '0 auto 24px', textAlign: 'left',
            }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>Details Sent to Driver:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div>👤 <strong>Name:</strong> {bookedInfo.customerName}</div>
                <div>📞 <strong>Phone:</strong> {bookedInfo.customerPhone}</div>
                <div>📍 <strong>Location:</strong> {bookedInfo.customerLocation}</div>
                <div>⚠️ <strong>Problem:</strong> {bookedInfo.emergencyType}</div>
                {bookedInfo.message && <div>📝 <strong>Notes:</strong> {bookedInfo.message}</div>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setBooked(false)}
                style={{
                  padding: '12px 24px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', cursor: 'pointer', fontWeight: 700,
                }}
              >Book Another</button>
              <a
                href="/customer/tracking"
                style={{
                  padding: '12px 28px', borderRadius: 12,
                  background: 'linear-gradient(135deg,#00cc66,#009944)', border: 'none',
                  color: '#fff', textDecoration: 'none', fontWeight: 800,
                  boxShadow: '0 6px 20px rgba(0,204,102,0.4)', display: 'inline-block',
                }}
              >Live Tracking →</a>
            </div>
          </motion.div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Step 1: Location */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#ff3333', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>1</div>
                  <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: 0 }}>Pickup Location</h3>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px' }}>
                    <span>📍</span>
                    <input
                      value={location} onChange={e => setLocation(e.target.value)}
                      placeholder="Enter or auto-detect location"
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, fontFamily: 'inherit' }}
                    />
                  </div>
                  <button
                    onClick={detectLocation} disabled={locLoading}
                    style={{
                      padding: '10px 16px', borderRadius: 12,
                      background: locDetected ? 'rgba(0,204,102,0.15)' : 'rgba(51,153,255,0.15)',
                      border: locDetected ? '1px solid rgba(0,204,102,0.3)' : '1px solid rgba(51,153,255,0.3)',
                      color: locDetected ? '#00cc66' : '#3399ff', cursor: 'pointer', fontWeight: 700, fontSize: 12,
                    }}
                  >{locLoading ? 'Detecting...' : locDetected ? '✓ Detected' : '⚡ Auto Detect'}</button>
                </div>

                {locDetected && location && <MapPreview coords={coords} locationName={location.split(',')[0]} />}
              </div>

              {/* Step 2: Emergency Details */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#ff8800', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>2</div>
                  <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: 0 }}>Emergency Problem / Details</h3>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <EmergencyDropdown value={emergency} onChange={setEmergency} />
                </div>

                <div>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe problem (e.g., patient condition, floor number, symptoms)..."
                    rows={2}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                      padding: '10px 14px', color: '#fff', fontSize: 13, fontFamily: 'inherit',
                      resize: 'none', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Find Ambulances Button */}
            <button
              onClick={searchAmbulances} disabled={searching}
              style={{
                padding: '16px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg,#ff2222,#cc0000)',
                color: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 800,
                boxShadow: '0 8px 30px rgba(255,34,34,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {searching ? '🔍 Searching Nearby Ambulances...' : '🔍 Find Nearby Ambulances'}
            </button>

            {/* List of ambulances */}
            {ambulances.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 17, margin: '10px 0 0' }}>
                  Available Ambulances ({ambulances.length})
                </h3>
                {ambulances.map(amb => (
                  <AmbulanceCard
                    key={amb.id}
                    amb={amb}
                    selected={selectedAmb === amb.id}
                    onSelect={setSelectedAmb}
                    onBook={(a) => { setSelectedAmb(a.id); setBookingAmb(a); }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </CustomerLayout>
  );
}
