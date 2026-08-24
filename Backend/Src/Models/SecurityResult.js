import mongoose from 'mongoose';

const securityResultSchema = new mongoose.Schema(
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

    // SSL / TLS Certificate Deep-Dive
    ssl: {
      valid: { type: Boolean, default: false },
      authorized: { type: Boolean, default: false },
      authorizationError: { type: String, default: null },
      protocol: { type: String, default: null },
      cipher: { type: String, default: null },
      daysRemaining: { type: Number, default: null },
      validFrom: { type: String, default: null },
      validTo: { type: String, default: null },
      isExpired: { type: Boolean, default: false },
      isExpiringSoon: { type: Boolean, default: false },
      domainMatch: { type: Boolean, default: false },
      subject: {
        commonName: { type: String, default: null },
        organization: { type: String, default: null },
        country: { type: String, default: null }
      },
      issuer: {
        commonName: { type: String, default: null },
        organization: { type: String, default: null },
        country: { type: String, default: null }
      },
      san: [{ type: String }],
      fingerprint256: { type: String, default: null },
      serialNumber: { type: String, default: null },
      chainDepth: { type: Number, default: 1 }
    },

    // HTTP Security Headers
    headers: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },

    // Mixed Content Insecure Resource Scanner
    mixedContent: {
      hasMixedContent: { type: Boolean, default: false },
      count: { type: Number, default: 0 },
      items: [
        {
          type: { type: String },
          url: { type: String }
        }
      ]
    },

    // Cookie Security & Privacy
    cookies: {
      total: { type: Number, default: 0 },
      secure: { type: Number, default: 0 },
      httpOnly: { type: Number, default: 0 },
      sameSiteStrict: { type: Number, default: 0 },
      sameSiteLax: { type: Number, default: 0 },
      sameSiteNone: { type: Number, default: 0 },
      thirdParty: { type: Number, default: 0 },
      privacyScore: { type: Number, default: 100 },
      items: [
        {
          name: { type: String },
          domain: { type: String },
          path: { type: String },
          secure: { type: Boolean },
          httpOnly: { type: Boolean },
          sameSite: { type: String }
        }
      ]
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

const SecurityResult = mongoose.models.SecurityResult || mongoose.model('SecurityResult', securityResultSchema);

export default SecurityResult;

