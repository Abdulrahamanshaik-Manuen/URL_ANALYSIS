import mongoose from 'mongoose';

const UserPreferencesSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, default: 'default_user' },
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    systemConfig: {
      timerMinutes: { type: Number, default: null },
      maxPages: { type: Number, default: 25 },
      concurrency: { type: Number, default: 3 },
      respectRobots: { type: Boolean, default: true }
    },
    options: { type: mongoose.Schema.Types.Mixed },
    advanced: {
      userAgent: { type: String, default: '' },
      keyword: { type: String, default: '' },
      timeout: { type: Number, default: 15000 }
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('UserPreferences', UserPreferencesSchema);
