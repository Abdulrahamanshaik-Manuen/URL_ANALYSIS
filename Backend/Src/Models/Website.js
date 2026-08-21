const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    url: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true
    },
    normalizedUrl: {
      type: String,
      required: [true, 'Normalized URL is required'],
      trim: true,
      index: true
    },
    domain: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    hostname: {
      type: String,
      required: true,
      trim: true
    },
    protocol: {
      type: String,
      enum: ['http:', 'https:'],
      default: 'https:'
    },
    title: {
      type: String,
      default: '',
      trim: true
    },
    favicon: {
      type: String,
      default: null
    },
    lastScanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      default: null
    },
    lastScanAt: {
      type: Date,
      default: null
    },
    totalScans: {
      type: Number,
      default: 0,
      min: 0
    },
    currentHealthScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    currentStatus: {
      type: String,
      enum: ['healthy', 'warning', 'critical', 'unreachable'],
      default: 'healthy',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent duplicate website registrations per user
websiteSchema.index({ userId: 1, normalizedUrl: 1 }, { unique: true, sparse: true });
websiteSchema.index({ domain: 1, createdAt: -1 });

const Website = mongoose.models.Website || mongoose.model('Website', websiteSchema);

module.exports = Website;
