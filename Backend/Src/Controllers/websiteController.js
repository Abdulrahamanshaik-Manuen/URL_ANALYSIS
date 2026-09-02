import { Website, Scan, CheckResult, ConsoleError, NetworkError, HttpError, LinkCheck, PerformanceResult, SecurityResult, SeoResult, AccessibilityResult, TechnologyResult } from '../Models/index.js';
import logger from '../Utils/logger.js';


/**
 * Lists all registered websites with pagination and search
 * GET /api/websites
 */
async function getWebsites(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : '';
    const status = req.query.status;

    const query = {};
    if (search) {
      query.$or = [
        { domain: { $regex: search, $options: 'i' } },
        { normalizedUrl: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.currentStatus = status;
    }

    const [websites, total] = await Promise.all([
      Website.find(query)
        .populate('lastScanId', 'healthScore grade overallStatus totalChecks durationMs completedAt')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .allowDiskUse(true)
        .lean(),
      Website.countDocuments(query)
    ]);

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      data: websites
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves a single website by ID
 * GET /api/websites/:id
 */
async function getWebsiteById(req, res, next) {
  try {
    const website = await Website.findById(req.params.id)
      .populate('lastScanId')
      .lean();

    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }

    res.json({ success: true, data: website });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves scan history for a specific website
 * GET /api/websites/:id/scans
 */
async function getWebsiteScans(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const query = { websiteId: req.params.id };

    const [scans, total] = await Promise.all([
      Scan.find(query)
        .select('-screenshot -errorStack')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .allowDiskUse(true)
        .lean(),
      Scan.countDocuments(query)
    ]);

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      data: scans
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes a website and cleans up associated scan findings
 * DELETE /api/websites/:id
 */
async function deleteWebsite(req, res, next) {
  try {
    const websiteId = req.params.id;
    const website = await Website.findByIdAndDelete(websiteId);

    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }

    // Cascade delete associated records asynchronously
    const deletePromises = [
      Scan.deleteMany({ websiteId }),
      CheckResult.deleteMany({ websiteId }),
      ConsoleError.deleteMany({ websiteId }),
      NetworkError.deleteMany({ websiteId }),
      HttpError.deleteMany({ websiteId }),
      LinkCheck.deleteMany({ websiteId }),
      PerformanceResult.deleteMany({ websiteId }),
      SecurityResult.deleteMany({ websiteId }),
      SeoResult.deleteMany({ websiteId }),
      AccessibilityResult.deleteMany({ websiteId }),
      TechnologyResult.deleteMany({ websiteId })
    ];

    Promise.all(deletePromises).catch(err => {
      logger.warn(`Cascade deletion background cleanup warning: ${err.message}`);
    });

    res.json({
      success: true,
      message: 'Website and related scan records successfully deleted',
      deletedId: websiteId
    });
  } catch (err) {
    next(err);
  }
}

export {
  getWebsites,
  getWebsiteById,
  getWebsiteScans,
  deleteWebsite
};

export default {
  getWebsites,
  getWebsiteById,
  getWebsiteScans,
  deleteWebsite
};

