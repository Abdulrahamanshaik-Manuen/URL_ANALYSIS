const mongoose = require('mongoose');

const httpErrorSchema = new mongoose.Schema(
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
    url: {
      type: String,
      required: true
    },
    statusCode: {
      type: Number,
      required: true,
      min: 400,
      max: 599,
      index: true
    },
    statusText: {
      type: String,
      default: ''
    },
    method: {
      type: String,
      default: 'GET'
    },
    resourceType: {
      type: String,
      default: 'document'
    },
    requestUrl: {
      type: String,
      default: null
    },
    fromMainFrame: {
      type: Boolean,
      default: false
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

httpErrorSchema.index({ scanId: 1, statusCode: 1 });

const HttpError = mongoose.models.HttpError || mongoose.model('HttpError', httpErrorSchema);

module.exports = HttpError;
