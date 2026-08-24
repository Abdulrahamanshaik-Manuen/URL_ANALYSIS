import { URL } from 'url';

/**
 * Normalizes input URL by adding protocol if missing and validating.
 * @param {string} inputUrl
 * @returns {object} { valid: boolean, parsedUrl: URL|null, normalized: string, error?: string }
 */
export function normalizeUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, parsedUrl: null, normalized: '', error: 'URL is required' };
  }

  let raw = inputUrl.trim();
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
    return resolved.href;
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
  normalizeUrl,
  extractDomain,
  extractHostname,
  extractProtocol,
  resolveUrl,
  isInternalLink
};

