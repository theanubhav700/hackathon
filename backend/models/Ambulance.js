const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema(
  {
    vehicleId: { type: String, required: true, unique: true, trim: true },
    type:      { type: String, required: true, trim: true },
    plate:     { type: String, required: true, trim: true },
    year:      { type: String, trim: true },
    status:    { type: String, enum: ['Available', 'Busy', 'Offline'], default: 'Available' },
    // assigned driver (optional)
    driver:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ambulance', ambulanceSchema);
