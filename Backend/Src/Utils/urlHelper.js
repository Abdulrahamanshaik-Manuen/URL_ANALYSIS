import { URL } from 'url';

export function cleanRecursiveUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return urlStr;
  let cleaned = urlStr.trim();

  try {
    const raw = /^https?:\/\//i.test(cleaned) ? cleaned : 'https://' + cleaned;
    const u = new URL(raw);

    let pathname = u.pathname;
    let search = u.search;

    // 1. Generic repeating single path segment loop (/about/about/ -> /about)
    pathname = pathname.replace(/(\/[^/]+)\1+/gi, '$1');

    // 2. Generic repeating dual path segment loop (/cat/item/cat/item/ -> /cat/item)
    pathname = pathname.replace(/(\/[^/]+\/[^/]+)\1+/gi, '$1');

    // 3. Path depth ceiling (max 8 subpaths)
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 8) {
      pathname = '/' + segments.slice(0, 8).join('/');
    }

    // 4. Generic query string loop & server rewrite artifact cleaning (/?/&/and~, /?/, /&/, duplicate query keys)
    search = search.replace(/(\/\?\/&.*|\/\?\/.*|\/&\/.*|~?and~?.*)/gi, '');
    pathname = pathname.replace(/(\/\?\/&.*|\/\?\/.*|\/&\/.*|~?and~?.*)/gi, '');

    if (search && search.length > 1) {
      const params = new URLSearchParams(search);
      const counts = {};
      const cleanParams = new URLSearchParams();
      for (const [k, v] of params.entries()) {
        counts[k] = (counts[k] || 0) + 1;
        if (counts[k] <= 2) {
          cleanParams.append(k, v);
        }
      }
      search = cleanParams.toString() ? '?' + cleanParams.toString() : '';
    }

    u.pathname = pathname;
    u.search = search;
    let res = u.href.replace(/[?&]+$/, '');
    if (res.endsWith('/') && res.split('/').length > 4) {
      res = res.replace(/\/+$/, '');
    }
    return res;
  } catch (e) {
    return cleaned.replace(/(\/\?\/&.*|\/\?\/.*|\/&\/.*|~?and~?.*)/gi, '').replace(/[?&]+$/, '');
  }
}

/**
 * Normalizes input URL by adding protocol if missing and validating.
 * @param {string} inputUrl
 * @returns {object} { valid: boolean, parsedUrl: URL|null, normalized: string, error?: string }
 */
export function normalizeUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, parsedUrl: null, normalized: '', error: 'URL is required' };
  }

  let raw = cleanRecursiveUrl(inputUrl.trim());
  if (!/^https?:\/\//i.test(raw)) {
    raw = 'https://' + raw;
  }

  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, parsedUrl: null, normalized: '', error: 'Only HTTP and HTTPS protocols are supported' };
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      // allow localhost or IP addresses
      if (parsed.hostname !== 'localhost' && !/^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname)) {
        return { valid: false, parsedUrl: null, normalized: '', error: 'Invalid hostname format' };
      }
    }
    return {
      valid: true,
      parsedUrl: parsed,
      normalized: parsed.href,
      protocol: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      pathname: parsed.pathname,
      search: parsed.search,
      origin: parsed.origin
    };
  } catch (err) {
    return { valid: false, parsedUrl: null, normalized: '', error: err.message || 'Malformed URL' };
  }
}

/**
 * Extracts clean domain name without www prefix
 * @param {string} inputUrl 
 * @returns {string}
 */
export function extractDomain(inputUrl) {
  try {
    const raw = typeof inputUrl === 'string' ? inputUrl : (inputUrl?.normalized || '');
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
    return parsed.hostname.replace(/^www\./i, '');
  } catch (e) {
    return 'unknown';
  }
}

/**
 * Extracts hostname with subdomains
 * @param {string} inputUrl 
 * @returns {string}
 */
export function extractHostname(inputUrl) {
  try {
    const raw = typeof inputUrl === 'string' ? inputUrl : (inputUrl?.normalized || '');
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
    return parsed.hostname;
  } catch (e) {
    return 'unknown';
  }
}

/**
 * Extracts protocol (http: or https:)
 * @param {string} inputUrl 
 * @returns {string}
 */
export function extractProtocol(inputUrl) {
  try {
    const raw = typeof inputUrl === 'string' ? inputUrl : (inputUrl?.normalized || '');
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
    return parsed.protocol === 'http:' ? 'http:' : 'https:';
  } catch (e) {
    return 'https:';
  }
}

/**
 * Resolves a target link against a base URL
 * @param {string} href
 * @param {string} baseUrl
 * @returns {string|null}
 */
export function resolveUrl(href, baseUrl) {
  if (!href || typeof href !== 'string') return null;
  const trimmed = href.trim();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:') || trimmed.startsWith('#')) {
    return null;
  }
  try {
    const resolved = new URL(trimmed, baseUrl);
    return cleanRecursiveUrl(resolved.href);
  } catch (e) {
    return null;
  }
}

/**
 * Checks if a target URL belongs to the same domain/host as baseOrigin
 * @param {string} targetUrl
 * @param {string} baseOrigin
 * @returns {boolean}
 */
export function isInternalLink(targetUrl, baseOrigin) {
  try {
    const target = new URL(targetUrl);
    const base = new URL(baseOrigin);
    return target.hostname === base.hostname;
  } catch (e) {
    return false;
  }
}

export default {
  cleanRecursiveUrl,
  normalizeUrl,
  extractDomain,
  extractHostname,
  extractProtocol,
  resolveUrl,
  isInternalLink
};

