/**
 * Centralized Scoring Service
 * Computes granular 0-100 scores for each domain and the overall website health score
 */

/**
 * Calculates grade based on overall score
 * @param {number} score 
 * @returns {string} 'A' | 'B' | 'C' | 'D' | 'F'
 */
function calculateGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

/**
 * Determines health status string based on score and availability
 * @param {number} score 
 * @param {boolean} isAvailable 
 * @returns {string} 'healthy' | 'warning' | 'critical' | 'unreachable'
 */
function calculateHealthStatus(score, isAvailable = true) {
  if (!isAvailable) return 'unreachable';
  if (score >= 80) return 'healthy';
  if (score >= 50) return 'warning';
  return 'critical';
}

/**
 * Computes scores across all domains and compiles overall health summary
 * @param {object} rawResults Raw domain analysis outputs
 * @returns {object} Calculated scores, grade, and domain metrics
 */
function computeScores(rawResults = {}) {
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

  // 1. Availability Score (0 or 100)
  const isAvailable = http.success && http.statusCode >= 200 && http.statusCode < 400;
  const availabilityScore = isAvailable ? 100 : 0;

  // 2. HTTP Score (based on status code, response time, redirects)
  let httpScore = 100;
  if (!isAvailable) httpScore = 0;
  else {
    if (http.responseTimeMs > 1000) httpScore -= 15;
    else if (http.responseTimeMs > 500) httpScore -= 8;
    if (http.redirectCount > 2) httpScore -= 10;
  }
  httpScore = Math.max(0, Math.min(100, httpScore));

  // 3. Performance Score (TTFB, DOMContentLoaded, FCP)
  let performanceScore = 85;
  const ttfb = http.timings?.ttfb || http.responseTimeMs || 0;
  if (ttfb > 1200) performanceScore -= 25;
  else if (ttfb > 600) performanceScore -= 12;

  const fcp = browser.metrics?.fcpMs;
  if (fcp && fcp > 2500) performanceScore -= 20;
  else if (fcp && fcp > 1800) performanceScore -= 10;
  performanceScore = Math.max(0, Math.min(100, performanceScore));

  // 4. Security & SSL Score
  let securityScore = security.securityScore || 0;
  if (ssl.valid) securityScore = Math.min(100, securityScore + 30);
  if (security.mixedContent?.hasMixedContent) securityScore -= 20;
  securityScore = Math.max(0, Math.min(100, securityScore));

  // 5. SEO Score
  let seoScore = 100;
  if (!seo.title) seoScore -= 25;
  if (!seo.metaDescription) seoScore -= 20;
  if (!seo.canonical) seoScore -= 10;
  if (!seo.h1Count || seo.h1Count === 0) seoScore -= 15;
  if (!robotsSitemap.robots?.exists) seoScore -= 10;
  seoScore = Math.max(0, Math.min(100, seoScore));

  // 6. Accessibility Score
  const a11yScore = accessibility.accessibilityScore || 90;

  // 7. Console & Runtime Score
  let consoleScore = 100;
  const jsErrorsCount = (browser.jsErrors?.length || 0) + (browser.consoleMessages?.errors?.length || 0);
  if (jsErrorsCount > 5) consoleScore = 20;
  else if (jsErrorsCount > 0) consoleScore -= jsErrorsCount * 15;
  consoleScore = Math.max(0, Math.min(100, consoleScore));

  // 8. Network Failure Score
  let networkScore = 100;
  const failedRequestsCount = browser.failedRequests?.length || 0;
  const httpErrorsCount = browser.httpErrors?.length || 0;
  networkScore -= (failedRequestsCount * 10 + httpErrorsCount * 10);
  networkScore = Math.max(0, Math.min(100, networkScore));

  // 9. Links Score
  let linksScore = 100;
  const brokenLinksCount = links.brokenCount || 0;
  if (brokenLinksCount > 0) linksScore -= brokenLinksCount * 15;
  linksScore = Math.max(0, Math.min(100, linksScore));

  // Overall Weighted Health Score calculation
  const weightedOverall = Math.round(
    availabilityScore * 0.25 +
    performanceScore * 0.15 +
    securityScore * 0.15 +
    seoScore * 0.15 +
    a11yScore * 0.10 +
    consoleScore * 0.10 +
    networkScore * 0.05 +
    linksScore * 0.05
  );

  const overallScore = Math.max(0, Math.min(100, weightedOverall));
  const grade = calculateGrade(overallScore);
  const status = calculateHealthStatus(overallScore, isAvailable);

  return {
    overall: overallScore,
    grade,
    status,
    availability: availabilityScore,
    http: httpScore,
    performance: performanceScore,
    security: securityScore,
    seo: seoScore,
    accessibility: a11yScore,
    console: consoleScore,
    network: networkScore,
    links: linksScore
  };
}

module.exports = {
  calculateGrade,
  calculateHealthStatus,
  computeScores
};
