const mongoose = require('mongoose');

const performanceResultSchema = new mongoose.Schema(
  {
    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      required: true,
      unique: true,
      index: true
    },
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
      index: true
    },

    // Navigation Timings
    navigationStart: { type: Number, default: null },
    responseStart: { type: Number, default: null },
    domContentLoaded: { type: Number, default: null },
    loadEvent: { type: Number, default: null },
    firstPaint: { type: Number, default: null },
    firstContentfulPaint: { type: Number, default: null },

    // Waterfall Stage Timings (ms)
    dnsTime: { type: Number, default: null },
    connectionTime: { type: Number, default: null },
    tlsTime: { type: Number, default: null },
    requestTime: { type: Number, default: null },
    responseTime: { type: Number, default: null },
    domProcessingTime: { type: Number, default: null },
    pageLoadTime: { type: Number, default: null },

    // Resource Transfer & Weight
    totalRequests: { type: Number, default: 0 },
    totalResources: { type: Number, default: 0 },
    totalTransferredBytes: { type: Number, default: 0 },
    javascriptBytes: { type: Number, default: 0 },
    cssBytes: { type: Number, default: 0 },
    imageBytes: { type: Number, default: 0 },
    fontBytes: { type: Number, default: 0 },
    htmlBytes: { type: Number, default: 0 },

    // Large Resources Identification
    largeResources: [
      {
        url: { type: String },
        size: { type: Number },
        type: { type: String }
      }
    ],

    // Core Web Vitals
    coreWebVitals: {
      fcp: { type: Number, default: null },
      lcp: { type: Number, default: null },
      cls: { type: Number, default: null },
      inp: { type: Number, default: null },
      ttfb: { type: Number, default: null }
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true
  }
);

const PerformanceResult = mongoose.models.PerformanceResult || mongoose.model('PerformanceResult', performanceResultSchema);

module.exports = PerformanceResult;
