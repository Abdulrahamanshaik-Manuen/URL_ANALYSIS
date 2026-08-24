/**
 * Calculates overall and domain-specific health scores (0 - 100)
 * @param {object} results
 * @returns {object}
 */
function calculateScores(results) {
  let availabilityScore = 0;
  let performanceScore = 100;
  let securityScore = 0;
  let seoScore = 0;
  let a11yScore = 100;

  // 1. Availability Score
  if (results.availability) {
    if (results.availability.isAvailable) {
      availabilityScore = 100;
      if (results.availability.statusCode >= 400 && results.availability.statusCode < 500) {
        availabilityScore = 50;
      } else if (results.availability.statusCode >= 500) {
        availabilityScore = 20;
      }
    }
  }

  // 2. Performance Score
  if (results.performance) {
    const ttfb = results.performance.ttfb || 0;
    const totalTime = results.performance.totalTime || 0;

    if (ttfb > 1800) performanceScore -= 30;
    else if (ttfb > 800) performanceScore -= 15;
    else if (ttfb > 400) performanceScore -= 5;

    if (totalTime > 4000) performanceScore -= 30;
    else if (totalTime > 2000) performanceScore -= 15;
    else if (totalTime > 1000) performanceScore -= 5;

    if (results.browser && results.browser.metrics && results.browser.metrics.pageLoadTimeMs) {
      if (results.browser.metrics.pageLoadTimeMs > 5000) performanceScore -= 15;
    }
    performanceScore = Math.max(10, Math.min(100, performanceScore));
  }

  // 3. Security Score
  if (results.security) {
    securityScore = results.security.securityScore !== undefined ? results.security.securityScore : 50;
    if (results.ssl && !results.ssl.valid) {
      securityScore = Math.max(0, securityScore - 40);
    }
  }

  // 4. SEO Score
  if (results.seo) {
    let score = 0;
    if (results.seo.title && results.seo.title.text) score += 20;
    if (results.seo.metaDescription && results.seo.metaDescription.text) score += 20;
    if (results.seo.headings && results.seo.headings.h1 && results.seo.headings.h1.count > 0) score += 20;
    if (results.seo.canonical && results.seo.canonical.url) score += 15;
    if (results.seo.robotsTxt && results.seo.robotsTxt.found) score += 10;
    if (results.seo.sitemap && results.seo.sitemap.found) score += 10;
    if (results.seo.openGraph && Object.keys(results.seo.openGraph).length > 0) score += 5;
    seoScore = score;
  }

  // 5. Accessibility Score
  if (results.accessibility) {
    a11yScore = results.accessibility.score;
  }

  const overallScore = Math.round(
    (availabilityScore * 0.25) +
    (performanceScore * 0.20) +
    (securityScore * 0.20) +
    (seoScore * 0.20) +
    (a11yScore * 0.15)
  );

  return {
    overall: overallScore,
    availability: availabilityScore,
    performance: performanceScore,
    security: securityScore,
    seo: seoScore,
    accessibility: a11yScore,
    rating: overallScore >= 90 ? 'Excellent' : overallScore >= 75 ? 'Good' : overallScore >= 50 ? 'Fair' : 'Poor'
  };
}

/**
 * Compiles issues, warnings, and passed audits across all 18 domains
 * @param {object} results
 * @returns {object}
 */
