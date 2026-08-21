const express = require('express');
const router = express.Router();

const { analyzeUrl, streamAnalyzeUrl } = require('../Controllers/analyzeController');
const { handleQuickCheck } = require('../Controllers/quickCheckController');
const { handleApiTest } = require('../Controllers/apiTestController');
const { validateAnalyzeRequest, validateApiCheckRequest } = require('../Validators/analyzeValidator');

// 1. Full Composite Analysis Endpoints
router.post('/analyze', validateAnalyzeRequest, analyzeUrl);
router.post('/analyze/stream', validateAnalyzeRequest, streamAnalyzeUrl);
router.get('/analyze/stream', (req, res, next) => {
  // Map query params to body format for GET requests
  req.body = {
    url: req.query.url,
    options: req.query.options ? JSON.parse(req.query.options) : {},
    advanced: req.query.advanced ? JSON.parse(req.query.advanced) : {}
  };
  next();
}, validateAnalyzeRequest, streamAnalyzeUrl);

// 2. Dedicated API Endpoint Checker
router.post('/api-check', validateApiCheckRequest, handleApiTest);

// 3. Instant Micro / Quick Checks
router.get('/quick-check/:type', handleQuickCheck);
router.post('/quick-check/:type', handleQuickCheck);

module.exports = router;
