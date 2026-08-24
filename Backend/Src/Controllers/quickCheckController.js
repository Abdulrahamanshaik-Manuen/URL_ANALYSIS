import { normalizeUrl } from '../Utils/urlHelper.js';
import { checkDns } from '../Services/dnsService.js';
import { checkSsl } from '../Services/sslService.js';
import { measurePerformance } from '../Services/performanceService.js';
import { traceRedirects } from '../Services/redirectService.js';
import { checkAvailability } from '../Services/availabilityService.js';
import { analyzeSecurity } from '../Services/securityService.js';

/**
 * Handles individual micro-checks without running the whole pipeline
 */
export async function handleQuickCheck(req, res) {
  const { type } = req.params;
  const urlParam = req.query.url || req.body.url;

  if (!urlParam) {
    return res.status(400).json({ success: false, error: 'Query parameter or body field "url" is required' });
  }

  const normalized = normalizeUrl(urlParam);
  if (!normalized.valid) {
    return res.status(400).json({ success: false, error: normalized.error });
  }

  try {
    let result = null;

    switch (type.toLowerCase()) {
      case 'dns':
        result = await checkDns(normalized.hostname);
        break;

      case 'ssl':
        result = await checkSsl(normalized.hostname, normalized.port);
        break;

      case 'performance':
        result = await measurePerformance(normalized.normalized);
        break;

      case 'redirects':
        result = await traceRedirects(normalized.normalized);
        break;

      case 'availability':
        result = await checkAvailability(normalized.normalized);
        break;

      case 'headers':
      case 'security': {
        const perf = await measurePerformance(normalized.normalized);
        result = analyzeSecurity(perf.headers, perf.body, normalized.normalized);
        break;
      }

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown check type "${type}". Supported: dns, ssl, performance, redirects, availability, headers, security`
        });
    }

    return res.status(200).json({
      success: true,
      type,
      targetUrl: normalized.normalized,
      timestamp: new Date().toISOString(),
      data: result
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Failed to perform ${type} check`,
      message: err.message
    });
  }
}

export default {
  handleQuickCheck
};

