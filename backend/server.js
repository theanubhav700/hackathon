const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const http       = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);

// ── Socket.io setup ─────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ── Active trips store (in-memory) ──────────────────────
const activeTrips   = new Map();
// ── Online drivers store ─────────────────────────────────
const onlineDrivers = new Map();
// ── Active bookings store (pending driver acceptance) ────
// bookingId -> { ...bookingData, customerSocketId, assignedDriverId }
const pendingBookings = new Map();

// ── Haversine helper ─────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2 +
               Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
               Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Simulate ambulance moving toward patient ─────────────
function simulateMovement(tripId) {
  const trip = activeTrips.get(tripId);
  if (!trip || trip.status === 'arrived') return;

  const STEP = 0.0008; // ~88m per tick
  const dLat = trip.patientLat - trip.ambulanceLat;
  const dLon = trip.patientLon - trip.ambulanceLon;
  const dist = Math.sqrt(dLat * dLat + dLon * dLon);

  if (dist < 0.0005) {
    // Arrived at patient
    trip.status    = 'arrived';
    trip.eta       = 0;
    trip.distanceKm = 0;
    activeTrips.set(tripId, trip);
    io.to(tripId).emit('trip:update', { ...trip, tripId });
    io.to(tripId).emit('trip:arrived', { tripId, message: '🚑 Ambulance has arrived at your location!' });
    return;
  }

  // Move ambulance one step closer
  const ratio = Math.min(STEP / dist, 1);
  trip.ambulanceLat += dLat * ratio;
  trip.ambulanceLon += dLon * ratio;
  trip.distanceKm    = haversineKm(trip.ambulanceLat, trip.ambulanceLon, trip.patientLat, trip.patientLon);
  trip.eta           = Math.max(0, Math.round(trip.distanceKm / 0.5)); // 30 km/h
  activeTrips.set(tripId, trip);

  // Broadcast to all sockets in this trip room
  io.to(tripId).emit('trip:update', { ...trip, tripId });

  // Schedule next tick (every 2 seconds)
  setTimeout(() => simulateMovement(tripId), 2000);
}

