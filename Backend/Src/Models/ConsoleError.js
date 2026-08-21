const mongoose = require('mongoose');

const consoleErrorSchema = new mongoose.Schema(
  {
    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      required: true,
      index: true
    },
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['error', 'warning', 'info', 'debug'],
      default: 'error',
      index: true
    },
    message: {
      type: String,
      required: true
    },
    location: {
      url: { type: String, default: null },
      lineNumber: { type: Number, default: null },
      columnNumber: { type: Number, default: null }
    },
    source: {
      type: String,
      default: 'browser-console'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

consoleErrorSchema.index({ scanId: 1, type: 1 });

const ConsoleError = mongoose.models.ConsoleError || mongoose.model('ConsoleError', consoleErrorSchema);

module.exports = ConsoleError;
