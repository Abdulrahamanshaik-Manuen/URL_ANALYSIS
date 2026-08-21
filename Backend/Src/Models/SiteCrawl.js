const mongoose = require('mongoose');

const pageResultSchema = new mongoose.Schema({
  url: { type: String, required: true },
  path: { type: String, default: '/' },
  title: { type: String, default: '' },
  statusCode: { type: Number, default: 200 },
  statusText: { type: String, default: 'OK' },
  responseTimeMs: { type: Number, default: 0 },
  healthScore: { type: Number, default: 0 },
  jsErrorsCount: { type: Number, default: 0 },
  brokenLinksCount: { type: Number, default: 0 },
  a11yIssuesCount: { type: Number, default: 0 },
  sslValid: { type: Boolean, default: true },
  details: { type: Object, default: {} }
});

const siteCrawlSchema = new mongoose.Schema(
  {
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      default: null,
      index: true
    },
    startUrl: {
      type: String,
      required: true
    },
    domain: {
      type: String,
      required: true,
      index: true
    },
    totalPagesDiscovered: {
      type: Number,
      default: 0
    },
    totalPagesCrawled: {
      type: Number,
      default: 0
    },
    siteHealthScore: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed'],
      default: 'running',
      index: true
    },
    durationMs: {
      type: Number,
      default: 0
    },
    pages: [pageResultSchema]
  },
  {
    timestamps: true
  }
);

const SiteCrawl = mongoose.models.SiteCrawl || mongoose.model('SiteCrawl', siteCrawlSchema);

module.exports = SiteCrawl;
