const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: false
  },
  otp: {
    type: String,
    required: false
  },
  otpExpiresAt: {
    type: Date,
    required: false
  },
  role: {
    type: String,
    enum: ['admin', 'scanner'],
    default: 'scanner'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Admin', adminSchema);
