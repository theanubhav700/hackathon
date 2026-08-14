const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// Test route
router.get('/test', (req, res) => {
  res.json({
    message: '⚡ API is working!',
    timestamp: new Date().toISOString()
  });
});

// Item CRUD routes
router.get('/items', itemController.getAllItems);
router.post('/items', itemController.createItem);
router.get('/items/:id', itemController.getItemById);
router.put('/items/:id', itemController.updateItem);
router.delete('/items/:id', itemController.deleteItem);

module.exports = router;
