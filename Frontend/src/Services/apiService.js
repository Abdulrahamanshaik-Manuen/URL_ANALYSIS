/**
 * URL Analysis & Website Inspector API Client
 * Uses dynamic relative endpoints with direct 127.0.0.1 fallback to guarantee 100% uptime.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Smart fetch helper that falls back directly to 127.0.0.1:5000 if proxy returns 500/502/504
 */
async function smartFetch(endpoint, options = {}) {
  try {
    const primaryUrl = `${API_BASE}${endpoint}`;
    const res = await fetch(primaryUrl, options);
    if (!res.ok && (res.status === 500 || res.status === 502 || res.status === 504)) {
      const fallbackUrl = `http://127.0.0.1:5000${endpoint}`;
      const fallbackRes = await fetch(fallbackUrl, options).catch(() => null);
      if (fallbackRes && fallbackRes.ok) return fallbackRes;
    }
    return res;
  } catch (err) {
    const fallbackUrl = `http://127.0.0.1:5000${endpoint}`;
    return fetch(fallbackUrl, options);
  }
}

/**
 * Safely parse JSON or text response from fetch Response object
 */
async function parseResponseBody(response) {
  try {
    const text = await response.text();
    if (!text || !text.trim()) {
      return {};
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      return { rawText: text };
    }
  } catch (e) {
    return {};
  }
}

/**
 * Fetch past audit reports list from MongoDB Atlas
 */
export async function fetchAuditHistory() {
  try {
    const res = await smartFetch('/api/history', { method: 'GET' });
    const json = await parseResponseBody(res);
    return json.reports || [];
  } catch (err) {
    console.error('Error fetching audit history:', err.message);
    return [];
  }
}

/**
 * Fetch full report details by ID from MongoDB Atlas
 */
export async function fetchReportById(reportId) {
  const res = await smartFetch(`/api/history/${reportId}`, { method: 'GET' });
  const json = await parseResponseBody(res);
  if (!res.ok || !json.report) {
    throw new Error(json.message || 'Report not found in MongoDB Atlas');
  }
  return json.report;
}

/**
 * Delete an audit report from MongoDB Atlas
 */
export async function deleteAuditReport(reportId) {
  const res = await smartFetch(`/api/history/${reportId}`, { method: 'DELETE' });
  const json = await parseResponseBody(res);
  if (!res.ok) {
    throw new Error(json.message || 'Failed to delete report from MongoDB Atlas');
  }
  return json;
}

/**
 * Fetch user preferences from MongoDB Atlas
 */
export async function fetchMongoDBPreferences() {
  try {
    const res = await smartFetch('/api/preferences', { method: 'GET' });
    const json = await parseResponseBody(res);
    return json.preferences || null;
  } catch (err) {
    console.error('Error fetching MongoDB preferences:', err.message);
    return null;
  }
}

/**
 * Save user preferences to MongoDB Atlas
 */
export async function saveMongoDBPreferences(preferencesPayload) {
  try {
    const res = await smartFetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferencesPayload)
    });
    const json = await parseResponseBody(res);
    return json.preferences || null;
  } catch (err) {
    console.error('Error saving MongoDB preferences:', err.message);
    return null;
  }
}

/**
 * Health check endpoint
 */
export async function checkBackendHealth() {
  try {
    const res = await smartFetch('/api/health', { method: 'GET' });
    const data = await parseResponseBody(res);
    if (!res.ok) return { status: 'offline', error: data.message || data.error || `Status ${res.status}` };
    return { status: 'online', data };
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

/**
 * Full Composite Analysis
 * @param {string} url
 * @param {object} options
 * @param {object} advanced
 */
export async function analyzeWebsite(url, options = {}, advanced = {}) {
  const response = await smartFetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, options, advanced })
  });

  const json = await parseResponseBody(response);
  if (!response.ok) {
    const errMsg = json.message || json.error || (json.rawText ? json.rawText.slice(0, 150) : null) || `Analysis failed with HTTP ${response.status}`;
    throw new Error(errMsg);
  }
  return json;
}

/**
 * Real-time SSE Streaming Analysis
 * @param {string} url
 * @param {object} options
 * @param {object} advanced
 * @param {Function} onProgress
 * @param {Function} onDone
 * @param {Function} onError
 */
