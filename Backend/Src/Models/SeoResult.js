import mongoose from 'mongoose';

const seoResultSchema = new mongoose.Schema(
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

    // Meta & Document
    title: { type: String, default: null },
    titleLength: { type: Number, default: 0 },
    metaDescription: { type: String, default: null },
    metaDescriptionLength: { type: Number, default: 0 },
    canonical: { type: String, default: null },
    robotsMeta: { type: String, default: null },
    favicon: { type: String, default: null },
    language: { type: String, default: null },

    // Headings Hierarchy
    h1Count: { type: Number, default: 0 },
    h2Count: { type: Number, default: 0 },
    h3Count: { type: Number, default: 0 },
    headings: [
      {
        level: { type: String },
        text: { type: String }
      }
    ],

    // Content Quality
    wordCount: { type: Number, default: 0 },
    readingTimeMinutes: { type: Number, default: 0 },

    // Internationalization & Social Meta
    hreflang: [{ type: String }],
    openGraph: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    twitterCard: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },

    // Structured Data (JSON-LD, Microdata)
    structuredData: {
      hasJsonLd: { type: Boolean, default: false },
      types: [{ type: String }],
      count: { type: Number, default: 0 }
    },

    // Crawlability & Indexability
    robotsTxt: {
      exists: { type: Boolean, default: false },
      url: { type: String, default: null },
      disallowCount: { type: Number, default: 0 },
      allowCount: { type: Number, default: 0 },
      sitemaps: [{ type: String }]
    },
    sitemap: {
      exists: { type: Boolean, default: false },
      url: { type: String, default: null },
      urlCount: { type: Number, default: 0 }
    },
    indexability: { type: Boolean, default: true },
    crawlability: { type: Boolean, default: true },

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

const SeoResult = mongoose.models.SeoResult || mongoose.model('SeoResult', seoResultSchema);

export default SeoResult;

