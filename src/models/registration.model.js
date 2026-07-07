const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  topic: {
    type: String,
    trim: true,
    default: ''
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  qrCodeUrl: {
    type: String
  },
  day1: {
    scannedAt: { type: Date },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
  },
  day2: {
    scannedAt: { type: Date },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
  },
  certificateCollected: {
    scannedAt: { type: Date },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
  },
  certificateEligible: {
    type: Boolean,
    default: false,
    index: true
  },
  thankYouMailSent: {
    type: Boolean,
    default: false
  },
  confirmationMailSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Prevent duplicate registrations for the same event + topic combination
registrationSchema.index({ studentId: 1, eventId: 1, topic: 1 }, { unique: true });

// Optimize reporting and scanner lookup
registrationSchema.index({ 'day1.scannedAt': 1 });
registrationSchema.index({ 'day2.scannedAt': 1 });

module.exports = mongoose.model('Registration', registrationSchema);
