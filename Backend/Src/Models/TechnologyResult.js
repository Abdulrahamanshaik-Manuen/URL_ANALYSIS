import mongoose from 'mongoose';

const technologyResultSchema = new mongoose.Schema(
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
    technologies: [
      {
        name: { type: String, required: true },
        category: { type: String, default: 'General' },
        version: { type: String, default: null },
        confidence: { type: Number, default: 100 },
        icon: { type: String, default: null }
      }
    ],
    byCategory: {
      servers: [{ type: mongoose.Schema.Types.Mixed }],
      cms: [{ type: mongoose.Schema.Types.Mixed }],
      frameworks: [{ type: mongoose.Schema.Types.Mixed }],
      cdn: [{ type: mongoose.Schema.Types.Mixed }],
      analytics: [{ type: mongoose.Schema.Types.Mixed }]
    },
    count: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const TechnologyResult = mongoose.models.TechnologyResult || mongoose.model('TechnologyResult', technologyResultSchema);

export default TechnologyResult;

