const express   = require('express');
const router    = express.Router();
const bcrypt    = require('bcryptjs');
const User      = require('../models/User');
const Ambulance = require('../models/Ambulance');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ═══════════════════════════════════════
//  CUSTOMERS
// ═══════════════════════════════════════

// GET /api/admin/customers
router.get('/customers', protect, adminOnly, async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, count: customers.length, customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════
//  AMBULANCES
// ═══════════════════════════════════════

// GET /api/admin/ambulances
router.get('/ambulances', protect, adminOnly, async (req, res) => {
  try {
    const ambulances = await Ambulance.find()
      .populate('driver', 'fullName mobile')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, count: ambulances.length, ambulances });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/ambulances
router.post('/ambulances', protect, adminOnly, async (req, res) => {
  try {
    const { vehicleId, type, plate, year, status } = req.body;
    if (!vehicleId || !type || !plate)
      return res.status(400).json({ success: false, message: 'vehicleId, type and plate are required' });

    const exists = await Ambulance.findOne({ vehicleId });
    if (exists)
      return res.status(400).json({ success: false, message: 'Vehicle ID already exists' });

    const ambulance = await Ambulance.create({ vehicleId, type, plate, year, status });
    res.status(201).json({ success: true, ambulance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/ambulances/:id
router.delete('/ambulances/:id', protect, adminOnly, async (req, res) => {
  try {
    await Ambulance.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Ambulance deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/ambulances/:id/status
router.patch('/ambulances/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const ambulance = await Ambulance.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ success: true, ambulance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/ambulances/:id/assign — assign/unassign driver
router.patch('/ambulances/:id/assign', protect, adminOnly, async (req, res) => {
  try {
    const { driverId } = req.body; // null to unassign

    // ── Fetch BEFORE update so we have the old driver ID ──
    const existing = await Ambulance.findById(req.params.id).lean();
    const oldDriverId = existing?.driver?.toString() || null;

    // Update ambulance
    const ambulance = await Ambulance.findByIdAndUpdate(
      req.params.id,
      { driver: driverId || null },
      { new: true }
    ).populate('driver', 'fullName mobile');

    // Update driver's assignedAmbulance too
    if (driverId) {
      // Unassign this ambulance from any other driver it was previously linked to
      if (oldDriverId && oldDriverId !== driverId) {
        await User.findByIdAndUpdate(oldDriverId, { assignedAmbulance: null });
      }
      // Also unassign any other ambulance already assigned to the new driver
      await Ambulance.updateMany(
        { driver: driverId, _id: { $ne: req.params.id } },
        { driver: null }
      );
      await User.findByIdAndUpdate(driverId, { assignedAmbulance: req.params.id });
    } else {
      // Unassigning — clear old driver's reference using pre-fetched ID
      if (oldDriverId) {
        await User.findByIdAndUpdate(oldDriverId, { assignedAmbulance: null });
      }
    }

    res.json({ success: true, ambulance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════
//  DRIVERS
// ═══════════════════════════════════════

// GET /api/admin/drivers
router.get('/drivers', protect, adminOnly, async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' })
      .select('-password')
      .populate('assignedAmbulance', 'vehicleId plate')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, count: drivers.length, drivers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/drivers  — admin creates driver account
router.post('/drivers', protect, adminOnly, async (req, res) => {
  try {
    const { fullName, mobile, email, password, licenseNo, experience, driverStatus } = req.body;

    if (!fullName || !mobile || !email || !password)
      return res.status(400).json({ success: false, message: 'fullName, mobile, email and password are required' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const driver = await User.create({
      fullName, mobile, email, password,
      role: 'driver',
      licenseNo, experience,
      driverStatus: driverStatus || 'Available',
    });

    const { password: _pw, ...driverData } = driver.toObject();
    res.status(201).json({ success: true, driver: driverData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/drivers/:id
router.delete('/drivers/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Driver deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
