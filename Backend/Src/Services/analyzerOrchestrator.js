const { performance } = require('perf_hooks');
const { checkDns } = require('./dnsService');
const { checkSsl } = require('./sslService');
const { measurePerformance } = require('./performanceService');
const { traceRedirects } = require('./redirectService');
const { analyzeSecurity } = require('./securityService');
const { analyzeSeo } = require('./seoService');
const { analyzeResources } = require('./resourceService');
const { analyzeLinks } = require('./linkService');
const { analyzeContent } = require('./contentService');
const { analyzeMobileReadiness } = require('./mobileService');
const { runBrowserAudit } = require('./browserService');
const { checkAvailability } = require('./availabilityService');
const { testApiEndpoint } = require('./apiCheckService');
const { analyzeAccessibility } = require('./accessibilityService');
const { detectTechnologies } = require('./technologyService');
const { auditCookies } = require('./cookieService');
const logger = require('../Utils/logger');

/**
 * Master analyzer orchestrating all 18 domains based on options
 * @param {object} normalizedUrl
 * @param {object} [options={}]
 * @param {object} [advanced={}]
 * @param {Function} [onProgress=null]
 * @returns {Promise<object>}
 */
async function runFullAnalysis(normalizedUrl, options = {}, advanced = {}, onProgress = null) {
  const startOverall = performance.now();
  const targetUrl = normalizedUrl.normalized;
  const hostname = normalizedUrl.hostname;
  const origin = normalizedUrl.origin;
  const isHttps = normalizedUrl.protocol === 'https';

  const defaultAll = Object.keys(options).length === 0;
  const shouldRun = (key) => defaultAll || options[key] !== false;

  const results = {};

  const emitProgress = (step, data = null) => {
    if (typeof onProgress === 'function') {
      try {
        onProgress({ step, data });
      } catch (e) { }
    }
  };

  emitProgress('start', { url: targetUrl });

  // 1. Parallel Network Layer Execution (DNS, Performance/Fetch, SSL, Redirects, Availability)
  const taskPromises = [];

  // (a) DNS
  if (shouldRun('checkDNS') || shouldRun('dns')) {
    taskPromises.push(
      checkDns(hostname).then(res => {
        results.dns = res;
        emitProgress('dns', res);
      })
    );
  }

  // (b) SSL / TLS
  if (isHttps && (shouldRun('checkSSL') || shouldRun('ssl'))) {
    taskPromises.push(
      checkSsl(hostname, normalizedUrl.port).then(res => {
        results.ssl = res;
        emitProgress('ssl', res);
      })
    );
  }

  // (c) Redirects
  if (shouldRun('checkRedirects') || shouldRun('redirects')) {
    taskPromises.push(
      traceRedirects(targetUrl, {
        userAgent: advanced.userAgent,
        headers: advanced.headers,
        timeout: advanced.timeout
      }).then(res => {
        results.redirects = res;
        emitProgress('redirects', res);
      })
    );
  }

  // (d) Performance & HTML Fetch
  let perfData = null;
  const fetchTask = measurePerformance(targetUrl, {
    userAgent: advanced.userAgent,
    headers: advanced.headers,
    timeout: advanced.timeout
  }).then(res => {
    perfData = res;
    results.performance = {
      dnsTime: res.dnsTime,
      tcpTime: res.tcpTime,
      tlsTime: res.tlsTime,
      ttfb: res.ttfb,
      downloadTime: res.downloadTime,
      totalTime: res.totalTime,
      pageSizeBytes: res.pageSizeBytes,
      statusCode: res.statusCode,
      statusText: res.statusText,
      httpVersion: res.httpVersion
    };
    emitProgress('performance', results.performance);
  });
  taskPromises.push(fetchTask);

  // (e) Availability
  if (shouldRun('checkAvailability') || shouldRun('availability')) {
    taskPromises.push(
      checkAvailability(targetUrl, {
        userAgent: advanced.userAgent,
        headers: advanced.headers,
        timeout: advanced.timeout
      }).then(res => {
        results.availability = res;
        emitProgress('availability', res);
      })
    );
  }

  // Wait for initial network layer tasks
  await Promise.allSettled(taskPromises);

  const html = perfData ? perfData.body : '';
  const responseHeaders = perfData ? perfData.headers : {};

  // If availability was not explicitly queried, derive from performance response
  if (!results.availability && perfData) {
    results.availability = {
      isAvailable: perfData.statusCode ? perfData.statusCode < 500 : false,
      statusCode: perfData.statusCode,
      statusText: perfData.statusText,
      protocol: normalizedUrl.protocol,
      httpsAvailable: isHttps,
      httpVersion: perfData.httpVersion,
      supportedMethods: ['GET', 'HEAD']
    };
  }

  // 2. HTML & Content-based Parallel Analyzers
  const htmlTasks = [];

  // Security
  if (shouldRun('checkSecurity') || shouldRun('security')) {
    htmlTasks.push(
      Promise.resolve().then(() => {
        const sec = analyzeSecurity(responseHeaders, html, targetUrl);
        results.security = sec;
        emitProgress('security', sec);
      })
    );
  }

  // Cookies & Privacy
  if (shouldRun('checkCookies') || shouldRun('cookies')) {
    htmlTasks.push(
      Promise.resolve().then(() => {
        const cookies = auditCookies(responseHeaders['set-cookie'], isHttps);
        results.cookies = cookies;
        emitProgress('cookies', cookies);
      })
    );
  }

  // Technology Stack
  if (shouldRun('checkTech') || shouldRun('technology')) {
    htmlTasks.push(
      Promise.resolve().then(() => {
        const tech = detectTechnologies(responseHeaders, html, targetUrl);
        results.technology = tech;
        emitProgress('technology', tech);
      })
    );
  }

  // Accessibility (a11y)
  if (shouldRun('checkA11y') || shouldRun('accessibility')) {
    htmlTasks.push(
      Promise.resolve().then(() => {
        const a11y = analyzeAccessibility(html, targetUrl);
        results.accessibility = a11y;
        emitProgress('accessibility', a11y);
      })
    );
  }

  // SEO & Robots / Sitemap
  if (shouldRun('checkSEO') || shouldRun('seo')) {
    htmlTasks.push(
      analyzeSeo(html, targetUrl, origin).then(seo => {
        results.seo = seo;
        emitProgress('seo', seo);
      })
    );
  }

  // Resources / Images
  if (shouldRun('checkResources') || shouldRun('resources')) {
    htmlTasks.push(
      analyzeResources(html, targetUrl).then(res => {
        results.resources = res;
        emitProgress('resources', res);
      })
    );
  }

  // Links
  if (shouldRun('checkLinks') || shouldRun('links')) {
    htmlTasks.push(
      analyzeLinks(html, targetUrl, true).then(links => {
        results.links = links;
        emitProgress('links', links);
      })
    );
  }

  // Content & Headings
  if (shouldRun('checkContent') || shouldRun('content')) {
    htmlTasks.push(
      Promise.resolve().then(() => {
        const content = analyzeContent(html, {
          keyword: advanced.keyword,
          regex: advanced.regex,
          cssSelector: advanced.cssSelector
        });
        results.content = content;
        emitProgress('content', content);
      })
    );
  }

  // Mobile
  if (shouldRun('checkMobile') || shouldRun('mobile')) {
    htmlTasks.push(
      Promise.resolve().then(() => {
        const mob = analyzeMobileReadiness(html);
        results.mobile = mob;
        emitProgress('mobile', mob);
      })
    );
  }

  // Optional API check if requested
  if (options.checkAPI || options.api) {
    htmlTasks.push(
      testApiEndpoint(targetUrl, {
        method: advanced.apiMethod || 'GET',
        headers: advanced.headers,
        body: advanced.apiBody,
        auth: advanced.auth
      }).then(apiRes => {
        results.api = apiRes;
        emitProgress('api', apiRes);
      })
    );
  }

  await Promise.allSettled(htmlTasks);

  // 3. Playwright Headless Browser Inspection
  if (shouldRun('checkBrowser') || shouldRun('browser')) {
    try {
      emitProgress('browser_starting', { message: 'Running Playwright browser audit...' });
      const browserRes = await runBrowserAudit(targetUrl, {
        userAgent: advanced.userAgent,
        timeout: advanced.timeout || 12000,
        captureScreenshot: advanced.captureScreenshot !== false
      });
      results.browser = browserRes;
      emitProgress('browser', browserRes);
    } catch (bErr) {
      results.browser = { error: bErr.message };
    }
  }

  const executionTimeMs = Math.round((performance.now() - startOverall) * 100) / 100;
  emitProgress('complete', { executionTimeMs });

  return {
    results,
    executionTimeMs
  };
}

module.exports = {
  runFullAnalysis
};
