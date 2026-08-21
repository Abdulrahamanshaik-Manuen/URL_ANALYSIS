const express = require('express');
const router = express.Router();
const { crawlWebsite, streamCrawlWebsite, getCrawlHistory } = require('../Controllers/crawlController');
const { validateAnalyzeRequest } = require('../Validators/analyzeValidator');

// Website Crawl endpoints
router.post('/', validateAnalyzeRequest, crawlWebsite);
router.post('/stream', validateAnalyzeRequest, streamCrawlWebsite);
router.get('/history', getCrawlHistory);

module.exports = router;
