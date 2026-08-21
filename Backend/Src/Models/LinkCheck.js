const mongoose = require('mongoose');

const linkCheckSchema = new mongoose.Schema(
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
    sourcePage: {
      type: String,
      required: true
    },
    targetUrl: {
      type: String,
      required: true
    },
    linkText: {
      type: String,
      default: ''
    },
    linkType: {
      type: String,
      enum: ['internal', 'external', 'anchor', 'special'],
      default: 'internal'
    },
    statusCode: {
      type: Number,
      default: null
    },
    responseTime: {
      type: Number,
      default: null
    },
    status: {
      type: String,
      enum: ['valid', 'broken', 'redirected', 'timeout', 'blocked', 'skipped'],
      default: 'valid',
      index: true
    },
    redirectUrl: {
      type: String,
      default: null
    },
    errorMessage: {
      type: String,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

linkCheckSchema.index({ scanId: 1, status: 1 });
linkCheckSchema.index({ scanId: 1, linkType: 1 });

const LinkCheck = mongoose.models.LinkCheck || mongoose.model('LinkCheck', linkCheckSchema);

module.exports = LinkCheck;
