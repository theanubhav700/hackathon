const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const Ambulance = require('../models/Ambulance');

// Test route
router.get('/test', (req, res) => {
  res.json({
    message: 'ResQ API is working!',
    timestamp: new Date().toISOString()
  });
});

// Available ambulances for customers
router.get('/ambulances/available', async (req, res) => {
  try {
    const ambulances = await Ambulance.find({ status: 'Available', driver: { $ne: null } })
      .populate('driver', 'fullName mobile driverStatus')
      .lean();
    res.json({ success: true, count: ambulances.length, ambulances });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/driver/requests - Get all pending emergency requests
router.get('/driver/requests', (req, res) => {
  try {
    const pendingBookings = req.app.get('pendingBookings');
    const requests = [];
    if (pendingBookings) {
      for (const [id, booking] of pendingBookings.entries()) {
        requests.push(booking);
      }
    }
    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/bookings/create - Fallback / REST endpoint to create booking
router.post('/bookings/create', (req, res) => {
  try {
    const io = req.app.get('io');
    const pendingBookings = req.app.get('pendingBookings');
    const onlineDrivers = req.app.get('onlineDrivers');

    const bookingData = req.body;
    const bookingId = bookingData.bookingId || ('BK-' + Date.now());

    const payload = {
      bookingId,
      customerId: bookingData.customerId,
      customerName: bookingData.customerName || 'Customer',
      customerPhone: bookingData.customerPhone || '—',
      customerLocation: bookingData.customerLocation || 'Location detected',
      customerLat: Number(bookingData.customerLat) || 28.5355,
      customerLon: Number(bookingData.customerLon) || 77.3910,
      emergencyType: bookingData.emergencyType || 'Emergency',
      problem: bookingData.problem || bookingData.emergencyType || 'Emergency',
      message: bookingData.message || '',
      ambulanceId: bookingData.ambulanceId || 'AMB-01',
      ambulanceType: bookingData.ambulanceType || 'Basic',
      driverId: bookingData.driverId || null,
      driverName: bookingData.driverName || 'Driver',
      distanceKm: bookingData.distanceKm || '2.0',
      etaMin: bookingData.etaMin || 3,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    if (pendingBookings) {
      pendingBookings.set(bookingId, payload);
    }

    if (io) {
      if (payload.driverId) {
        io.to(`driver:${payload.driverId}`).emit('booking:request', payload);
      }
      io.to('drivers').emit('booking:request', payload);
      io.emit('booking:request', payload);
    }

    res.json({ success: true, booking: payload });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Item CRUD routes
router.get('/items', itemController.getAllItems);
router.post('/items', itemController.createItem);
router.get('/items/:id', itemController.getItemById);
router.put('/items/:id', itemController.updateItem);
router.delete('/items/:id', itemController.deleteItem);

module.exports = router;
