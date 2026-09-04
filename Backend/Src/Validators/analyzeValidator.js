import { normalizeUrl } from '../Utils/urlHelper.js';

export function validateAnalyzeRequest(req, res, next) {
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

export default {
  validateAnalyzeRequest
};

