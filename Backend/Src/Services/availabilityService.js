const axios = require('axios');
const config = require('../Config/config');
const logger = require('../Utils/logger');

/**
 * Checks website availability, status code, HTTPS availability, and supported HTTP methods
 * @param {string} targetUrl
 * @param {object} [options={}]
 * @returns {Promise<object>}
 */
async function checkAvailability(targetUrl, options = {}) {
  const urlObj = new URL(targetUrl);
  const timeout = options.timeout || config.defaultTimeout;
  const userAgent = options.userAgent || config.defaultUserAgent;

  const result = {
    isAvailable: false,
    statusCode: null,
    statusText: null,
    protocol: urlObj.protocol.replace(':', ''),
    httpsAvailable: false,
    httpVersion: null,
    supportedMethods: [],
    error: null
  };

  // 1. Primary GET/HEAD probe
  try {
    const res = await axios.get(targetUrl, {
      timeout,
      headers: { 'User-Agent': userAgent, ...(options.headers || {}) },
      validateStatus: () => true, // capture all status codes
      maxRedirects: 5
    });

    result.isAvailable = res.status < 500;
    result.statusCode = res.status;
    result.statusText = res.statusText;
    result.httpVersion = res.request?.res?.httpVersion ? `HTTP/${res.request.res.httpVersion}` : 'HTTP/1.1';
  } catch (err) {
    result.isAvailable = false;
    result.error = err.message;
    result.statusCode = err.response ? err.response.status : null;
  }

  // 2. HTTPS Availability check if target is http
  if (urlObj.protocol === 'http:') {
    try {
      const httpsUrl = targetUrl.replace(/^http:/i, 'https:');
      const httpsRes = await axios.head(httpsUrl, {
        timeout: 4000,
        headers: { 'User-Agent': userAgent },
        validateStatus: () => true
      });
      result.httpsAvailable = httpsRes.status < 500;
    } catch (e) {
      result.httpsAvailable = false;
    }
  } else {
    result.httpsAvailable = result.isAvailable;
  }

  // 3. HTTP Methods probing (OPTIONS)
  try {
    const optRes = await axios.options(targetUrl, {
      timeout: 4000,
      headers: { 'User-Agent': userAgent },
      validateStatus: () => true
    });
    const allowHeader = optRes.headers['allow'] || optRes.headers['access-control-allow-methods'];
    if (allowHeader) {
      result.supportedMethods = allowHeader.split(',').map(m => m.trim().toUpperCase());
    } else {
      result.supportedMethods = ['GET', 'HEAD'];
    }
  } catch (e) {
    result.supportedMethods = ['GET'];
  }

  return result;
}

module.exports = {
  checkAvailability
};
