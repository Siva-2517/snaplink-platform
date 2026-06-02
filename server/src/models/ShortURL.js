const mongoose = require('mongoose');

const shortUrlSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  longUrl: {
    type: String,
    required: [true, 'Long URL is required'],
    trim: true
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customAlias: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    trim: true
  },
  title: {
    type: String,
    trim: true,
    default: 'Untitled Link'
  },
  clicks: {
    type: Number,
    default: 0,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  expiresAt: {
    type: Date,
    index: true
  },
  lastVisitedAt: {
    type: Date,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

const ShortURL = mongoose.model('ShortURL', shortUrlSchema);
module.exports = ShortURL;
