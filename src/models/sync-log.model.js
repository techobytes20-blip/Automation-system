const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
  startedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Running', 'Success', 'Failed'],
    default: 'Running'
  },
  rowsProcessed: {
    type: Number,
    default: 0
  },
  errors: [{
    row: Number,
    message: String,
    data: mongoose.Schema.Types.Mixed
  }]
}, {
  suppressReservedKeysWarning: true
});

// For viewing recent sync runs efficiently
syncLogSchema.index({ startedAt: -1 });

module.exports = mongoose.model('SyncLog', syncLogSchema);
