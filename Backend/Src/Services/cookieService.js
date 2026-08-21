/**
 * Comprehensive Cookie and Privacy Audit Service
 * @param {Array|string} setCookieHeaders
 * @param {boolean} isHttps
 * @returns {object}
 */
function auditCookies(setCookieHeaders, isHttps = true) {
  if (!setCookieHeaders) {
    return {
      count: 0,
      hasInsecureCookies: false,
      privacyScore: 100,
      rating: 'No Cookies Set',
      cookies: [],
      issues: [],
      recommendations: []
    };
  }

  const rawList = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  const cookies = [];
  const issues = [];
  const recommendations = [];

  rawList.forEach(cookieStr => {
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
    const sameSite = attrMap['samesite'] ? String(attrMap['samesite']) : null;
    const domain = attrMap['domain'] || null;
    const path = attrMap['path'] || '/';
    const expires = attrMap['expires'] || attrMap['max-age'] || null;
    const isPartitioned = !!attrMap['partitioned'];

    const cookieIssues = [];
    if (isHttps && !isSecure) {
      cookieIssues.push('Missing Secure flag on HTTPS connection');
    }
    if (!isHttpOnly) {
      cookieIssues.push('Missing HttpOnly flag (vulnerable to XSS extraction)');
    }
    if (!sameSite) {
      cookieIssues.push('Missing SameSite attribute (defaults to Lax or None)');
    } else if (sameSite.toLowerCase() === 'none' && !isSecure) {
      cookieIssues.push('SameSite=None must be paired with Secure flag');
    }

    cookies.push({
      name,
      valueLength: value.length,
      valueMasked: value.length > 8 ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : '***',
      domain,
      path,
      expires,
      secure: isSecure,
      httpOnly: isHttpOnly,
      sameSite: sameSite || 'Not Set',
      partitioned: isPartitioned,
      isCompliant: isSecure && isHttpOnly && ['strict', 'lax'].includes((sameSite || '').toLowerCase()),
      issues: cookieIssues
    });

    cookieIssues.forEach(issue => {
      issues.push({ cookie: name, issue });
    });
  });

  let privacyScore = 100;
  if (cookies.length > 0) {
    const nonCompliant = cookies.filter(c => !c.isCompliant).length;
    privacyScore = Math.max(20, Math.round(100 - (nonCompliant / cookies.length) * 60));
  }

  if (cookies.some(c => !c.secure && isHttps)) {
    recommendations.push('Add the Secure attribute to all cookies served over HTTPS');
  }
  if (cookies.some(c => !c.httpOnly)) {
    recommendations.push('Add the HttpOnly attribute to session cookies to prevent client-side JavaScript access');
  }
  if (cookies.some(c => c.sameSite === 'Not Set')) {
    recommendations.push('Explicitly configure SameSite=Lax or SameSite=Strict to defend against CSRF attacks');
  }

  return {
    count: cookies.length,
    hasInsecureCookies: issues.length > 0,
    privacyScore,
    rating: privacyScore >= 90 ? 'Excellent' : privacyScore >= 75 ? 'Good' : privacyScore >= 50 ? 'Needs Attention' : 'Insecure',
    cookies,
    issues,
    recommendations
  };
}

module.exports = {
  auditCookies
};
