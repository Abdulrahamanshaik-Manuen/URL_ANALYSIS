const express = require('express');
const router = express.Router();
const scanController = require('../Controllers/scanController');

// GET /api/scans/:id - Scan details
router.get('/:id', scanController.getScanById);

// GET /api/scans/:id/checks - Paginated check results
router.get('/:id/checks', scanController.getScanChecks);

// GET /api/scans/:id/errors - Overview of all errors
router.get('/:id/errors', scanController.getScanErrorsOverview);

// GET /api/scans/:id/console-errors - Console logs and JS errors
router.get('/:id/console-errors', scanController.getScanConsoleErrors);

// GET /api/scans/:id/network-errors - Playwright failed network requests
router.get('/:id/network-errors', scanController.getScanNetworkErrors);

// GET /api/scans/:id/http-errors - HTTP 4xx and 5xx responses
router.get('/:id/http-errors', scanController.getScanHttpErrors);

// GET /api/scans/:id/performance - Performance result document
router.get('/:id/performance', scanController.getScanPerformance);

// GET /api/scans/:id/security - Security result document
router.get('/:id/security', scanController.getScanSecurity);

// GET /api/scans/:id/seo - SEO result document
router.get('/:id/seo', scanController.getScanSeo);

// GET /api/scans/:id/accessibility - Accessibility result document
router.get('/:id/accessibility', scanController.getScanAccessibility);

module.exports = router;
