const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName:   { type: String, required: true, trim: true },
    mobile:     { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, trim: true, lowercase: true },
    password:   { type: String, required: true, minlength: 6 },

    // Medical info
    age:        { type: Number },
    gender:     { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-',''] },

    // Emergency contact
    ecName:   { type: String, trim: true },
    ecNumber: { type: String, trim: true },

    role: { type: String, enum: ['customer', 'driver', 'admin'], default: 'customer' },

    // Driver-specific fields
    licenseNo:  { type: String, trim: true },
    experience: { type: String, trim: true },   // years as string e.g. "3"
    driverStatus: { type: String, enum: ['Available', 'On Duty', 'Offline'], default: 'Available' },
    assignedAmbulance: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance', default: null },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password helper
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
