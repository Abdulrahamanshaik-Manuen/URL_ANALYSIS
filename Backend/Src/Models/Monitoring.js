const mongoose = require('mongoose');

const monitoringSchema = new mongoose.Schema(
  {
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true
    },
    frequency: {
      type: String,
      enum: ['hourly', 'daily', 'weekly'],
      default: 'daily'
    },
    lastRunAt: {
      type: Date,
      default: null
    },
    nextRunAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    alerts: {
      notifyOnDown: { type: Boolean, default: true },
      notifyOnErrors: { type: Boolean, default: true },
      notifyOnHealthScoreDrop: { type: Boolean, default: true },
      healthScoreThreshold: { type: Number, default: 70 },
      notifyOnSSL: { type: Boolean, default: true },
      notifyOnBrokenLinks: { type: Boolean, default: false },
      email: { type: String, default: null },
      webhookUrl: { type: String, default: null }
    }
  },
  {
    timestamps: true
  }
);

monitoringSchema.index({ enabled: 1, nextRunAt: 1 });

const Monitoring = mongoose.models.Monitoring || mongoose.model('Monitoring', monitoringSchema);

module.exports = Monitoring;
