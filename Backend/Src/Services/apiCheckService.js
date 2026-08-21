const axios = require('axios');
const { performance } = require('perf_hooks');
const config = require('../Config/config');

/**
 * Derives simplified JSON schema descriptor from payload
 * @param {*} data
 * @returns {object}
 */
function inferSchema(data) {
  if (data === null) return { type: 'null' };
  if (Array.isArray(data)) {
    return {
      type: 'array',
      itemCount: data.length,
      itemType: data.length > 0 ? inferSchema(data[0]) : null
    };
  }
  if (typeof data === 'object') {
    const properties = {};
    Object.keys(data).forEach(key => {
      properties[key] = { type: typeof data[key] };
    });
    return {
      type: 'object',
      propertiesCount: Object.keys(data).length,
      properties
    };
  }
  return { type: typeof data };
}

/**
 * Executes a custom API Endpoint Test
 * @param {string} url
 * @param {object} options
 * @returns {Promise<object>}
 */
async function testApiEndpoint(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'User-Agent': options.userAgent || config.defaultUserAgent,
    'Accept': 'application/json, text/plain, */*',
    ...(options.headers || {})
  };

  // Handle Authentication options
  if (options.auth) {
    if (options.auth.type === 'bearer' && options.auth.token) {
      headers['Authorization'] = `Bearer ${options.auth.token}`;
    } else if (options.auth.type === 'apiKey' && options.auth.headerName && options.auth.apiKeyValue) {
      headers[options.auth.headerName] = options.auth.apiKeyValue;
    }
  }

  const axiosConfig = {
    url,
    method,
    headers,
    timeout: options.timeout || config.defaultTimeout,
    validateStatus: () => true // Do not throw on 4xx/5xx
  };

  if (['POST', 'PUT', 'PATCH'].includes(method) && options.body) {
    axiosConfig.data = options.body;
    if (typeof options.body === 'object' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  if (options.auth && options.auth.type === 'basic' && options.auth.username) {
    axiosConfig.auth = {
      username: options.auth.username,
      password: options.auth.password || ''
    };
  }

  const start = performance.now();
  try {
    const res = await axios(axiosConfig);
    const durationMs = Math.round((performance.now() - start) * 100) / 100;

    const isJson = typeof res.data === 'object' && res.data !== null;
    const bodyStr = isJson ? JSON.stringify(res.data) : (typeof res.data === 'string' ? res.data : '');
    const sizeBytes = Buffer.byteLength(bodyStr, 'utf8');

    return {
      success: true,
      url,
      method,
      statusCode: res.status,
      statusText: res.statusText,
      responseTimeMs: durationMs,
      sizeBytes,
      headers: res.headers,
      contentType: res.headers['content-type'] || null,
      isJson,
      schema: isJson ? inferSchema(res.data) : null,
      data: res.data,
      authConfigured: !!options.auth
    };
  } catch (err) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    return {
      success: false,
      url,
      method,
      responseTimeMs: durationMs,
      error: err.message,
      code: err.code || null
    };
  }
}

module.exports = {
  testApiEndpoint,
  inferSchema
};
