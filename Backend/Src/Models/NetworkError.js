import mongoose from 'mongoose';

const networkErrorSchema = new mongoose.Schema(
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
    method: {
      type: String,
      default: 'GET'
    },
    resourceType: {
      type: String,
      default: 'fetch'
    },
    failureReason: {
      type: String,
      required: true
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

networkErrorSchema.index({ scanId: 1, resourceType: 1 });

const NetworkError = mongoose.models.NetworkError || mongoose.model('NetworkError', networkErrorSchema);

export default NetworkError;

