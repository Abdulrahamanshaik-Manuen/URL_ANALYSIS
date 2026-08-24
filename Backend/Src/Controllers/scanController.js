import {
  Scan,
  CheckResult,
  ConsoleError,
  NetworkError,
  HttpError,
  PerformanceResult,
  SecurityResult,
  SeoResult,
  AccessibilityResult,
  TechnologyResult
} from '../Models/index.js';


/**
 * Retrieves a single scan document by ID
 * GET /api/scans/:id
 */
async function getScanById(req, res, next) {
  try {
    const scan = await Scan.findById(req.params.id)
      .populate('websiteId', 'url normalizedUrl domain title currentHealthScore')
      .lean();

    if (!scan) {
      return res.status(404).json({ success: false, error: 'Scan not found' });
    }

    res.json({ success: true, data: scan });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves paginated check results for a scan with domain/status filtering
 * GET /api/scans/:id/checks?domain=security&status=failed&page=1&limit=25
 */
async function getScanChecks(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const query = { scanId: req.params.id };
    if (req.query.domain) query.domain = req.query.domain;
    if (req.query.status) query.status = req.query.status;
    if (req.query.severity) query.severity = req.query.severity;

    const [checks, total] = await Promise.all([
      CheckResult.find(query).skip(skip).limit(limit).lean(),
      CheckResult.countDocuments(query)
    ]);

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      data: checks
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves an aggregated error summary for a scan
 * GET /api/scans/:id/errors
 */
async function getScanErrorsOverview(req, res, next) {
  try {
    const scanId = req.params.id;

    const [consoleErrors, networkErrors, httpErrors] = await Promise.all([
      ConsoleError.find({ scanId }).limit(100).lean(),
      NetworkError.find({ scanId }).limit(100).lean(),
      HttpError.find({ scanId }).limit(100).lean()
    ]);

    res.json({
      success: true,
      summary: {
        totalConsoleErrors: consoleErrors.length,
        totalNetworkErrors: networkErrors.length,
        totalHttpErrors: httpErrors.length
      },
      data: {
        consoleErrors,
        networkErrors,
        httpErrors
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves paginated console errors
 * GET /api/scans/:id/console-errors
 */
async function getScanConsoleErrors(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const query = { scanId: req.params.id };
    if (req.query.type) query.type = req.query.type;

    const [errors, total] = await Promise.all([
      ConsoleError.find(query).skip(skip).limit(limit).lean(),
      ConsoleError.countDocuments(query)
    ]);

    res.json({
      success: true,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      data: errors
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves paginated network errors
 * GET /api/scans/:id/network-errors
 */
async function getScanNetworkErrors(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const query = { scanId: req.params.id };

    const [errors, total] = await Promise.all([
      NetworkError.find(query).skip(skip).limit(limit).lean(),
      NetworkError.countDocuments(query)
    ]);

    res.json({
      success: true,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      data: errors
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves paginated HTTP errors (4xx / 5xx)
 * GET /api/scans/:id/http-errors
 */
async function getScanHttpErrors(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const query = { scanId: req.params.id };
    if (req.query.statusCode) query.statusCode = parseInt(req.query.statusCode);

    const [errors, total] = await Promise.all([
      HttpError.find(query).skip(skip).limit(limit).lean(),
      HttpError.countDocuments(query)
    ]);

    res.json({
      success: true,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      data: errors
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves detailed performance result document
 * GET /api/scans/:id/performance
 */
async function getScanPerformance(req, res, next) {
  try {
    const performance = await PerformanceResult.findOne({ scanId: req.params.id }).lean();
    if (!performance) return res.status(404).json({ success: false, error: 'Performance record not found' });
    res.json({ success: true, data: performance });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves detailed security result document
 * GET /api/scans/:id/security
 */
async function getScanSecurity(req, res, next) {
  try {
    const security = await SecurityResult.findOne({ scanId: req.params.id }).lean();
    if (!security) return res.status(404).json({ success: false, error: 'Security record not found' });
    res.json({ success: true, data: security });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves detailed SEO result document
 * GET /api/scans/:id/seo
 */
async function getScanSeo(req, res, next) {
  try {
    const seo = await SeoResult.findOne({ scanId: req.params.id }).lean();
    if (!seo) return res.status(404).json({ success: false, error: 'SEO record not found' });
    res.json({ success: true, data: seo });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves detailed Accessibility result document
 * GET /api/scans/:id/accessibility
 */
async function getScanAccessibility(req, res, next) {
  try {
    const accessibility = await AccessibilityResult.findOne({ scanId: req.params.id }).lean();
    if (!accessibility) return res.status(404).json({ success: false, error: 'Accessibility record not found' });
    res.json({ success: true, data: accessibility });
  } catch (err) {
    next(err);
  }
}

export {
  getScanById,
  getScanChecks,
  getScanErrorsOverview,
  getScanConsoleErrors,
  getScanNetworkErrors,
  getScanHttpErrors,
  getScanPerformance,
  getScanSecurity,
  getScanSeo,
  getScanAccessibility
};

export default {
  getScanById,
  getScanChecks,
  getScanErrorsOverview,
  getScanConsoleErrors,
  getScanNetworkErrors,
  getScanHttpErrors,
  getScanPerformance,
  getScanSecurity,
  getScanSeo,
  getScanAccessibility
};