export function streamAnalyzeWebsite(url, options = {}, advanced = {}, onProgress, onDone, onError) {
  const controller = new AbortController();

  smartFetch('/api/analyze/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, options, advanced }),
    signal: controller.signal
  })
    .then(async (res) => {
      if (!res.ok) {
        const errorJson = await parseResponseBody(res);
        const errMsg = errorJson.message || errorJson.error || (errorJson.rawText ? errorJson.rawText.slice(0, 150) : null) || `Stream failed with HTTP ${res.status}`;
        throw new Error(errMsg);
      }

      if (!res.body) {
        throw new Error('Readable stream body is not supported');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;
          const eventMatch = block.match(/^event:\s*(.+)$/m);
          const dataMatch = block.match(/^data:\s*(.+)$/m);

          const eventName = eventMatch ? eventMatch[1].trim() : 'message';
          const rawData = dataMatch ? dataMatch[1].trim() : null;

          if (rawData) {
            try {
              const parsed = JSON.parse(rawData);
              if (eventName === 'progress' && onProgress) {
                onProgress(parsed);
              } else if (eventName === 'done' && onDone) {
                onDone(parsed);
              } else if (eventName === 'error' && onError) {
                onError(new Error(parsed.error || parsed.message || 'Unknown stream error'));
              }
            } catch (e) {
              console.warn('SSE Parse warning:', e);
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError' && onError) {
        onError(err);
      }
    });

  return () => controller.abort();
}

/**
 * Dedicated API Endpoint Tester
 * @param {string} url
 * @param {object} params
 */
export async function testApiEndpoint(url, params = {}) {
  const response = await smartFetch('/api/api-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      method: params.method || 'GET',
      headers: params.headers || {},
      body: params.body || null,
      auth: params.auth || null
    })
  });

  const json = await parseResponseBody(response);
  if (!response.ok) {
    const errMsg = json.message || json.error || (json.rawText ? json.rawText.slice(0, 150) : null) || `API check failed with HTTP ${response.status}`;
    throw new Error(errMsg);
  }
  return json;
}

/**
 * Real-time SSE Streaming Full Website Crawl
 * @param {string} url
 * @param {number} maxPages
 * @param {Function} onProgress
 * @param {Function} onDone
 * @param {Function} onError
 */
export function streamCrawlWebsite(url, maxPages = 25, onProgress, onDone, onError) {
  const controller = new AbortController();

  smartFetch('/api/crawl/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, maxPages }),
    signal: controller.signal
  })
    .then(async (res) => {
      if (!res.ok) {
        const errorJson = await parseResponseBody(res);
        const errMsg = errorJson.message || errorJson.error || (errorJson.rawText ? errorJson.rawText.slice(0, 150) : null) || `Crawl failed with HTTP ${res.status}`;
        throw new Error(errMsg);
      }

      if (!res.body) {
        throw new Error('Readable stream body is not supported');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;
          const eventMatch = block.match(/^event:\s*(.+)$/m);
          const dataMatch = block.match(/^data:\s*(.+)$/m);

          const eventName = eventMatch ? eventMatch[1].trim() : 'message';
          const rawData = dataMatch ? dataMatch[1].trim() : null;

          if (rawData) {
            try {
              const parsed = JSON.parse(rawData);
              if (eventName === 'done' && onDone) {
                onDone(parsed);
              } else if (eventName === 'error' && onError) {
                onError(new Error(parsed.error || parsed.message || 'Unknown crawl error'));
              } else if (onProgress) {
                onProgress({ event: eventName, data: parsed });
              }
            } catch (e) {
              console.warn('SSE Crawl parse warning:', e);
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError' && onError) {
        onError(err);
      }
    });

  return () => controller.abort();
}

/**
 * Standard Full Website Crawl
 */
export async function crawlWebsite(url, maxPages = 25) {
  const response = await smartFetch('/api/crawl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, maxPages })
  });

  const json = await parseResponseBody(response);
  if (!response.ok) {
    const errMsg = json.message || json.error || (json.rawText ? json.rawText.slice(0, 150) : null) || `Crawl failed with HTTP ${response.status}`;
    throw new Error(errMsg);
  }
  return json;
}

/**
 * Quick Micro-Check (dns, ssl, ping, security)
 * @param {string} type
 * @param {string} url
 */
export async function runQuickCheck(type, url) {
  const response = await smartFetch(`/api/quick-check/${type}?url=${encodeURIComponent(url)}`, {
    method: 'GET'
  });

  const json = await parseResponseBody(response);
  if (!response.ok) {
    const errMsg = json.message || json.error || (json.rawText ? json.rawText.slice(0, 150) : null) || `Quick check failed with HTTP ${response.status}`;
    throw new Error(errMsg);
  }
  return json;
}

