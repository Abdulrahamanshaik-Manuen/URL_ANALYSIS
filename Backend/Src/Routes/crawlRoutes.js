import express from 'express';
import { crawlWebsite, streamCrawlWebsite, getCrawlHistory } from '../Controllers/crawlController.js';
import { validateAnalyzeRequest } from '../Validators/analyzeValidator.js';

const router = express.Router();

// Website Crawl endpoints
router.post('/', validateAnalyzeRequest, crawlWebsite);
router.post('/stream', validateAnalyzeRequest, streamCrawlWebsite);
router.get('/history', getCrawlHistory);

export default router;

