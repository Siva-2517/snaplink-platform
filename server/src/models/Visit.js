const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  shortUrl: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShortURL',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  ip: {
    type: String,
    default: '127.0.0.1'
  },
  browser: {
    type: String,
    default: 'Unknown'
  },
  os: {
    type: String,
    default: 'Unknown'
  },
  device: {
    type: String,
    default: 'Desktop'
  },
  country: {
    type: String,
    default: 'Localhost'
  }
});

// Compound Index to accelerate time-series list fetches
visitSchema.index({ shortUrl: 1, timestamp: -1 });

const Visit = mongoose.model('Visit', visitSchema);
module.exports = Visit;
