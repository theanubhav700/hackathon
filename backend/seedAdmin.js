// Run once: node seedAdmin.js
// Creates the admin account in MongoDB

require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected');

  const existing = await User.findOne({ email: 'admin@resq.com' });
  if (existing) {
    console.log('⚠️  Admin already exists — skipping');
    process.exit(0);
  }

  await User.create({
    fullName: 'ResQ Admin',
    mobile:   '+91 00000 00000',
    email:    'admin@resq.com',
    password: '111111',
    role:     'admin',
  });

  console.log('🎉 Admin created successfully!');
  console.log('   Email    : admin@resq.com');
  console.log('   Password : 111111');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
