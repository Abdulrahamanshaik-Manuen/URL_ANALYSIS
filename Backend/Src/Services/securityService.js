import * as cheerio from 'cheerio';



/**
 * Parses Set-Cookie header strings into structured cookie audit objects
 * @param {Array|string} setCookieHeaders
 * @returns {Array<object>}
 */
function parseCookies(setCookieHeaders) {
  if (!setCookieHeaders) return [];
  const rawList = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];

  return rawList.map(cookieStr => {
    const parts = cookieStr.split(';').map(p => p.trim());
    const [nameVal, ...attrs] = parts;
    const eqIdx = nameVal.indexOf('=');
    const name = eqIdx > -1 ? nameVal.substring(0, eqIdx) : nameVal;
    const value = eqIdx > -1 ? nameVal.substring(eqIdx + 1) : '';

    const attrMap = {};
    attrs.forEach(a => {
      const idx = a.indexOf('=');
      if (idx > -1) {
        attrMap[a.substring(0, idx).toLowerCase()] = a.substring(idx + 1);
      } else {
        attrMap[a.toLowerCase()] = true;
      }
    });

    const isSecure = !!attrMap['secure'];
    const isHttpOnly = !!attrMap['httponly'];
    const sameSite = attrMap['samesite'] || 'Not Set';

    return {
      name,
      valueLength: value.length,
      secure: isSecure,
      httpOnly: isHttpOnly,
      sameSite,
      hasProperFlags: isSecure && isHttpOnly && ['strict', 'lax'].includes(sameSite.toLowerCase())
    };
  });
}

/**
 * Checks for mixed content in HTML when page is HTTPS
 * @param {string} html
 * @param {boolean} isHttps
 * @returns {object}
 */
function checkMixedContent(html, isHttps) {
  if (!isHttps || !html) {
    return { hasMixedContent: false, count: 0, items: [] };
  }

  const $ = cheerio.load(html);
  const mixedItems = [];

  // Inspect scripts, links, images, iframes, audio, video
  $('script[src^="http://"]').each((_, el) => {
    mixedItems.push({ type: 'script', url: $(el).attr('src') });
  });

  $('link[href^="http://"][rel="stylesheet"]').each((_, el) => {
    mixedItems.push({ type: 'stylesheet', url: $(el).attr('href') });
  });

  $('img[src^="http://"]').each((_, el) => {
    mixedItems.push({ type: 'image', url: $(el).attr('src') });
  });

  $('iframe[src^="http://"]').each((_, el) => {
    mixedItems.push({ type: 'iframe', url: $(el).attr('src') });
  });

  $('audio[src^="http://"], video[src^="http://"]').each((_, el) => {
    mixedItems.push({ type: 'media', url: $(el).attr('src') });
  });

  return {
    hasMixedContent: mixedItems.length > 0,
    count: mixedItems.length,
    items: mixedItems.slice(0, 50)
  };
}

/**
 * Analyzes response headers, cookies, and HTML for security practices
 * @param {object} headers
 * @param {string} html
 * @param {string} targetUrl
 * @returns {object}
 */