function compileDiagnostics(results) {
  const criticalIssues = [];
  const warnings = [];
  const passedChecks = [];
  const recommendations = [];

  // Availability
  if (results.availability) {
    if (!results.availability.isAvailable) {
      criticalIssues.push({ domain: 'HTTP / Status', title: 'Target Website Is Offline or Unreachable', desc: `Status: ${results.availability.statusCode || 'No Response'}` });
    } else {
      passedChecks.push({ domain: 'HTTP / Status', title: `Website is online (Status ${results.availability.statusCode})` });
    }
  }

  // Console / JS runtime errors
  if (results.browser) {
    const jsErrors = results.browser.jsErrors || [];
    if (jsErrors.length > 0) {
      criticalIssues.push({
        domain: 'Console Errors',
        title: `${jsErrors.length} Uncaught JavaScript Exception(s) Detected`,
        desc: jsErrors[0].message
      });
      recommendations.push('Fix unhandled JavaScript runtime exceptions in client scripts');
    } else {
      passedChecks.push({ domain: 'Console Errors', title: 'Zero unhandled JavaScript exceptions in browser runtime' });
    }

    const failedReqs = results.browser.failedRequests || [];
    if (failedReqs.length > 0) {
      warnings.push({
        domain: 'Network',
        title: `${failedReqs.length} Network Request(s) Failed During Page Load`,
        desc: `${failedReqs[0].url} (${failedReqs[0].failure})`
      });
    }

    const httpErrors = results.browser.httpErrors || [];
    if (httpErrors.length > 0) {
      warnings.push({
        domain: 'HTTP Errors',
        title: `${httpErrors.length} HTTP 4xx/5xx Responses Encountered in Browser Traffic`,
        desc: `${httpErrors[0].status} ${httpErrors[0].statusText} on ${httpErrors[0].url}`
      });
    }
  }

  // SSL & Security
  if (results.ssl) {
    if (!results.ssl.valid) {
      criticalIssues.push({ domain: 'Security', title: 'Invalid or Expired SSL Certificate', desc: results.ssl.error || 'SSL validation failed' });
      recommendations.push('Renew or fix SSL certificate immediately');
    } else {
      passedChecks.push({ domain: 'Security', title: `Valid SSL Certificate (Expires in ${results.ssl.daysRemaining} days)` });
    }
  }

  if (results.security) {
    const h = results.security.headers || {};
    if (!h.hsts?.present) warnings.push({ domain: 'Security', title: 'Missing Strict-Transport-Security (HSTS) Header' });
    if (!h.csp?.present) warnings.push({ domain: 'Security', title: 'Missing Content-Security-Policy (CSP) Header' });
    if (!h.xfo?.present) warnings.push({ domain: 'Security', title: 'Missing X-Frame-Options Header (Clickjacking Risk)' });
    if (results.security.mixedContent?.hasMixedContent) {
      criticalIssues.push({ domain: 'Security', title: `Mixed Content Detected (${results.security.mixedContent.count} insecure HTTP resources on HTTPS)` });
    }
  }

  // SEO & Headings
  if (results.seo) {
    if (!results.seo.title?.text) {
      warnings.push({ domain: 'SEO', title: 'Missing <title> Tag' });
      recommendations.push('Add an SEO-friendly <title> tag (50-60 characters)');
    }
    if (!results.seo.metaDescription?.text) {
      warnings.push({ domain: 'SEO', title: 'Missing Meta Description Tag' });
      recommendations.push('Add a meta description (120-160 characters)');
    }
    if (results.seo.headings?.h1?.count === 0) {
      warnings.push({ domain: 'Content / SEO', title: 'Missing H1 Heading Tag' });
      recommendations.push('Include exactly one <h1> heading on the page for SEO hierarchy');
    }
  }

  // Accessibility
  if (results.accessibility) {
    (results.accessibility.issues || []).forEach(iss => {
      if (iss.severity === 'high') {
        criticalIssues.push({ domain: 'Accessibility', title: iss.title, desc: iss.description });
      } else {
        warnings.push({ domain: 'Accessibility', title: iss.title, desc: iss.description });
      }
    });
  }

  // Broken Links & Resources
  if (results.links && results.links.broken && results.links.broken.length > 0) {
    warnings.push({
      domain: 'Links',
      title: `${results.links.broken.length} Broken Link(s) Found`,
      desc: `Broken link to: ${results.links.broken[0].url}`
    });
    recommendations.push('Review and update broken links on your website');
  }

  if (results.resources && results.resources.broken && results.resources.broken.length > 0) {
    warnings.push({
      domain: 'Images / Assets',
      title: `${results.resources.broken.length} Broken Resource(s) Found (404/500)`,
      desc: `Failed resource: ${results.resources.broken[0].url}`
    });
    recommendations.push('Fix missing image, stylesheet, or script asset references');
  }

  // Mobile
  if (results.browser && results.browser.viewports) {
    if (results.browser.viewports.mobile?.overflow) {
      warnings.push({ domain: 'Responsive', title: 'Mobile Viewport Horizontal Overflow Detected', desc: 'Content exceeds screen width on mobile (390px)' });
      recommendations.push('Ensure CSS layout fits within mobile screen width without horizontal scroll');
    } else {
      passedChecks.push({ domain: 'Responsive', title: 'Mobile layout fits properly without horizontal overflow' });
    }
  }

  return {
    criticalIssues,
    warnings,
    passedChecks,
    recommendations: [...new Set(recommendations)]
  };
}

/**
 * Standard API response wrapper
 */
function formatAnalysisResponse(url, results, executionTimeMs) {
  const scores = calculateScores(results);
  const diagnostics = compileDiagnostics(results);

  return {
    success: true,
    targetUrl: url,
    timestamp: new Date().toISOString(),
    executionTimeMs,
    scores,
    summary: {
      isAvailable: results.availability ? results.availability.isAvailable : false,
      statusCode: results.availability ? results.availability.statusCode : null,
      statusText: results.availability ? results.availability.statusText : null,
      httpVersion: results.availability ? results.availability.httpVersion : null,
      responseTimeMs: results.performance ? results.performance.totalTime : null,
      sslValid: results.ssl ? results.ssl.valid : null,
      sslDaysRemaining: results.ssl ? results.ssl.daysRemaining : null,
      redirectCount: results.redirects ? results.redirects.count : 0,
      jsErrorsCount: results.browser && results.browser.jsErrors ? results.browser.jsErrors.length : 0,
      failedRequestsCount: results.browser && results.browser.failedRequests ? results.browser.failedRequests.length : 0,
      httpErrorsCount: results.browser && results.browser.httpErrors ? results.browser.httpErrors.length : 0,
      brokenLinksCount: results.links && results.links.broken ? results.links.broken.length : 0,
      brokenResourcesCount: results.resources && results.resources.broken ? results.resources.broken.length : 0,
      technologiesCount: results.technology ? results.technology.count : 0,
      a11yIssuesCount: results.accessibility ? results.accessibility.totalIssues : 0
    },
    diagnostics,
    checks: results
  };
}

export {
  calculateScores,
  compileDiagnostics,
  formatAnalysisResponse
};

export default {
  calculateScores,
  compileDiagnostics,
  formatAnalysisResponse
};

