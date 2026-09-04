import http from 'http';
import https from 'https';
import config from '../Config/config.js';
import { resolveUrl, cleanRecursiveUrl } from '../Utils/urlHelper.js';
import logger from '../Utils/logger.js';


/**
 * Performs a single HTTP/HTTPS request without auto-following redirects
 * @param {string} currentUrl
 * @param {object} options
 * @returns {Promise<object>}
 */
function fetchSingleStep(currentUrl, options = {}) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(currentUrl);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const req = client.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: options.method || 'GET',
          headers: {
            'User-Agent': options.userAgent || config.defaultUserAgent,
            ...(options.headers || {})
          },
          timeout: options.timeout || config.defaultTimeout,
          rejectUnauthorized: false
        },
        (res) => {
          const location = res.headers.location || null;
          // Consume stream to free socket
          res.resume();
          resolve({
            url: currentUrl,
            statusCode: res.statusCode,
            statusText: res.statusMessage,
            location: location,
            headers: res.headers,
            isRedirect: [301, 302, 303, 307, 308].includes(res.statusCode)
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({
          url: currentUrl,
          statusCode: 408,
          statusText: 'Request Timeout',
          location: null,
          isRedirect: false,
          error: 'Timeout'
        });
      });

      req.on('error', (err) => {
        resolve({
          url: currentUrl,
          statusCode: null,
          statusText: null,
          location: null,
          isRedirect: false,
          error: err.message
        });
      });

      req.end();
    } catch (err) {
      resolve({
        url: currentUrl,
        statusCode: null,
        statusText: null,
        location: null,
        isRedirect: false,
        error: err.message
      });
    }
  });
}

/**
 * Traces the complete redirect chain for a URL
 * @param {string} initialUrl
 * @param {object} [options={}]
 * @returns {Promise<object>}
 */
export async function traceRedirects(initialUrl, options = {}) {

  const maxRedirects = options.maxRedirects || config.maxRedirects;
  const chain = [];
  const visited = new Set();

  let currentUrl = initialUrl;
  let hasLoop = false;
  let finalUrl = initialUrl;
  let isHttpToHttps = false;

  // Check if original was http
  const originalIsHttp = initialUrl.startsWith('http://');

  for (let i = 0; i <= maxRedirects; i++) {
    if (visited.has(currentUrl)) {
      hasLoop = true;
      chain.push({
        url: currentUrl,
        error: 'Redirect loop detected',
        isLoop: true
      });
      break;
    }
    visited.add(currentUrl);

    const step = await fetchSingleStep(currentUrl, options);
    chain.push(step);

    if (step.isRedirect && step.location) {
      const nextUrl = resolveUrl(step.location, currentUrl);
      if (!nextUrl) {
        break;
      }
      currentUrl = nextUrl;
      finalUrl = nextUrl;
    } else {
      finalUrl = currentUrl;
      break;
    }
  }

  // Check if initial HTTP converted to HTTPS
  if (originalIsHttp && finalUrl.startsWith('https://')) {
    isHttpToHttps = true;
  }

  const redirectCount = Math.max(0, chain.length - 1);

  return {
    initialUrl,
    finalUrl: cleanRecursiveUrl(finalUrl),
    count: redirectCount,
    hasLoop,
    isHttpToHttps,
    hasMultipleRedirects: redirectCount > 1,
    chain: chain.map(step => ({
      url: step.url,
      statusCode: step.statusCode,
      statusText: step.statusText,
      location: step.location || null,
      error: step.error || null
    }))
  };
}

export default {
  traceRedirects
};

