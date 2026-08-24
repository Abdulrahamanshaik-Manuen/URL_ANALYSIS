import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema(
  {
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: [true, 'Website reference is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    normalizedUrl: {
      type: String,
      required: true,
      trim: true
    },
    scanType: {
      type: String,
      enum: ['full', 'quick', 'api', 'security', 'seo', 'performance'],
      default: 'full',
      index: true
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed', 'timeout'],
      default: 'queued',
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    },
    durationMs: {
      type: Number,
      default: null
    },

    // Overall scoring & verdict
    healthScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
      index: true
    },
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F', null],
      default: null
    },
    overallStatus: {
      type: String,
      enum: ['healthy', 'warning', 'critical', 'unreachable', 'pending'],
      default: 'pending'
    },

    // High-level counters
    totalChecks: { type: Number, default: 0 },
    passedChecks: { type: Number, default: 0 },
    warningChecks: { type: Number, default: 0 },
    failedChecks: { type: Number, default: 0 },
    skippedChecks: { type: Number, default: 0 },

    // Scalable Domain Summaries
    domainSummaries: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        http: { status: null, score: 0, passed: 0, warnings: 0, errors: 0 },
        browser: { score: 0, passed: 0, errors: 0 },
        console: { score: 100, errors: 0, warnings: 0 },
        network: { score: 100, failedRequests: 0, timeoutRequests: 0 },
        httpErrors: { score: 100, errorsCount: 0 },
        seo: { score: 0, metaPresent: false },
        security: { score: 0, sslValid: false, headersCount: 0 },
        performance: { score: 0, pageLoadTimeMs: null, fcpMs: null },
        accessibility: { score: 0, issuesCount: 0 },
        links: { score: 100, totalLinks: 0, brokenLinks: 0 },
        assets: { score: 100, totalImages: 0, brokenImages: 0 },
        responsive: { score: 100, desktopClean: true, mobileClean: true },
        technology: { detectedCount: 0, technologies: [] }
      })
    },

    // Screenshot Base64 / URI
    screenshot: {
      type: String,
      default: null
    },

    // Failure tracking for unhandled scan errors
    errorMessage: {
      type: String,
      default: null
    },
    errorStack: {
      type: String,
      default: null
    },
    failureReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for high-performance dashboard querying & history tracking
scanSchema.index({ websiteId: 1, createdAt: -1 });
scanSchema.index({ userId: 1, createdAt: -1 });
scanSchema.index({ status: 1, createdAt: -1 });
scanSchema.index({ normalizedUrl: 1, createdAt: -1 });

const Scan = mongoose.models.Scan || mongoose.model('Scan', scanSchema);

export default Scan;