// ── Socket.io connection handler ─────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // ── Driver registers ──────────────────────────────────
  socket.on('driver:register', ({ driverId, driverName, ambulanceId }) => {
    if (driverId) {
      const existing = onlineDrivers.get(driverId) || {};
      onlineDrivers.set(driverId, {
        ...existing,
        socketId:    socket.id,
        driverId,
        // Persist name/ambulanceId from register if not yet set via location_broadcast
        driverName:  driverName  || existing.driverName  || 'Driver',
        ambulanceId: ambulanceId || existing.ambulanceId || '—',
        status:      existing.status || 'Online',
      });
      socket.data.driverId = driverId;
      console.log(`🚑 Driver registered: ${driverId} (${driverName || existing.driverName || '?'})`);
    }
  });

  // ── Customer registers (to receive callbacks) ─────────
  socket.on('customer:register', ({ customerId }) => {
    if (customerId) {
      socket.data.customerId = customerId;
      socket.join(`customer:${customerId}`);
      console.log(`👤 Customer registered: ${customerId}`);
    }
  });

  // ── Driver GPS broadcast ──────────────────────────────
  socket.on('driver:location_broadcast', ({ driverId, driverName, ambulanceId, lat, lon, status }) => {
    onlineDrivers.set(driverId, {
      socketId: socket.id, driverId, driverName, ambulanceId,
      lat, lon, status, updatedAt: Date.now(),
    });
    for (const [tripId, trip] of activeTrips.entries()) {
      if (trip.driverId === driverId) {
        trip.ambulanceLat = lat;
        trip.ambulanceLon = lon;
        trip.distanceKm   = haversineKm(lat, lon, trip.patientLat, trip.patientLon);
        trip.eta          = Math.max(0, Math.round(trip.distanceKm / 0.5));
        activeTrips.set(tripId, trip);
        io.to(tripId).emit('trip:update', { ...trip, tripId });
      }
    }
  });

  // ── Driver status update ──────────────────────────────
  socket.on('driver:status_update', ({ driverId, status }) => {
    const d = onlineDrivers.get(driverId);
    if (d) onlineDrivers.set(driverId, { ...d, status });
  });

  // ── Customer creates booking ──────────────────────────
  socket.on('booking:new', (bookingData) => {
    const { customerLat, customerLon, customerId } = bookingData;

    // Save customer socketId for callback
    const customerSocketId = socket.id;

    // Find nearest ONLINE (not Busy, not Offline) driver with GPS
    let nearestDriver = null;
    let minDist = Infinity;
    for (const [driverId, driver] of onlineDrivers.entries()) {
      if (driver.status !== 'Online' || !driver.lat || !driver.lon) continue;
      const dist = haversineKm(customerLat, customerLon, driver.lat, driver.lon);
      if (dist < minDist) { minDist = dist; nearestDriver = { ...driver, driverId, distanceKm: dist }; }
    }

    if (nearestDriver) {
      const etaMin = Math.max(1, Math.round(nearestDriver.distanceKm / 0.5));
      const fullPayload = {
        ...bookingData,
        customerSocketId,
        driverLat:    nearestDriver.lat,
        driverLon:    nearestDriver.lon,
        distanceKm:   nearestDriver.distanceKm.toFixed(2),
        etaMin,
        assignedDriverId: nearestDriver.driverId,
      };

      // Store pending booking
      pendingBookings.set(bookingData.bookingId, {
        ...fullPayload,
        customerSocketId,
      });

      // Send FULL notification to driver
      io.to(nearestDriver.socketId).emit('booking:request', fullPayload);

      console.log(`📨 Booking ${bookingData.bookingId} → Driver ${nearestDriver.driverId} (${nearestDriver.distanceKm.toFixed(2)} km)`);

      // Tell customer → driver found, waiting for accept
      socket.emit('booking:driver_found', {
        bookingId:   bookingData.bookingId,
        driverName:  nearestDriver.driverName,
        ambulanceId: nearestDriver.ambulanceId,
        distanceKm:  nearestDriver.distanceKm.toFixed(2),
        etaMin,
        message:     `🚑 Driver ${nearestDriver.driverName} has been notified. Waiting for acceptance...`,
      });
    } else {
      socket.emit('booking:no_driver', {
        bookingId: bookingData.bookingId,
        message:   '⚠️ No drivers available right now. Please try again shortly.',
      });
      console.log(`⚠️ No online driver for booking ${bookingData.bookingId}`);
    }
  });

  // ── Driver ACCEPTS booking ────────────────────────────
  socket.on('booking:accept', ({ bookingId, driverId, driverLat, driverLon }) => {
    const driver  = onlineDrivers.get(driverId);
    const booking = pendingBookings.get(bookingId);

    if (!booking) {
      // Booking already handled (e.g. accepted by another driver)
      socket.emit('booking:accept_confirmed', { bookingId, message: 'Booking already assigned.' });
      return;
    }

    console.log(`✅ Driver ${driverId} ACCEPTED booking ${bookingId}`);

    // Update driver status to Busy
    if (driver) onlineDrivers.set(driverId, { ...driver, status: 'Busy' });

    // Remove from pending
    pendingBookings.delete(bookingId);

    // Use live GPS from accept payload, fall back to last known broadcast coords
    const finalLat = driverLat ?? driver?.lat;
    const finalLon = driverLon ?? driver?.lon;
    const distKm   = (finalLat != null && finalLon != null)
      ? haversineKm(finalLat, finalLon, booking.customerLat, booking.customerLon).toFixed(2)
      : booking.distanceKm || '—';
    const etaMin   = booking.etaMin || Math.max(1, Math.round(parseFloat(distKm) / 0.5));

    const acceptPayload = {
      bookingId,
      driverId,
      driverName:   driver?.driverName  || 'Driver',
      ambulanceId:  driver?.ambulanceId || '—',
      driverLat:    finalLat,
      driverLon:    finalLon,
      etaMin,
      distanceKm:   distKm,
      message:      `✅ ${driver?.driverName || 'Driver'} has accepted your request and is on the way!`,
    };

    // Notify customer directly via their socket ID
    if (booking?.customerSocketId) {
      io.to(booking.customerSocketId).emit('booking:accepted', acceptPayload);
    }
    // Also notify via persistent customer room (survives reconnects)
    if (booking?.customerId) {
      io.to(`customer:${booking.customerId}`).emit('booking:accepted', acceptPayload);
    }
    // Confirm back to driver
    socket.emit('booking:accept_confirmed', { bookingId, message: 'You have accepted the booking.' });
  });

  // ── Driver REJECTS booking ────────────────────────────
  socket.on('booking:reject', ({ bookingId, driverId }) => {
    const booking = pendingBookings.get(bookingId);
    const driver  = onlineDrivers.get(driverId);

    console.log(`❌ Driver ${driverId} REJECTED booking ${bookingId}`);
    pendingBookings.delete(bookingId);

    const rejectPayload = {
      bookingId,
      message: `❌ Driver ${driver?.driverName || 'Driver'} declined. Looking for another driver...`,
    };

    // Notify customer
    if (booking?.customerSocketId) {
      io.to(booking.customerSocketId).emit('booking:rejected', rejectPayload);
    }
    if (booking?.customerId) {
      io.to(`customer:${booking.customerId}`).emit('booking:rejected', rejectPayload);
    }

    // Try next nearest driver
    if (booking) {
      const { customerLat, customerLon, customerSocketId } = booking;
      let nextDriver = null;
      let minDist = Infinity;
      for (const [dId, d] of onlineDrivers.entries()) {
        if (dId === driverId || d.status !== 'Online' || !d.lat || !d.lon) continue;
        const dist = haversineKm(customerLat, customerLon, d.lat, d.lon);
        if (dist < minDist) { minDist = dist; nextDriver = { ...d, driverId: dId, distanceKm: dist }; }
      }
      if (nextDriver) {
        const etaMin = Math.max(1, Math.round(nextDriver.distanceKm / 0.5));
        const newPayload = { ...booking, driverLat: nextDriver.lat, driverLon: nextDriver.lon, distanceKm: nextDriver.distanceKm.toFixed(2), etaMin, assignedDriverId: nextDriver.driverId };
        pendingBookings.set(bookingId, { ...newPayload, customerSocketId });
        io.to(nextDriver.socketId).emit('booking:request', newPayload);
        io.to(customerSocketId).emit('booking:driver_found', {
          bookingId, driverName: nextDriver.driverName, ambulanceId: nextDriver.ambulanceId,
          distanceKm: nextDriver.distanceKm.toFixed(2), etaMin,
          message: `🔄 Redirected to ${nextDriver.driverName}. ETA: ${etaMin} min`,
        });
      } else {
        io.to(customerSocketId).emit('booking:no_driver', { bookingId, message: '⚠️ No more drivers available right now.' });
      }
    }
  });

  // ── Customer joins trip room (live tracking) ──────────
  socket.on('trip:join', ({ tripId }) => {
    socket.join(tripId);
    const trip = activeTrips.get(tripId);
    if (trip) socket.emit('trip:update', { ...trip, tripId });
  });

  // ── Start trip ────────────────────────────────────────
  socket.on('trip:start', ({ tripId, patientLat, patientLon, ambulanceLat, ambulanceLon, driverName, ambulanceId, driverId }) => {
    const distanceKm = haversineKm(ambulanceLat, ambulanceLon, patientLat, patientLon);
    const trip = {
      tripId, patientLat, patientLon, ambulanceLat, ambulanceLon,
      driverName: driverName || 'Driver', ambulanceId: ambulanceId || '—',
      driverId, distanceKm,
      eta: Math.max(1, Math.round(distanceKm / 0.5)), status: 'en_route',
    };
    activeTrips.set(tripId, trip);
    socket.join(tripId);
    setTimeout(() => simulateMovement(tripId), 1000);
    io.to(tripId).emit('trip:update', { ...trip, tripId });
  });

  // ── Driver manual GPS update during trip ──────────────
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

  // ── Disconnect ────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`🔌 Disconnected: ${socket.id}`);
    for (const [dId, d] of onlineDrivers.entries()) {
      if (d.socketId === socket.id) {
        onlineDrivers.delete(dId);
        console.log(`🚑 Driver offline: ${dId}`);
        break;
      }
    }
  });
});

// Make io accessible to routes
app.set('io', io);
app.set('activeTrips', activeTrips);
app.set('onlineDrivers', onlineDrivers);
app.set('pendingBookings', pendingBookings);

// ── Express Middleware ───────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────
const apiRoutes   = require('./routes/api');
const authRoutes  = require('./routes/auth');
const adminRoutes = require('./routes/admin');
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: '🔴 ResQ Backend is LIVE',
    status: 'running',
    socket: 'enabled',
    activeTrips: activeTrips.size,
    database: mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected',
  });
});

// ── MongoDB + Server start ───────────────────────────────
const PORT     = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔌 Socket.io ready`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Failed:', err.message);
    process.exit(1);
  });

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  process.exit(1);
});
