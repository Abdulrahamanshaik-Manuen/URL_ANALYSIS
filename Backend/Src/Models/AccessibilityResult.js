import mongoose from 'mongoose';

const accessibilityResultSchema = new mongoose.Schema(
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

    summary: {
      totalElementsChecked: { type: Number, default: 0 },
      imagesWithoutAltCount: { type: Number, default: 0 },
      missingFormLabelsCount: { type: Number, default: 0 },
      emptyButtonsCount: { type: Number, default: 0 },
      missingLanguage: { type: Boolean, default: false },
      ariaIssuesCount: { type: Number, default: 0 },
      headingStructureValid: { type: Boolean, default: true },
      duplicateIdsCount: { type: Number, default: 0 }
    },

    findings: [
      {
        selector: { type: String, default: null },
        element: { type: String, default: null },
        message: { type: String, required: true },
        severity: {
          type: String,
          enum: ['info', 'low', 'medium', 'high', 'critical'],
          default: 'medium'
        },
        recommendation: { type: String, default: null },
        codeSample: { type: String, default: null }
      }
    ],

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

const AccessibilityResult = mongoose.models.AccessibilityResult || mongoose.model('AccessibilityResult', accessibilityResultSchema);

export default AccessibilityResult;