function analyzeSecurity(headers = {}, html = '', targetUrl = '') {
  const isHttps = targetUrl.startsWith('https://');
  const lowerHeaders = {};
  Object.keys(headers).forEach(k => {
    lowerHeaders[k.toLowerCase()] = headers[k];
  });

  // 1. Headers Check
  const hsts = lowerHeaders['strict-transport-security'];
  const csp = lowerHeaders['content-security-policy'];
  const xfo = lowerHeaders['x-frame-options'];
  const xcto = lowerHeaders['x-content-type-options'];
  const referrerPolicy = lowerHeaders['referrer-policy'];
  const permissionsPolicy = lowerHeaders['permissions-policy'] || lowerHeaders['feature-policy'];
  const cors = lowerHeaders['access-control-allow-origin'];
  const server = lowerHeaders['server'];
  const xPoweredBy = lowerHeaders['x-powered-by'];
  const coop = lowerHeaders['cross-origin-opener-policy'];
  const corp = lowerHeaders['cross-origin-resource-policy'];

  const headerChecks = {
    hsts: {
      name: 'Strict-Transport-Security (HSTS)',
      present: !!hsts,
      value: hsts || null,
      score: hsts ? 15 : 0,
      includesSubDomains: hsts ? /includesubdomains/i.test(hsts) : false,
      preload: hsts ? /preload/i.test(hsts) : false,
      recommendation: hsts ? null : 'Enable HSTS to prevent SSL stripping attacks'
    },
    csp: {
      name: 'Content-Security-Policy (CSP)',
      present: !!csp,
      value: csp ? (csp.length > 120 ? csp.substring(0, 120) + '...' : csp) : null,
      score: csp ? 25 : 0,
      recommendation: csp ? null : 'Implement CSP to mitigate XSS and data injection attacks'
    },
    xFrameOptions: {
      name: 'X-Frame-Options',
      present: !!xfo,
      value: xfo || null,
      score: xfo ? 15 : 0,
      recommendation: xfo ? null : 'Set X-Frame-Options to DENY or SAMEORIGIN to prevent clickjacking'
    },
    xContentTypeOptions: {
      name: 'X-Content-Type-Options',
      present: !!xcto,
      value: xcto || null,
      score: xcto && xcto.toLowerCase().includes('nosniff') ? 10 : 0,
      recommendation: xcto ? null : 'Set X-Content-Type-Options: nosniff to prevent MIME sniffing'
    },
    referrerPolicy: {
      name: 'Referrer-Policy',
      present: !!referrerPolicy,
      value: referrerPolicy || null,
      score: referrerPolicy ? 10 : 0,
      recommendation: referrerPolicy ? null : 'Define Referrer-Policy to protect user privacy'
    },
    permissionsPolicy: {
      name: 'Permissions-Policy',
      present: !!permissionsPolicy,
      value: permissionsPolicy || null,
      score: permissionsPolicy ? 10 : 0,
      recommendation: permissionsPolicy ? null : 'Configure Permissions-Policy to restrict browser features'
    },
    cors: {
      name: 'CORS (Access-Control-Allow-Origin)',
      present: !!cors,
      value: cors || null,
      isWildcard: cors === '*',
      score: cors ? 5 : 0
    },
    infoLeakage: {
      serverHeader: server || null,
      xPoweredByHeader: xPoweredBy || null,
      leakingInfo: !!(server || xPoweredBy),
      recommendation: (server || xPoweredBy) ? 'Hide server version headers (Server, X-Powered-By) to prevent recon' : null
    }
  };

  // 2. Cookie Audit
  const cookies = parseCookies(headers['set-cookie']);

  // 3. Mixed Content Scan
  const mixedContent = checkMixedContent(html, isHttps);

  // 4. Calculate Security Score (0 - 100)
  let securityScore = 0;
  securityScore += headerChecks.hsts.score;
  securityScore += headerChecks.csp.score;
  securityScore += headerChecks.xFrameOptions.score;
  securityScore += headerChecks.xContentTypeOptions.score;
  securityScore += headerChecks.referrerPolicy.score;
  securityScore += headerChecks.permissionsPolicy.score;
  if (isHttps) securityScore += 10;
  if (!mixedContent.hasMixedContent) securityScore += 5;
  if (!headerChecks.infoLeakage.leakingInfo) securityScore += 5;

  securityScore = Math.min(100, Math.max(0, securityScore));

  return {
    securityScore,
    isHttps,
    headers: headerChecks,
    cookies: {
      count: cookies.length,
      list: cookies
    },
    mixedContent,
    rating: securityScore >= 80 ? 'Strong' : securityScore >= 50 ? 'Moderate' : 'Weak'
  };
}

export {
  analyzeSecurity,
  parseCookies,
  checkMixedContent
};

export default {
  analyzeSecurity,
  parseCookies,
  checkMixedContent
};

