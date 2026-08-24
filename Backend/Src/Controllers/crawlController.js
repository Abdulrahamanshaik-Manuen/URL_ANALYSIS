import { executeWebsiteCrawl } from '../Services/crawlerService.js';
import { SiteCrawl } from '../Models/index.js';
import logger from '../Utils/logger.js';

/**
 * Standard REST endpoint for full website crawl
 * POST /api/crawl
 */
export async function crawlWebsite(req, res, next) {
  try {
    const rawUrl = req.normalizedUrl?.normalized || req.body?.url;
    const maxPages = req.body?.maxPages || 20;
    const concurrency = req.body?.concurrency || 3;

    logger.info(`Starting website crawl controller for: ${rawUrl}`);

    const result = await executeWebsiteCrawl(rawUrl, { maxPages, concurrency });

    return res.status(200).json(result);
  } catch (err) {
    logger.error(`Error during website crawl: ${err.message}`, err.stack);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred during website crawl',
      message: err.message
    });
  }
}

/**
 * Real-time SSE streaming endpoint for website crawl
 * POST /api/crawl/stream
 */
export async function streamCrawlWebsite(req, res, next) {
  try {
    const rawUrl = req.normalizedUrl?.normalized || req.body?.url;
    const maxPages = req.body?.maxPages || 20;
    const concurrency = req.body?.concurrency || 3;

    // Set headers for SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    logger.info(`Starting streaming website crawl for: ${rawUrl}`);

    const result = await executeWebsiteCrawl(
      rawUrl,
      { maxPages, concurrency },
      ({ event, data }) => {
        sendEvent(event, data);
      }
    );

    sendEvent('done', result);
    res.end();
  } catch (err) {
    logger.error(`Streaming crawl error: ${err.message}`);
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

/**
 * Retrieves crawl history from MongoDB
 * GET /api/crawl/history
 */
export async function getCrawlHistory(req, res, next) {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const domain = req.query.domain;

    const query = {};
    if (domain) {
      query.domain = { $regex: domain, $options: 'i' };
    }

    const crawls = await SiteCrawl.find(query)
      .select('-pages.details')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: crawls
    });
  } catch (err) {
    next(err);
  }
}

export default {
  crawlWebsite,
  streamCrawlWebsite,
  getCrawlHistory
};

