import express from 'express';
import { analyzeUrl, streamAnalyzeUrl } from '../Controllers/analyzeController.js';
import { handleQuickCheck } from '../Controllers/quickCheckController.js';
import { bulkAnalyzeWebsites } from '../Controllers/bulkController.js';
import { validateAnalyzeRequest } from '../Validators/analyzeValidator.js';

const router = express.Router();

// 1. Full Composite Analysis Endpoints
router.post('/analyze', validateAnalyzeRequest, analyzeUrl);
router.post('/bulk-analyze', bulkAnalyzeWebsites);


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

// 2. Instant Micro / Quick Checks
router.get('/quick-check/:type', handleQuickCheck);
router.post('/quick-check/:type', handleQuickCheck);

export default router;

