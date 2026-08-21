const {
  CheckResult,
  ConsoleError,
  NetworkError,
  HttpError,
  LinkCheck,
  PerformanceResult,
  SecurityResult,
  SeoResult,
  AccessibilityResult,
  TechnologyResult
} = require('../Models');
const logger = require('../Utils/logger');

/**
 * Persists all granular audit findings into separate normalized MongoDB collections
 * @param {object} scan The saved Scan document
 * @param {object} rawResults Raw outputs from all 18 check analyzers
 * @param {object} scores Computed domain scores
 */
async function persistScanResults(scan, rawResults, scores) {
  const scanId = scan._id;
  const websiteId = scan.websiteId;

  const {
    http = {},
    browser = {},
    security = {},
    ssl = {},
    seo = {},
    content = {},
    accessibility = {},
    links = {},
    resources = {},
    technology = {},
    cookies = {},
    robotsSitemap = {}
  } = rawResults;

  const persistencePromises = [];

  // 1. Persist CheckResults (Granular pass/warn/fail checks across domains)
  const checkDocs = [];

  // HTTP Domain Check
  checkDocs.push({
    scanId,
    websiteId,
    checkName: 'HTTP Availability',
    domain: 'http',
    status: http.statusCode >= 200 && http.statusCode < 400 ? 'passed' : 'failed',
    severity: 'critical',
    score: scores.http,
    message: http.statusCode ? `Server responded with HTTP ${http.statusCode} ${http.statusText || ''}` : 'Server is unreachable',
    actual: http.statusCode,
    expected: 200,
    durationMs: http.responseTimeMs
  });

  // SSL Domain Check
  checkDocs.push({
    scanId,
    websiteId,
    checkName: 'SSL / TLS Certificate Validity',
    domain: 'security',
    status: ssl.valid ? 'passed' : 'failed',
    severity: 'high',
    score: ssl.valid ? 100 : 0,
    message: ssl.valid ? `Valid certificate issued by ${ssl.issuer?.commonName || 'Trusted CA'}` : (ssl.error || 'SSL/TLS certificate invalid or missing'),
    actual: ssl.valid,
    expected: true
  });

  // Console Errors Domain Check
  const totalConsoleErrors = (browser.jsErrors?.length || 0) + (browser.consoleMessages?.errors?.length || 0);
  checkDocs.push({
    scanId,
    websiteId,
    checkName: 'JavaScript Runtime & Console Errors',
    domain: 'console',
    status: totalConsoleErrors === 0 ? 'passed' : (totalConsoleErrors < 3 ? 'warning' : 'failed'),
    severity: totalConsoleErrors > 0 ? 'high' : 'info',
    score: scores.console,
    message: totalConsoleErrors === 0 ? 'Zero JavaScript runtime errors caught' : `Found ${totalConsoleErrors} runtime / console error(s)`,
    actual: totalConsoleErrors,
    expected: 0
  });

  // Network Failure Domain Check
  const failedReqCount = browser.failedRequests?.length || 0;
  checkDocs.push({
    scanId,
    websiteId,
    checkName: 'Network Resource Requests',
    domain: 'network',
    status: failedReqCount === 0 ? 'passed' : 'warning',
    severity: failedReqCount > 0 ? 'medium' : 'info',
    score: scores.network,
    message: failedReqCount === 0 ? 'All network requests succeeded' : `${failedReqCount} network request(s) failed`,
    actual: failedReqCount,
    expected: 0
  });

  // SEO Title & Description Checks
  checkDocs.push({
    scanId,
    websiteId,
    checkName: 'SEO Page Title',
    domain: 'seo',
    status: seo.title ? 'passed' : 'failed',
    severity: 'medium',
    score: seo.title ? 100 : 0,
    message: seo.title ? `Title present: "${seo.title.slice(0, 60)}..."` : 'Missing <title> tag in HTML head',
    actual: seo.title,
    expected: 'Descriptive title tag'
  });

  checkDocs.push({
    scanId,
    websiteId,
    checkName: 'SEO Meta Description',
    domain: 'seo',
    status: seo.metaDescription ? 'passed' : 'warning',
    severity: 'low',
    score: seo.metaDescription ? 100 : 0,
    message: seo.metaDescription ? 'Meta description is configured' : 'Missing meta description tag',
    actual: seo.metaDescription,
    expected: 'Meta description'
  });

  // Accessibility Check
  const a11yIssueCount = accessibility.findings?.length || 0;
  checkDocs.push({
    scanId,
    websiteId,
    checkName: 'WCAG Accessibility Standards',
    domain: 'accessibility',
    status: a11yIssueCount === 0 ? 'passed' : 'warning',
    severity: a11yIssueCount > 5 ? 'high' : 'low',
    score: scores.accessibility,
    message: a11yIssueCount === 0 ? 'No accessibility defects detected' : `Found ${a11yIssueCount} accessibility issue(s)`,
    actual: a11yIssueCount,
    expected: 0
  });

  if (checkDocs.length > 0) {
    persistencePromises.push(CheckResult.insertMany(checkDocs, { ordered: false }).catch(err => logger.warn(`CheckResult insert error: ${err.message}`)));
  }

  // 2. Persist Console Errors
  const consoleErrorDocs = [];
  browser.jsErrors?.forEach(err => {
    consoleErrorDocs.push({
      scanId,
      websiteId,
      type: 'error',
      message: err.message,
      location: { url: scan.url },
      source: 'playwright-pageerror',
      timestamp: err.timestamp || new Date()
    });
  });
  browser.consoleMessages?.errors?.forEach(err => {
    consoleErrorDocs.push({
      scanId,
      websiteId,
      type: 'error',
      message: err.text,
      location: { url: err.location },
      source: 'browser-console',
      timestamp: new Date()
    });
  });
  browser.consoleMessages?.warnings?.forEach(warn => {
    consoleErrorDocs.push({
      scanId,
      websiteId,
      type: 'warning',
      message: warn.text,
      location: { url: warn.location },
      source: 'browser-console',
      timestamp: new Date()
    });
  });
  if (consoleErrorDocs.length > 0) {
    persistencePromises.push(ConsoleError.insertMany(consoleErrorDocs, { ordered: false }).catch(err => logger.warn(`ConsoleError insert error: ${err.message}`)));
  }

  // 3. Persist Network Errors
  if (browser.failedRequests?.length > 0) {
    const networkDocs = browser.failedRequests.map(req => ({
      scanId,
      websiteId,
      url: req.url,
      method: req.method,
      resourceType: req.resourceType,
      failureReason: req.failure
    }));
    persistencePromises.push(NetworkError.insertMany(networkDocs, { ordered: false }).catch(err => logger.warn(`NetworkError insert error: ${err.message}`)));
  }

  // 4. Persist HTTP 4xx/5xx Errors
  if (browser.httpErrors?.length > 0) {
    const httpErrorDocs = browser.httpErrors.map(err => ({
      scanId,
      websiteId,
      url: err.url,
      statusCode: err.status,
      statusText: err.statusText,
      resourceType: err.resourceType,
      fromMainFrame: err.fromMainFrame
    }));
    persistencePromises.push(HttpError.insertMany(httpErrorDocs, { ordered: false }).catch(err => logger.warn(`HttpError insert error: ${err.message}`)));
  }

  // 5. Persist Links
  if (links.samples?.length > 0) {
    const linkDocs = links.samples.slice(0, 100).map(l => ({
      scanId,
      websiteId,
      sourcePage: scan.url,
      targetUrl: l.url,
      linkText: l.text || '',
      linkType: l.type || 'internal',
      status: l.status || 'valid'
    }));
    persistencePromises.push(LinkCheck.insertMany(linkDocs, { ordered: false }).catch(err => logger.warn(`LinkCheck insert error: ${err.message}`)));
  }

  // 6. Persist Performance Result Document
  const perfDoc = {
    scanId,
    websiteId,
    dnsTime: http.timings?.dns,
    connectionTime: http.timings?.tcp,
    tlsTime: http.timings?.tls,
    requestTime: http.timings?.request,
    responseTime: http.timings?.response,
    domContentLoaded: browser.metrics?.domContentLoadedMs,
    firstContentfulPaint: browser.metrics?.fcpMs,
    pageLoadTime: browser.metrics?.pageLoadTimeMs || http.responseTimeMs,
    coreWebVitals: {
      fcp: browser.metrics?.fcpMs,
      ttfb: http.timings?.ttfb || http.responseTimeMs
    },
    totalResources: resources.totalImages || 0,
    score: scores.performance
  };
  persistencePromises.push(PerformanceResult.create(perfDoc).catch(err => logger.warn(`PerformanceResult create error: ${err.message}`)));

  // 7. Persist Security Result Document
  const secDoc = {
    scanId,
    websiteId,
    ssl: {
      valid: ssl.valid,
      authorized: ssl.authorized,
      protocol: ssl.protocol,
      cipher: typeof ssl.cipher === 'object' ? (ssl.cipher?.name || ssl.cipher?.standardName) : ssl.cipher,
      daysRemaining: ssl.daysRemaining,
      validFrom: ssl.validFrom,
      validTo: ssl.validTo,
      isExpired: ssl.isExpired,
      isExpiringSoon: ssl.isExpiringSoon,
      domainMatch: ssl.domainMatch,
      issuer: ssl.issuer,
      subject: ssl.subject,
      san: ssl.san,
      chainDepth: ssl.chainDepth
    },
    headers: security.headers || {},
    mixedContent: security.mixedContent || { hasMixedContent: false, count: 0, items: [] },
    cookies: {
      total: cookies.totalCount || 0,
      secure: cookies.secureCount || 0,
      httpOnly: cookies.httpOnlyCount || 0,
      privacyScore: cookies.privacyScore || 100,
      items: cookies.cookies || []
    },
    score: scores.security
  };
  persistencePromises.push(SecurityResult.create(secDoc).catch(err => logger.warn(`SecurityResult create error: ${err.message}`)));

  // 8. Persist SEO Result Document
  const seoDoc = {
    scanId,
    websiteId,
    title: seo.title,
    titleLength: seo.title ? seo.title.length : 0,
    metaDescription: seo.metaDescription,
    metaDescriptionLength: seo.metaDescription ? seo.metaDescription.length : 0,
    canonical: seo.canonical,
    robotsMeta: seo.robots,
    favicon: browser.pageDetails?.favicon,
    language: browser.pageDetails?.language,
    h1Count: content.headingsCount?.h1 || 0,
    h2Count: content.headingsCount?.h2 || 0,
    h3Count: content.headingsCount?.h3 || 0,
    wordCount: content.wordCount || 0,
    readingTimeMinutes: content.readingTimeMinutes || 0,
    openGraph: seo.openGraph || {},
    twitterCard: seo.twitterCard || {},
    robotsTxt: robotsSitemap.robots || { exists: false },
    sitemap: robotsSitemap.sitemap || { exists: false },
    score: scores.seo
  };
  persistencePromises.push(SeoResult.create(seoDoc).catch(err => logger.warn(`SeoResult create error: ${err.message}`)));

  // 9. Persist Accessibility Result Document
  const a11yDoc = {
    scanId,
    websiteId,
    summary: {
      totalElementsChecked: accessibility.totalElementsChecked || 0,
      imagesWithoutAltCount: accessibility.imagesWithoutAltCount || 0,
      missingFormLabelsCount: accessibility.missingFormLabelsCount || 0,
      emptyButtonsCount: accessibility.emptyButtonsCount || 0,
      missingLanguage: accessibility.missingLanguage || false,
      ariaIssuesCount: accessibility.ariaIssuesCount || 0
    },
    findings: accessibility.findings || [],
    score: scores.accessibility
  };
  persistencePromises.push(AccessibilityResult.create(a11yDoc).catch(err => logger.warn(`AccessibilityResult create error: ${err.message}`)));

  // 10. Persist Technology Result Document
  const techDoc = {
    scanId,
    websiteId,
    technologies: technology.technologies || [],
    byCategory: technology.byCategory || {},
    count: technology.count || 0
  };
  persistencePromises.push(TechnologyResult.create(techDoc).catch(err => logger.warn(`TechnologyResult create error: ${err.message}`)));

  // Execute all persistence operations concurrently
  await Promise.all(persistencePromises);
}

module.exports = {
  persistScanResults
};
