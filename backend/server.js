require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');
const mongoose = require('mongoose');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// In-memory active stores
const activeTrips     = new Map(); // tripId -> trip object
const onlineDrivers   = new Map(); // driverId -> { socketId, driverId, driverName, ambulanceId, lat, lon, status }
const pendingBookings = new Map(); // bookingId -> full booking object

// ── Green Corridor stores ───────────────────────────────
// corridorId -> { corridorId, bookingId, driverId, routePoints, signals: [{id,lat,lon,state}], active }
const activeCorridors = new Map();

// ── ER Telemetry stores ─────────────────────────────────
// bookingId -> { bookingId, patientName, vitals, ecgBuffer, erRoom, lastUpdated }
const erTelemetry = new Map();

// ── Pre-Alert store ─────────────────────────────────────
// bookingId -> alert object
const preAlerts = new Map();

// Haversine distance formula (km)
function haversineKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 2.0;
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2 +
               Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
               Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Green Corridor helpers ──────────────────────────────
// Generate simulated traffic signals along a route
function generateSignalsAlongRoute(fromLat, fromLon, toLat, toLon, count = 6) {
  const signals = [];
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    // Small perpendicular jitter so signals don't sit exactly on centerline
    const jitterLat = (Math.random() - 0.5) * 0.001;
    const jitterLon = (Math.random() - 0.5) * 0.001;
    signals.push({
      id:    `SIG-${Date.now()}-${i}`,
      lat:   fromLat + (toLat - fromLon) * t + jitterLat,
      lon:   fromLon + (toLon - fromLon) * t + jitterLon,
      state: 'red',        // red | yellow | green
      distFromStart: t,    // 0..1 normalised position along route
    });
  }
  return signals;
}

// Check each signal: if ambulance is within GREEN_RADIUS → turn green
const GREEN_RADIUS_KM = 0.4; // 400 m ahead → green
const YELLOW_RADIUS_KM = 0.8; // 800 m ahead → yellow

function updateCorridorSignals(corridorId, ambLat, ambLon) {
  const corridor = activeCorridors.get(corridorId);
  if (!corridor || !corridor.active) return;

  let changed = false;
  corridor.signals = corridor.signals.map(sig => {
    const dist = haversineKm(ambLat, ambLon, sig.lat, sig.lon);
    let newState = sig.state;

    if (dist <= GREEN_RADIUS_KM) {
      newState = 'green';
    } else if (dist <= YELLOW_RADIUS_KM) {
      newState = 'yellow';
    } else if (dist > 1.5 && sig.state !== 'red') {
      // Reset to red once ambulance is far past
      newState = 'red';
    }

    if (newState !== sig.state) changed = true;
    return { ...sig, state: newState };
  });

  if (changed) {
    activeCorridors.set(corridorId, corridor);
    // Broadcast updated signals to all watchers
    io.to(`corridor:${corridorId}`).emit('corridor:signals_update', {
      corridorId,
      signals: corridor.signals,
      ambLat, ambLon,
    });
    io.to('admin_room').emit('corridor:signals_update', {
      corridorId,
      signals: corridor.signals,
      ambLat, ambLon,
    });
  }
}

// ── ECG simulation helper ────────────────────────────────
function generateECGPoint(situation) {
  // Simulate realistic ECG amplitude based on patient situation
  const base = {
    normal:   { amp: 1.0, noise: 0.05, rate: 1.0 },
    stable:   { amp: 0.9, noise: 0.08, rate: 0.95 },
    serious:  { amp: 1.3, noise: 0.15, rate: 1.2 },
    critical: { amp: 1.6, noise: 0.25, rate: 1.5 },
  };
  const cfg = base[situation] || base.normal;
  const t = Date.now() / 200;
  // Simple PQRST-like waveform using sin harmonics
  const ecg =
    cfg.amp * Math.sin(t * cfg.rate) * 0.3 +
    cfg.amp * Math.sin(t * cfg.rate * 2.5) * 0.6 +
    cfg.amp * Math.sin(t * cfg.rate * 0.4) * 0.15 +
    (Math.random() - 0.5) * cfg.noise;
  return Math.round(ecg * 100) / 100;
}

