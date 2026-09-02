import mongoose from 'mongoose';

const CrawledPageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String },
  statusCode: { type: Number },
  responseTimeMs: { type: Number },
  screenshotUrl: { type: String },
  healthScore: { type: Number, default: 0 },
  issuesCount: { type: Number, default: 0 },
  details: { type: mongoose.Schema.Types.Mixed }
});

const AuditReportSchema = new mongoose.Schema(
  {
    targetUrl: { type: String, required: true, index: true },
    scanType: { type: String, enum: ['single', 'crawl'], default: 'single' },
    crawlStatus: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'completed' },
    pagesDiscovered: { type: Number, default: 1 },
    pagesScanned: { type: Number, default: 1 },
    pagesFailed: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 },
    rating: { type: String, default: 'Unknown' },
    domainScores: {
      availability: { type: Number, default: 0 },
      performance: { type: Number, default: 0 },
      security: { type: Number, default: 0 },
      seo: { type: Number, default: 0 },
      accessibility: { type: Number, default: 0 }
    },
    summary: {
      statusCode: { type: Number },
      statusText: { type: String },
      responseTimeMs: { type: Number },
      sslValid: { type: Boolean },
      sslDaysRemaining: { type: Number },
      jsErrorsCount: { type: Number, default: 0 },
      brokenLinksCount: { type: Number, default: 0 },
      technologiesCount: { type: Number, default: 0 }
    },
    screenshotUrl: { type: String },
    crawledPages: [CrawledPageSchema],
    fullDetails: { type: mongoose.Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

AuditReportSchema.index({ createdAt: -1 });

export default mongoose.model('AuditReport', AuditReportSchema);
