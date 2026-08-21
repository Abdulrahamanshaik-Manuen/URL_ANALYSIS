import AuditReport from '../Models/AuditReport.js';
import UserPreferences from '../Models/UserPreferences.js';

// Get List of Past Audit Reports
export async function getHistory(req, res) {
  try {
    const reports = await AuditReport.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-fullDetails');

    return res.json({ success: true, count: reports.length, reports });
  } catch (err) {
    console.error('Error fetching history:', err.message);
    return res.status(500).json({ success: false, message: err.message, reports: [] });
  }
}

// Get Specific Audit Report by ID
export async function getReportById(req, res) {
  try {
    const report = await AuditReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Audit report not found' });
    }
    return res.json({ success: true, report });
  } catch (err) {
    console.error('Error fetching report by ID:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Delete Audit Report by ID
export async function deleteReport(req, res) {
  try {
    await AuditReport.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Audit report deleted successfully' });
  } catch (err) {
    console.error('Error deleting report:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Get User Preferences
export async function getPreferences(req, res) {
  try {
    let prefs = await UserPreferences.findOne({ userId: 'default_user' });
    if (!prefs) {
      prefs = await UserPreferences.create({ userId: 'default_user' });
    }
    return res.json({ success: true, preferences: prefs });
  } catch (err) {
    console.error('Error fetching preferences:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Save/Update User Preferences
export async function savePreferences(req, res) {
  try {
    const { systemConfig, options, advanced, theme } = req.body;
    const updated = await UserPreferences.findOneAndUpdate(
      { userId: 'default_user' },
      { systemConfig, options, advanced, theme },
      { new: true, upsert: true }
    );
    return res.json({ success: true, preferences: updated });
  } catch (err) {
    console.error('Error saving preferences:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}
