import { executeWebsiteCrawl } from '../Services/crawlerService.js';
import { executeScan } from '../Services/scanService.js';
import logger from '../Utils/logger.js';

/**
 * Executes a full website audit across multiple URLs submitted in bulk
 * POST /api/bulk-analyze
 */
export async function bulkAnalyzeWebsites(req, res, next) {
  try {
    const { urls, maxPagesPerSite = 5, concurrency = 2 } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'An array of "urls" is required for bulk analysis'
      });
    }

    // Limit maximum bulk URLs per request to prevent server overload
    const targetUrls = urls.slice(0, 50).filter(u => typeof u === 'string' && u.trim().length > 0);
    logger.info(`Starting bulk full website audit for ${targetUrls.length} URLs`);

    const results = [];

    // Process batch in controlled chunks
    for (const rawUrl of targetUrls) {
      try {
        logger.info(`[Bulk] Processing Full Website Audit for: ${rawUrl}`);
        // Attempt full website crawl audit first, fallback to deep scan if needed
        let auditResult;
        try {
          auditResult = await executeWebsiteCrawl(rawUrl, { maxPages: maxPagesPerSite, concurrency: 2 });
        } catch (crawlErr) {
          logger.warn(`[Bulk Crawl fallback] Running single-root deep audit for ${rawUrl}: ${crawlErr.message}`);
          auditResult = await executeScan(rawUrl, { scanType: 'bulk' });
        }

        results.push({
          url: rawUrl,
          status: 'completed',
          data: auditResult
        });
      } catch (err) {
        logger.error(`[Bulk Error] Audit failed for ${rawUrl}: ${err.message}`);
        results.push({
          url: rawUrl,
          status: 'failed',
          error: err.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      totalSubmitted: targetUrls.length,
      completed: results.filter(r => r.status === 'completed').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    });
  } catch (err) {
    logger.error(`Bulk analysis controller error: ${err.message}`, err.stack);
    return res.status(500).json({
      success: false,
      error: 'Failed to complete bulk website analysis',
      message: err.message
    });
  }
}

export default {
  bulkAnalyzeWebsites
};
