import { executeWebsiteCrawl } from '../Services/crawlerService.js';
import { executeScan } from '../Services/scanService.js';
import logger from '../Utils/logger.js';

/**
 * Executes a full website audit across multiple URLs submitted in bulk
 * POST /api/bulk-analyze
 */
export async function bulkAnalyzeWebsites(req, res, next) {
  try {
    const { urls, maxPagesPerSite = 5, concurrency = 3 } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'An array of "urls" is required for bulk analysis'
      });
    }

    // Process all valid URLs without artificial batch count limits
    const targetUrls = urls.filter(u => typeof u === 'string' && u.trim().length > 0);
    logger.info(`Starting parallel bulk website audit for ${targetUrls.length} URLs`);

    const effectiveMaxPages = Number(maxPagesPerSite) > 0 ? Number(maxPagesPerSite) : (maxPagesPerSite === 'unlimited' || maxPagesPerSite === 0 ? Infinity : 5);
    const results = [];
    const chunkSize = Math.max(1, Number(concurrency) || 3);

    // Process batch in parallel chunks (3 URLs at a time)
    for (let i = 0; i < targetUrls.length; i += chunkSize) {
      const chunk = targetUrls.slice(i, i + chunkSize);
      logger.info(`[Bulk Batch] Processing parallel chunk ${Math.floor(i / chunkSize) + 1}: ${chunk.join(', ')}`);

      const chunkPromises = chunk.map(async (rawUrl) => {
        try {
          let auditResult;
          try {
            auditResult = await executeWebsiteCrawl(rawUrl, { maxPages: effectiveMaxPages, concurrency: 2 });
          } catch (crawlErr) {
            logger.warn(`[Bulk Crawl fallback] Single-root deep audit for ${rawUrl}: ${crawlErr.message}`);
            auditResult = await executeScan(rawUrl, { scanType: 'bulk' });
          }

          return {
            url: rawUrl,
            status: 'completed',
            data: auditResult
          };
        } catch (err) {
          logger.error(`[Bulk Error] Audit failed for ${rawUrl}: ${err.message}`);
          return {
            url: rawUrl,
            status: 'failed',
            error: err.message
          };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
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
