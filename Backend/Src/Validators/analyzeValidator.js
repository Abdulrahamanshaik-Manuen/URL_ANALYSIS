const { normalizeUrl } = require('../Utils/urlHelper');

function validateAnalyzeRequest(req, res, next) {
  const { url, options, advanced } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Field "url" is required in request body'
    });
  }

  const normalized = normalizeUrl(url);
  if (!normalized.valid) {
    return res.status(400).json({
      success: false,
      error: normalized.error || 'Invalid URL provided'
    });
  }

  // Attach normalized details for downstream controllers
  req.normalizedUrl = normalized;
  req.analysisOptions = options || {};
  req.advancedOptions = advanced || {};

  next();
}

function validateApiCheckRequest(req, res, next) {
  const { url, method = 'GET' } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Field "url" is required in request body'
    });
  }

  const normalized = normalizeUrl(url);
  if (!normalized.valid) {
    return res.status(400).json({
      success: false,
      error: normalized.error || 'Invalid API URL'
    });
  }

  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  if (!validMethods.includes(method.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid HTTP method "${method}". Allowed: ${validMethods.join(', ')}`
    });
  }

  req.normalizedUrl = normalized;
  req.apiMethod = method.toUpperCase();
  next();
}

module.exports = {
  validateAnalyzeRequest,
  validateApiCheckRequest
};
