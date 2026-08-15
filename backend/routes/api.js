const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const Ambulance = require('../models/Ambulance');

// Test route
router.get('/test', (req, res) => {
  res.json({
    message: '⚡ API is working!',
    timestamp: new Date().toISOString()
  });
});

// ── Public: Available ambulances for customers ───────────
// GET /api/ambulances/available
// Only ambulances that are Available AND have a driver assigned
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

// Item CRUD routes
router.get('/items', itemController.getAllItems);
router.post('/items', itemController.createItem);
router.get('/items/:id', itemController.getItemById);
router.put('/items/:id', itemController.updateItem);
router.delete('/items/:id', itemController.deleteItem);

module.exports = router;
