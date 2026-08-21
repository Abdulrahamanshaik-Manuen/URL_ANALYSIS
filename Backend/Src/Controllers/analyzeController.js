const { executeScan } = require('../Services/scanService');
const { runFullAnalysis } = require('../Services/analyzerOrchestrator');
const { formatAnalysisResponse } = require('../Utils/responseFormatter');
const logger = require('../Utils/logger');

/**
 * Standard REST API endpoint for comprehensive URL analysis with MongoDB persistence
 * POST /api/analyze
 */
async function analyzeUrl(req, res, next) {
  try {
    const rawUrl = req.normalizedUrl?.normalized || req.body?.url;
    const options = {
      ...(req.analysisOptions || {}),
      ...(req.advancedOptions || {}),
      userId: req.user?._id || req.body?.userId || null,
      scanType: req.body?.scanType || 'full'
    };

    logger.info(`Starting analysis for URL: ${rawUrl}`);

    const result = await executeScan(rawUrl, options);

    return res.status(200).json(result);
  } catch (err) {
    logger.error(`Error during analysis: ${err.message}`, err.stack);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred during analysis',
      message: err.message
    });
  }
}

/**
 * Real-time Server-Sent Events (SSE) streaming endpoint with MongoDB persistence
 * GET or POST /api/analyze/stream
 */
async function streamAnalyzeUrl(req, res, next) {
  try {
    const rawUrl = req.normalizedUrl?.normalized || req.body?.url || req.query?.url;
    const options = {
      ...(req.analysisOptions || {}),
      ...(req.advancedOptions || {}),
      userId: req.user?._id || req.body?.userId || null,
      scanType: req.body?.scanType || 'full'
    };

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    logger.info(`Starting streaming analysis for: ${rawUrl}`);

    // Progress updates through orchestrator callback
    const { results, executionTimeMs } = await runFullAnalysis(
      req.normalizedUrl || { normalized: rawUrl },
      options,
      options,
      ({ step, data }) => {
        sendEvent('progress', { step, data });
      }
    );

    // Persist scan via executeScan or format and send
    const formatted = formatAnalysisResponse(rawUrl, results, executionTimeMs);

    sendEvent('done', formatted);
    res.end();
  } catch (err) {
    logger.error(`Streaming error: ${err.message}`);
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

module.exports = {
  analyzeUrl,
  streamAnalyzeUrl
};
