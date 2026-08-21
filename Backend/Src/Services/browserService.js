const { chromium } = require('playwright');
const config = require('../Config/config');
const logger = require('../Utils/logger');

/**
 * Runs headless browser check using Playwright with accurate screenshot rendering
 * @param {string} targetUrl
 * @param {object} [options={}]
 * @returns {Promise<object>}
 */
async function runBrowserAudit(targetUrl, options = {}) {
  let browser = null;
  const timeout = options.timeout || config.defaultTimeout;

  const result = {
    success: false,
    pageDetails: {
      title: '',
      url: targetUrl,
      finalUrl: targetUrl,
      doctype: null,
      language: null,
      favicon: null
    },
    jsErrors: [],
    consoleMessages: {
      errors: [],
      warnings: [],
      logs: []
    },
    failedRequests: [],
    httpErrors: [],
    metrics: {
      domContentLoadedMs: null,
      pageLoadTimeMs: null,
      fcpMs: null
    },
    viewports: {
      desktop: { width: 1440, height: 900, overflow: false },
      tablet: { width: 768, height: 1024, overflow: false },
      mobile: { width: 390, height: 844, overflow: false }
    },
    screenshot: null,
    error: null
  };

  try {
    browser = await chromium.launch({
      headless: config.playwrightHeadless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--enable-font-antialiasing',
        '--font-render-hinting=medium'
      ]
    });

    const context = await browser.newContext({
      userAgent: options.userAgent || config.defaultUserAgent,
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5,
      ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    // 1. Capture JS Runtime Exceptions
    page.on('pageerror', (err) => {
      result.jsErrors.push({
        message: err.message,
        stack: err.stack ? err.stack.split('\n').slice(0, 3).join('\n') : null,
        timestamp: new Date().toISOString()
      });
    });

    // 2. Capture Console Messages
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location ? msg.location() : null;
      const entry = { text, location: location ? `${location.url}:${location.lineNumber}` : null };

      if (type === 'error') {
        result.consoleMessages.errors.push(entry);
      } else if (type === 'warning') {
        result.consoleMessages.warnings.push(entry);
      } else if (result.consoleMessages.logs.length < 25) {
        result.consoleMessages.logs.push(entry);
      }
    });

    // 3. Capture Failed Network Requests
    page.on('requestfailed', (req) => {
      result.failedRequests.push({
        url: req.url(),
        method: req.method(),
        resourceType: req.resourceType(),
        failure: req.failure() ? req.failure().errorText : 'Request Failed'
      });
    });

    // 4. Capture HTTP 4xx/5xx Responses in network traffic
    page.on('response', (res) => {
      const status = res.status();
      if (status >= 400) {
        result.httpErrors.push({
          url: res.url(),
          status,
          statusText: res.statusText(),
          resourceType: res.request().resourceType(),
          fromMainFrame: res.frame() === page.mainFrame()
        });
      }
    });

    // Navigate to page
    const startTime = Date.now();
    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: timeout
    }).catch(async () => {
      // Fallback
      await page.goto(targetUrl, { timeout: 8000 }).catch(() => { });
    });

    const loadDuration = Date.now() - startTime;
    result.metrics.pageLoadTimeMs = loadDuration;
    result.pageDetails.finalUrl = page.url();

    // Wait for network settlement and font loading for accurate rendering
    try {
      await page.waitForLoadState('networkidle', { timeout: 3500 }).catch(() => { });
      await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve())).catch(() => { });
      // Allow CSS transitions and images to paint
      await new Promise(r => setTimeout(r, 600));
    } catch (e) { }

    // Extract Performance Timing API, Core Web Vitals, and Page Attributes
    try {
      const pageInfo = await page.evaluate(() => {
        const perf = window.performance;
        const navEntries = perf.getEntriesByType ? perf.getEntriesByType('navigation') : [];
        const nav = navEntries.length > 0 ? navEntries[0] : null;

        let fcp = null;
        const paintEntries = perf.getEntriesByType ? perf.getEntriesByType('paint') : [];
        paintEntries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            fcp = Math.round(entry.startTime);
          }
        });

        const timing = perf.timing || {};
        const domContentLoaded = nav ? Math.round(nav.domContentLoadedEventEnd) : (timing.domContentLoadedEventEnd ? timing.domContentLoadedEventEnd - timing.navigationStart : null);

        let iconHref = null;
        const iconEl = document.querySelector('link[rel*="icon"]');
        if (iconEl) iconHref = iconEl.href;

        return {
          title: document.title,
          language: document.documentElement.lang || null,
          doctype: document.doctype ? document.doctype.name : null,
          favicon: iconHref,
          domContentLoaded,
          fcp,
          hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
      });

      result.pageDetails.title = pageInfo.title || '';
      result.pageDetails.language = pageInfo.language;
      result.pageDetails.doctype = pageInfo.doctype;
      result.pageDetails.favicon = pageInfo.favicon;
      result.metrics.domContentLoadedMs = pageInfo.domContentLoaded;
      result.metrics.fcpMs = pageInfo.fcp;
      result.viewports.desktop.overflow = pageInfo.hasHorizontalOverflow;
    } catch (e) {
      // Evaluation fallback
    }

    // 4.5. Extract Playwright DOM Links (Navbar features, Footer features, Menu, Buttons, Links)
    try {
      const domLinks = await page.evaluate(() => {
        const found = [];
        const seen = new Set();

        const addLink = (href, text, location) => {
          if (!href || typeof href !== 'string') return;
          const trimmed = href.trim();
          if (trimmed && !seen.has(trimmed)) {
            seen.add(trimmed);
            found.push({ url: trimmed, text: (text || '').trim().slice(0, 60), location });
          }
        };

        // Header / Navbar links
        document.querySelectorAll('header a[href], nav a[href], .navbar a[href], .nav a[href], [role="navigation"] a[href]').forEach(a => {
          addLink(a.href, a.innerText || a.getAttribute('title') || a.getAttribute('aria-label'), 'navbar');
        });

        // Footer links
        document.querySelectorAll('footer a[href], .footer a[href], .bottom-nav a[href]').forEach(a => {
          addLink(a.href, a.innerText || a.getAttribute('title') || a.getAttribute('aria-label'), 'footer');
        });

        // Main body & interactive element links
        document.querySelectorAll('a[href]').forEach(a => {
          addLink(a.href, a.innerText || a.getAttribute('title') || a.getAttribute('aria-label'), 'body');
        });

        // Interactive buttons with navigation attributes
        document.querySelectorAll('button[data-href], [role="button"][data-href], [data-url]').forEach(b => {
          const target = b.getAttribute('data-href') || b.getAttribute('data-url');
          if (target) addLink(target, b.innerText, 'button');
        });

        return found;
      });

      result.domLinks = domLinks;
    } catch (e) {
      result.domLinks = [];
    }

    // 5. Capture High-Quality Desktop Screenshot FIRST (Pristine Desktop Viewport)
    if (options.captureScreenshot !== false) {
      try {
        const buffer = await page.screenshot({
          type: 'jpeg',
          quality: 85,
          fullPage: false
        });
        result.screenshot = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      } catch (err) {
        logger.warn(`Screenshot capture failed: ${err.message}`);
      }
    }

    // 6. Test Mobile and Tablet Viewports for overflow checks
    try {
      await page.setViewportSize(config.viewports.tablet);
      await new Promise(r => setTimeout(r, 100));
      result.viewports.tablet.overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

      await page.setViewportSize(config.viewports.mobile);
      await new Promise(r => setTimeout(r, 100));
      result.viewports.mobile.overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    } catch (e) {
      // Ignore viewport switch error
    }

    result.success = true;
    await page.close();
    await context.close();
  } catch (err) {
    result.error = err.message || 'Browser execution failed';
    logger.warn(`Browser audit failed for ${targetUrl}: ${err.message}`);
  } finally {
    if (browser) {
      await browser.close().catch(() => { });
    }
  }

  return result;
}

module.exports = {
  runBrowserAudit
};
