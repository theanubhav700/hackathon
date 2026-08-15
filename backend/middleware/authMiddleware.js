const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Protect any route — must be logged in
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'Not authorised, no token' });

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'resq_secret_key');

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user)
      return res.status(401).json({ success: false, message: 'User not found' });

    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// Admin-only gate — use after protect
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ success: false, message: 'Admin access required' });
};
