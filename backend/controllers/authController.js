const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'resq_secret_key', { expiresIn: '7d' });

// ── POST /api/auth/register ─────────────────────────────
exports.register = async (req, res) => {
  try {
    const { fullName, mobile, email, password, age, gender, bloodGroup, ecName, ecNumber } = req.body;

    if (!fullName || !mobile || !email || !password)
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({
      fullName, mobile, email, password,
      age, gender, bloodGroup, ecName, ecNumber,
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        fullName: user.fullName,
        mobile:   user.mobile,
        email:    user.email,
        age:      user.age,
        gender:   user.gender,
        bloodGroup: user.bloodGroup,
        ecName:   user.ecName,
        ecNumber: user.ecNumber,
        role:     user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/auth/login ────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please fill all fields' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        fullName: user.fullName,
        mobile:   user.mobile,
        email:    user.email,
        age:      user.age,
        gender:   user.gender,
        bloodGroup: user.bloodGroup,
        ecName:   user.ecName,
        ecNumber: user.ecNumber,
        role:     user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