function simulateMovement(tripId) {
  const trip = activeTrips.get(tripId);
  if (!trip || trip.status === 'arrived') return;

  const STEP = 0.0008; // ~88m per tick
  const dLat = trip.patientLat - trip.ambulanceLat;
  const dLon = trip.patientLon - trip.ambulanceLon;
  const dist = Math.sqrt(dLat * dLat + dLon * dLon);

  if (dist < 0.0005) {
    trip.status     = 'arrived';
    trip.eta        = 0;
    trip.distanceKm = 0;
    activeTrips.set(tripId, trip);
    io.to(tripId).emit('trip:update', { ...trip, tripId });
    io.to(tripId).emit('trip:arrived', { tripId, message: 'Ambulance has arrived at your location!' });
    return;
  }

  const ratio = Math.min(STEP / dist, 1);
  trip.ambulanceLat += dLat * ratio;
  trip.ambulanceLon += dLon * ratio;
  trip.distanceKm    = haversineKm(trip.ambulanceLat, trip.ambulanceLon, trip.patientLat, trip.patientLon);
  trip.eta           = Math.max(0, Math.round(trip.distanceKm / 0.5));
  activeTrips.set(tripId, trip);

  io.to(tripId).emit('trip:update', { ...trip, tripId });
  setTimeout(() => simulateMovement(tripId), 2000);
}

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Driver registers
  socket.on('driver:register', ({ driverId, driverName, ambulanceId }) => {
    if (driverId) {
      const existing = onlineDrivers.get(driverId) || {};
      const updatedInfo = {
        ...existing,
        socketId:    socket.id,
        driverId:    driverId.toString(),
        driverName:  driverName  || existing.driverName  || 'Driver',
        ambulanceId: ambulanceId || existing.ambulanceId || 'AMB-01',
        status:      'Online',
      };
      onlineDrivers.set(driverId.toString(), updatedInfo);
      socket.data.driverId = driverId.toString();

      // Join individual driver room + global drivers room
      socket.join(`driver:${driverId}`);
      socket.join('drivers');
      console.log(`Driver registered: ${driverId} (${updatedInfo.driverName}) joined rooms`);

      // Push all active pending bookings to this driver
      for (const [bId, booking] of pendingBookings.entries()) {
        socket.emit('booking:request', booking);
      }
    }
  });

  // Customer registers
  socket.on('customer:register', ({ customerId }) => {
    if (customerId) {
      socket.data.customerId = customerId;
      socket.join(`customer:${customerId}`);
      console.log(`Customer registered: ${customerId}`);
    }
  });

  // Driver GPS broadcast
  socket.on('driver:location_broadcast', ({ driverId, driverName, ambulanceId, lat, lon, status }) => {
    if (!driverId) return;
    const dIdStr = driverId.toString();
    onlineDrivers.set(dIdStr, {
      socketId: socket.id,
      driverId: dIdStr,
      driverName: driverName || 'Driver',
      ambulanceId: ambulanceId || 'AMB-01',
      lat: Number(lat) || 28.6139,
      lon: Number(lon) || 77.2090,
      status: status || 'Online',
      updatedAt: Date.now(),
    });
    socket.join(`driver:${dIdStr}`);
    socket.join('drivers');

    for (const [tripId, trip] of activeTrips.entries()) {
      if (trip.driverId === dIdStr) {
        trip.ambulanceLat = lat;
        trip.ambulanceLon = lon;
        trip.distanceKm   = haversineKm(lat, lon, trip.patientLat, trip.patientLon);
        trip.eta          = Math.max(0, Math.round(trip.distanceKm / 0.5));
        activeTrips.set(tripId, trip);
        io.to(tripId).emit('trip:update', { ...trip, tripId });
      }
    }
  });

  // Driver status update
  socket.on('driver:status_update', ({ driverId, status }) => {
    if (!driverId) return;
    const d = onlineDrivers.get(driverId.toString());
    if (d) onlineDrivers.set(driverId.toString(), { ...d, status });
  });

  // Customer creates booking
  socket.on('booking:new', (bookingData) => {
    console.log('Incoming booking request:', bookingData);
    const bookingId = bookingData.bookingId || ('BK-' + Date.now());
    const customerSocketId = socket.id;

    // Calculate distance & ETA if coordinates provided
    let distanceKm = '2.0';
    let etaMin = 3;
    if (bookingData.customerLat && bookingData.customerLon && bookingData.driverLat && bookingData.driverLon) {
      const d = haversineKm(bookingData.customerLat, bookingData.customerLon, bookingData.driverLat, bookingData.driverLon);
      distanceKm = d.toFixed(2);
      etaMin = Math.max(1, Math.round(d / 0.5));
    }

    const fullPayload = {
      ...bookingData,
      bookingId,
      customerSocketId,
      customerId: bookingData.customerId || 'customer',
      customerName: bookingData.customerName || 'Customer',
      customerPhone: bookingData.customerPhone || '—',
      customerLocation: bookingData.customerLocation || 'Location detected',
      customerLat: Number(bookingData.customerLat) || 28.5355,
      customerLon: Number(bookingData.customerLon) || 77.3910,
      emergencyType: bookingData.emergencyType || 'Emergency',
      problem: bookingData.problem || bookingData.emergencyType || 'Emergency',
      message: bookingData.message || '',
      ambulanceId: bookingData.ambulanceId || 'AMB-01',
      ambulanceType: bookingData.ambulanceType || 'Advanced Life Support',
      driverId: bookingData.driverId ? bookingData.driverId.toString() : null,
      driverName: bookingData.driverName || 'Driver',
      distanceKm: bookingData.distanceKm || distanceKm,
      etaMin: bookingData.etaMin || etaMin,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    // Store pending booking
    pendingBookings.set(bookingId, fullPayload);

    // 1. Direct notify to selected driver if provided
    if (fullPayload.driverId) {
      io.to(`driver:${fullPayload.driverId}`).emit('booking:request', fullPayload);
      const targetDriver = onlineDrivers.get(fullPayload.driverId);
      if (targetDriver?.socketId) {
        io.to(targetDriver.socketId).emit('booking:request', fullPayload);
      }
    }

    // 2. Broadcast to ALL drivers in drivers room & broadcast to all connected driver sockets
    io.to('drivers').emit('booking:request', fullPayload);
    io.emit('booking:request', fullPayload);

    console.log(`Booking ${bookingId} dispatched to driver(s)`);

    // 3. Confirm to customer
    socket.emit('booking:driver_found', {
      bookingId,
      driverName:  fullPayload.driverName,
      ambulanceId: fullPayload.ambulanceId,
      distanceKm:  fullPayload.distanceKm,
      etaMin:      fullPayload.etaMin,
      message:     `Driver ${fullPayload.driverName} has been notified. Waiting for acceptance...`,
    });
  });

  // Driver ACCEPTS booking
  socket.on('booking:accept', ({ bookingId, driverId, driverLat, driverLon }) => {
    const driver  = onlineDrivers.get(driverId ? driverId.toString() : '') || {};
    const booking = pendingBookings.get(bookingId);

    console.log(`Driver ${driverId} ACCEPTED booking ${bookingId}`);

    const finalLat = driverLat || driver?.lat || (booking ? booking.customerLat + 0.02 : 28.555);
    const finalLon = driverLon || driver?.lon || (booking ? booking.customerLon + 0.02 : 77.411);

    const distKm = booking?.customerLat && booking?.customerLon
      ? haversineKm(finalLat, finalLon, booking.customerLat, booking.customerLon).toFixed(2)
      : booking?.distanceKm || '2.0';
    const etaMin = booking?.etaMin || Math.max(1, Math.round(parseFloat(distKm) / 0.5));

    const acceptPayload = {
      bookingId,
      driverId,
      driverName:   driver?.driverName  || booking?.driverName || 'Driver',
      ambulanceId:  driver?.ambulanceId || booking?.ambulanceId || 'AMB-01',
      driverLat:    finalLat,
      driverLon:    finalLon,
      etaMin,
      distanceKm:   distKm,
      message:      `${driver?.driverName || 'Driver'} has accepted your request and is on the way!`,
    };

    if (booking) {
      booking.status = 'Accepted';
      pendingBookings.set(bookingId, { ...booking, ...acceptPayload, status: 'Accepted' });
    }

    // Notify customer directly via their socket ID
    if (booking?.customerSocketId) {
      io.to(booking.customerSocketId).emit('booking:accepted', acceptPayload);
    }
    // Also notify via persistent customer room
    if (booking?.customerId) {
      io.to(`customer:${booking.customerId}`).emit('booking:accepted', acceptPayload);
    }
    // Confirm back to driver
    socket.emit('booking:accept_confirmed', { bookingId, message: 'You have accepted the booking.' });
    // Broadcast status change
    io.emit('booking:status_change', { bookingId, status: 'Accepted' });
  });

  // Driver REJECTS booking
  socket.on('booking:reject', ({ bookingId, driverId }) => {
    const booking = pendingBookings.get(bookingId);
    const driver  = onlineDrivers.get(driverId ? driverId.toString() : '');

    console.log(`Driver ${driverId} REJECTED booking ${bookingId}`);
    pendingBookings.delete(bookingId);

    const rejectPayload = {
      bookingId,
      message: `Driver ${driver?.driverName || 'Driver'} declined. Looking for another driver...`,
    };

    if (booking?.customerSocketId) {
      io.to(booking.customerSocketId).emit('booking:rejected', rejectPayload);
    }
    if (booking?.customerId) {
      io.to(`customer:${booking.customerId}`).emit('booking:rejected', rejectPayload);
    }
  });

  // Customer joins trip room (live tracking)
  socket.on('trip:join', ({ tripId }) => {
    socket.join(tripId);
    const trip = activeTrips.get(tripId);
    if (trip) socket.emit('trip:update', { ...trip, tripId });
  });

  // Start trip
  socket.on('trip:start', ({ tripId, patientLat, patientLon, ambulanceLat, ambulanceLon, driverName, ambulanceId, driverId }) => {
    const distanceKm = haversineKm(ambulanceLat, ambulanceLon, patientLat, patientLon);
    const trip = {
      tripId, patientLat, patientLon, ambulanceLat, ambulanceLon,
      driverName: driverName || 'Driver', ambulanceId: ambulanceId || 'AMB-01',
      driverId, distanceKm,
      eta: Math.max(1, Math.round(distanceKm / 0.5)), status: 'en_route',
    };
    activeTrips.set(tripId, trip);
    socket.join(tripId);
    setTimeout(() => simulateMovement(tripId), 1000);
    io.to(tripId).emit('trip:update', { ...trip, tripId });
  });

  // Driver manual GPS update during trip
  socket.on('driver:location', ({ tripId, lat, lon }) => {
    const trip = activeTrips.get(tripId);
    if (!trip) return;
    trip.ambulanceLat = lat; trip.ambulanceLon = lon;
    trip.distanceKm   = haversineKm(lat, lon, trip.patientLat, trip.patientLon);
    trip.eta          = Math.max(0, Math.round(trip.distanceKm / 0.5));
    activeTrips.set(tripId, trip);
    io.to(tripId).emit('trip:update', { ...trip, tripId });
  });

  socket.on('trip:status', ({ tripId }, cb) => {
    if (cb) cb(activeTrips.get(tripId) || null);
  });

  // ── GREEN CORRIDOR ──────────────────────────────────────

  // Driver activates green corridor for their route
  socket.on('corridor:activate', ({ bookingId, driverId, fromLat, fromLon, toLat, toLon }) => {
    if (!bookingId || !driverId) return;

    const corridorId = `COR-${bookingId}`;
    const signals    = generateSignalsAlongRoute(
      Number(fromLat), Number(fromLon),
      Number(toLat),   Number(toLon), 7
    );

    const corridor = {
      corridorId,
      bookingId,
      driverId:   driverId.toString(),
      fromLat:    Number(fromLat),
      fromLon:    Number(fromLon),
      toLat:      Number(toLat),
      toLon:      Number(toLon),
      signals,
      active:     true,
      createdAt:  new Date().toISOString(),
    };

    activeCorridors.set(corridorId, corridor);
    socket.join(`corridor:${corridorId}`);

    console.log(`Green Corridor activated: ${corridorId} for driver ${driverId}`);

    // Confirm to driver
    socket.emit('corridor:activated', { corridorId, signals, message: 'Green Corridor is LIVE' });

    // Notify admin
    io.to('admin_room').emit('corridor:new', corridor);
  });

  // Join corridor room (admin / observer)
  socket.on('corridor:join', ({ corridorId }) => {
    socket.join(`corridor:${corridorId}`);
    const corridor = activeCorridors.get(corridorId);
    if (corridor) socket.emit('corridor:state', corridor);
  });

  // Driver sends live location → update corridor signals
  socket.on('corridor:location_update', ({ corridorId, lat, lon }) => {
    updateCorridorSignals(corridorId, Number(lat), Number(lon));
  });

  // Get all active corridors (admin)
  socket.on('corridor:list', (cb) => {
    const list = [...activeCorridors.values()];
    if (cb) cb(list);
    else socket.emit('corridor:list_result', list);
  });

  // Deactivate corridor
  socket.on('corridor:deactivate', ({ corridorId }) => {
    const corridor = activeCorridors.get(corridorId);
    if (corridor) {
      corridor.active = false;
      activeCorridors.set(corridorId, corridor);
      io.to(`corridor:${corridorId}`).emit('corridor:deactivated', { corridorId });
      io.to('admin_room').emit('corridor:deactivated', { corridorId });
    }
  });

  // Hospital ER staff joins the hospital_er room
  socket.on('hospital:er_join', ({ hospitalName } = {}) => {
    socket.join('hospital_er');
    console.log(`Hospital ER joined: ${hospitalName || socket.id}`);
    // Send any pending pre-alerts
    const pending = [...preAlerts.values()];
    if (pending.length > 0) {
      socket.emit('prealert:pending_list', pending);
    }
  });

  // ── ER TELEMETRY ─────────────────────────────────────────

  // Hospital ER joins telemetry room
  socket.on('er:join', ({ bookingId, hospitalName }) => {
    if (!bookingId) return;
    socket.join(`er:${bookingId}`);
    socket.data.erBookingId = bookingId;
    console.log(`ER joined telemetry room for booking ${bookingId}`);

    // Send last known telemetry if available
    const tel = erTelemetry.get(bookingId);
    if (tel) socket.emit('er:telemetry_snapshot', tel);
  });

  // Driver pushes vitals to ER
  socket.on('er:vitals_push', ({ bookingId, vitals, situation, patientName, driverName }) => {
    if (!bookingId) return;

    const record = {
      bookingId,
      patientName:  patientName || '—',
      driverName:   driverName  || '—',
      situation:    situation   || 'stable',
      vitals: {
        heartRate: vitals?.heartRate || '—',
        spo2:      vitals?.spo2      || '—',
        bp:        vitals?.bp        || '—',
        temp:      vitals?.temp      || '—',
      },
      updatedAt: new Date().toISOString(),
    };

    erTelemetry.set(bookingId, record);

    console.log(`ER Telemetry pushed for booking ${bookingId}:`, record.vitals);

    // Push to ER room
    io.to(`er:${bookingId}`).emit('er:vitals_update', record);
    // Also notify admin
    io.to('admin_room').emit('er:vitals_update', record);
  });

  // Driver pushes single ECG data point
  socket.on('er:ecg_push', ({ bookingId, value, situation }) => {
    io.to(`er:${bookingId}`).emit('er:ecg_point', {
      bookingId,
      value: value ?? generateECGPoint(situation || 'stable'),
      t: Date.now(),
    });
  });

  // Get all ER telemetry records (admin)
  socket.on('er:list', (cb) => {
    const list = [...erTelemetry.values()];
    if (cb) cb(list);
    else socket.emit('er:list_result', list);
  });

  // ── PRE-ALERT ─────────────────────────────────────────────

  // Driver sends pre-alert to hospital before arrival
  socket.on('prealert:send', ({
    bookingId, driverId, driverName, ambulanceId,
    hospitalName, hospitalPhone,
    patientName, emergencyType, condition,
    eta, distanceKm, vitals, notes, sentAt,
  }) => {
    if (!bookingId) return;

    const alert = {
      bookingId,
      driverId:     driverId     || '—',
      driverName:   driverName   || '—',
      ambulanceId:  ambulanceId  || '—',
      hospitalName: hospitalName || '—',
      hospitalPhone: hospitalPhone || null,
      patientName:  patientName  || '—',
      emergencyType: emergencyType || '—',
      condition:    condition    || 'stable',
      eta:          eta          || null,
      distanceKm:   distanceKm   || null,
      vitals:       vitals       || {},
      notes:        notes        || '',
      sentAt:       sentAt       || new Date().toISOString(),
    };

    console.log(`Pre-Alert received for booking ${bookingId} → hospital: ${hospitalName}`);

    // Store in memory
    preAlerts.set(bookingId, alert);

    // Notify admin dashboard
    io.to('admin_room').emit('prealert:incoming', alert);

    // Notify hospital ER room (if they are connected)
    io.to('hospital_er').emit('prealert:incoming', alert);

    // Echo confirmation back to driver
    socket.emit('prealert:confirmed', {
      bookingId,
      message: `Pre-alert sent to ${hospitalName}`,
      sentAt:  alert.sentAt,
    });
  });

  // ── ADMIN room join ───────────────────────────────────────
  socket.on('admin:join', () => {
    socket.join('admin_room');
    console.log(`Admin joined admin_room: ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);
app.set('activeTrips', activeTrips);
app.set('onlineDrivers', onlineDrivers);
app.set('pendingBookings', pendingBookings);
app.set('activeCorridors', activeCorridors);
app.set('erTelemetry', erTelemetry);
app.set('preAlerts', preAlerts);

// Express Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const apiRoutes   = require('./routes/api');
const authRoutes  = require('./routes/auth');
const adminRoutes = require('./routes/admin');
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'ResQ Backend is LIVE',
    status: 'running',
    socket: 'enabled',
    activeTrips: activeTrips.size,
    pendingBookings: pendingBookings.size,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
  });
});

const PORT      = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Socket.io ready`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Failed:', err.message);
    process.exit(1);
  });
