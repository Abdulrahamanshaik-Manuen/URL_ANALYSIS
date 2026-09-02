import mongoose from 'mongoose';
import AuditReport from '../Models/AuditReport.js';
import SiteCrawl from '../Models/SiteCrawl.js';
import Scan from '../Models/Scan.js';
import UserPreferences from '../Models/UserPreferences.js';

// Get List of Past Audit Reports & Site Crawls from MongoDB Atlas
export async function getHistory(req, res) {
  try {
    let auditReports = [];
    try {
      auditReports = await AuditReport.find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .allowDiskUse(true)
        .select('targetUrl scanType crawlStatus pagesDiscovered pagesScanned overallScore rating screenshotUrl createdAt')
        .lean();
    } catch (e) {
      console.warn('AuditReport query warning:', e.message);
    }

    let siteCrawls = [];
    try {
      siteCrawls = await SiteCrawl.find({})
        .sort({ createdAt: -1 })
        .limit(30)
        .allowDiskUse(true)
        .select('startUrl status totalPagesDiscovered totalPagesCrawled siteHealthScore createdAt')
        .lean();
    } catch (e) {
      console.warn('SiteCrawl query warning:', e.message);
    }

    const existingTargetUrls = new Set(auditReports.map(r => (r.targetUrl || '').toLowerCase()));

    const convertedCrawls = siteCrawls
      .filter(sc => sc.startUrl && !existingTargetUrls.has(sc.startUrl.toLowerCase()))
      .map(sc => ({
        _id: sc._id,
        targetUrl: sc.startUrl,
        scanType: 'crawl',
        crawlStatus: sc.status || 'completed',
        pagesDiscovered: sc.totalPagesDiscovered || 1,
        pagesScanned: sc.totalPagesCrawled || 1,
        overallScore: sc.siteHealthScore || 0,
        rating: (sc.siteHealthScore || 0) >= 80 ? 'Excellent' : (sc.siteHealthScore || 0) >= 50 ? 'Good' : 'Poor',
        crawledPages: [],
        createdAt: sc.createdAt
      }));

    const allReports = [...auditReports, ...convertedCrawls].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ success: true, count: allReports.length, reports: allReports });
  } catch (err) {
    console.error('Error fetching history:', err.message);
    return res.status(500).json({ success: false, message: err.message, reports: [] });
  }
}

// Get Specific Audit Report by ID (supports AuditReport, SiteCrawl, and Scan collections)
export async function getReportById(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Report ID is required' });
    }

    // 1. Try AuditReport collection first
    if (mongoose.Types.ObjectId.isValid(id)) {
      const report = await AuditReport.findById(id).lean();
      if (report) {
        if (!report.fullDetails || Object.keys(report.fullDetails).length === 0) {
          report.fullDetails = report;
        }
        return res.json({ success: true, report });
      }

      // 2. Fallback to SiteCrawl collection if it's a crawl record ID
      const siteCrawl = await SiteCrawl.findById(id).lean();
      if (siteCrawl) {
        const firstPageDetails = siteCrawl.pages?.[0]?.details || {};
        const synthFullDetails = (firstPageDetails && Object.keys(firstPageDetails).length > 0)
          ? firstPageDetails
          : {
              url: siteCrawl.startUrl,
              scores: { overall: siteCrawl.siteHealthScore || 0, rating: (siteCrawl.siteHealthScore || 0) >= 80 ? 'EXCELLENT' : (siteCrawl.siteHealthScore || 0) >= 50 ? 'GOOD' : 'POOR' },
              crawledPages: siteCrawl.pages || [],
              summary: {
                totalPages: siteCrawl.totalPagesCrawled || siteCrawl.pages?.length || 1,
                durationMs: siteCrawl.durationMs || 0
              }
            };

        const adaptedReport = {
          _id: siteCrawl._id,
          targetUrl: siteCrawl.startUrl,
          scanType: 'crawl',
          crawlStatus: siteCrawl.status || 'completed',
          pagesDiscovered: siteCrawl.totalPagesDiscovered || 1,
          pagesScanned: siteCrawl.totalPagesCrawled || 1,
          pagesFailed: siteCrawl.pages?.filter(p => !p.statusCode || p.statusCode >= 400).length || 0,
          overallScore: siteCrawl.siteHealthScore || 0,
          rating: (siteCrawl.siteHealthScore || 0) >= 80 ? 'Excellent' : (siteCrawl.siteHealthScore || 0) >= 50 ? 'Good' : 'Poor',
          domainScores: firstPageDetails.scores || {},
          summary: firstPageDetails.summary || {},
          screenshotUrl: siteCrawl.pages?.[0]?.screenshotUrl || null,
          crawledPages: siteCrawl.pages || [],
          fullDetails: synthFullDetails,
          createdAt: siteCrawl.createdAt
        };
        return res.json({ success: true, report: adaptedReport });
      }

      // 3. Fallback to Scan collection if it's a scan record ID
      const scanDoc = await Scan.findById(id).lean();
      if (scanDoc) {
        const adaptedReport = {
          _id: scanDoc._id,
          targetUrl: scanDoc.url || scanDoc.normalizedUrl,
          scanType: scanDoc.scanType || 'single',
          crawlStatus: scanDoc.status || 'completed',
          pagesDiscovered: 1,
          pagesScanned: 1,
          pagesFailed: scanDoc.status === 'failed' ? 1 : 0,
          overallScore: scanDoc.healthScore || 0,
          rating: (scanDoc.healthScore || 0) >= 80 ? 'Excellent' : (scanDoc.healthScore || 0) >= 50 ? 'Good' : 'Poor',
          domainScores: scanDoc.domainSummaries || {},
          summary: { statusCode: 200, statusText: 'OK' },
          screenshotUrl: scanDoc.screenshot || null,
          crawledPages: [],
          fullDetails: {
            url: scanDoc.url || scanDoc.normalizedUrl,
            scores: { overall: scanDoc.healthScore || 0, grade: scanDoc.grade },
            summary: scanDoc.domainSummaries || {}
          },
          createdAt: scanDoc.createdAt
        };
        return res.json({ success: true, report: adaptedReport });
      }
    }

    // 4. Try matching targetUrl as fallback string ID lookup
    const reportByUrl = await AuditReport.findOne({ targetUrl: id }).lean();
    if (reportByUrl) {
      if (!reportByUrl.fullDetails || Object.keys(reportByUrl.fullDetails).length === 0) {
        reportByUrl.fullDetails = reportByUrl;
      }
      return res.json({ success: true, report: reportByUrl });
    }

    return res.status(404).json({ success: false, message: 'Audit report not found' });
  } catch (err) {
    console.error('Error fetching report by ID:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Delete Audit Report by ID from MongoDB Atlas
export async function deleteReport(req, res) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Report ID format' });
    }

    const auditDeleted = await AuditReport.findByIdAndDelete(id);
    const crawlDeleted = await SiteCrawl.findByIdAndDelete(id);

    if (!auditDeleted && !crawlDeleted) {
      return res.status(404).json({ success: false, message: 'Audit report not found for deletion' });
    }

    return res.json({ success: true, message: 'Audit report deleted successfully from MongoDB Atlas' });
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
