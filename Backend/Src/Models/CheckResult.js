const mongoose = require('mongoose');

const checkResultSchema = new mongoose.Schema(
  {
    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      required: [true, 'Scan reference is required'],
      index: true
    },
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: [true, 'Website reference is required'],
      index: true
    },
    checkName: {
      type: String,
      required: true,
      trim: true
    },
    domain: {
      type: String,
      required: true,
      enum: [
        'http',
        'browser',
        'console',
        'network',
        'http-errors',
        'links',
        'assets',
        'performance',
        'responsive',
        'seo',
        'content',
        'accessibility',
        'security',
        'cookies',
        'robots',
        'technology',
        'api'
      ],
      index: true
    },
    status: {
      type: String,
      enum: ['passed', 'warning', 'failed', 'skipped', 'error'],
      required: true,
      index: true
    },
    severity: {
      type: String,
      enum: ['info', 'low', 'medium', 'high', 'critical'],
      default: 'info',
      index: true
    },
    score: {
      type: Number,
      default: 0
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    recommendation: {
      type: String,
      default: null,
      trim: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    expected: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    actual: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    durationMs: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Compound indexes for fast filtered queries
checkResultSchema.index({ scanId: 1, domain: 1 });
checkResultSchema.index({ scanId: 1, status: 1 });
checkResultSchema.index({ scanId: 1, severity: 1 });

const CheckResult = mongoose.models.CheckResult || mongoose.model('CheckResult', checkResultSchema);

module.exports = CheckResult;
