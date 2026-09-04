import { chromium } from 'playwright';
import config from '../Config/config.js';
import logger from '../Utils/logger.js';
import { cleanRecursiveUrl } from '../Utils/urlHelper.js';

/**
 * Runs headless browser check using Playwright with accurate screenshot rendering
 * @param {string} targetUrl
 * @param {object} [options={}]
 * @returns {Promise<object>}
 */
export async function runBrowserAudit(targetUrl, options = {}) {

  let browser = null;
  const timeout = options.isCrawler ? (options.timeout || 6000) : (options.timeout || config.defaultTimeout || 12000);

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

    // Abort slow web font network requests so screenshots render instantly without font loading timeouts
    await context.route('**/*.{woff,woff2,ttf,otf,eot,svg}*', route => route.abort());
    await context.route('**/*font*', route => route.abort());
    await context.route('**/*fonts.googleapis.com*', route => route.abort());
    await context.route('**/*fonts.gstatic.com*', route => route.abort());

    const page = await context.newPage();

    // Mock document.fonts.ready to instantly resolve so Playwright screenshot engine never blocks on web fonts
    await page.addInitScript(() => {
      try {
        Object.defineProperty(document, 'fonts', {
          value: { ready: Promise.resolve(), check: () => true, add: () => {}, delete: () => {} },
          configurable: true
        });
      } catch (e) {}
    }).catch(() => {});

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
    const mainResponse = await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: timeout
    }).catch(async () => {
      if (options.isCrawler) return null;
      return await page.goto(targetUrl, { timeout: 6000 }).catch(() => null);
    });

    if (mainResponse) {
      result.pageDetails.statusCode = mainResponse.status();
      result.pageDetails.statusText = mainResponse.statusText();
    } else {
      result.pageDetails.statusCode = 0;
      result.pageDetails.statusText = 'Failed to Load Page';
    }

    const loadDuration = Date.now() - startTime;
    result.metrics.pageLoadTimeMs = loadDuration;
    result.pageDetails.finalUrl = cleanRecursiveUrl(page.url());

    // Wait for network settlement and font loading for accurate rendering
    try {
      await page.waitForLoadState('networkidle', { timeout: 800 }).catch(() => { });
      await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve())).catch(() => { });

      // Accelerated top-to-bottom scroll for lazy content & screenshots
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 1000;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            if (totalHeight >= scrollHeight || totalHeight >= 3000) {
              clearInterval(timer);
              window.scrollTo(0, 0); // Scroll back to top for screenshot
              resolve();
            }
          }, 10);
        });
      }).catch(() => {});

      // Allow CSS transitions and images to paint cleanly
      await new Promise(r => setTimeout(r, 200));
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

    // 4.6. Inspect every interactive button element on the page
    try {
      const buttonAudit = await page.evaluate(() => {
        const buttons = [];
        let missingAccessibleNameCount = 0;
        let invalidFormActionCount = 0;

        const elements = document.querySelectorAll(
          'button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"], [onclick], [data-action]'
        );

        elements.forEach((el, index) => {
          if (index > 100) return;
          const tag = el.tagName.toLowerCase();
          const type = el.getAttribute('type') || (tag === 'button' ? 'button' : null);
          const rawText = el.innerText || el.getAttribute('value') || el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('alt') || '';
          const cleanText = rawText.trim().replace(/\s+/g, ' ').substring(0, 60);

          const hasAccessibleName = cleanText.length > 0;
          if (!hasAccessibleName) {
            missingAccessibleNameCount++;
          }

          let formAction = null;
          const parentForm = el.closest('form');
          if (parentForm) {
            formAction = parentForm.getAttribute('action') || window.location.href;
          }

          if ((type === 'submit' || tag === 'button') && parentForm && !parentForm.getAttribute('action')) {
            invalidFormActionCount++;
          }

          buttons.push({
            tag,
            type,
            text: cleanText || '[No Accessible Label]',
            hasAccessibleName,
            hasOnClick: !!el.getAttribute('onclick'),
            formAction
          });
        });

        return {
          totalButtons: elements.length,
          buttonsSample: buttons.slice(0, 25),
          missingAccessibleNameCount,
          invalidFormActionCount,
          buttonIssuesCount: missingAccessibleNameCount + invalidFormActionCount
        };
      });

      result.buttonAudit = buttonAudit;
    } catch (e) {
      result.buttonAudit = {
        totalButtons: 0,
        buttonsSample: [],
        missingAccessibleNameCount: 0,
        invalidFormActionCount: 0,
        buttonIssuesCount: 0
      };
    }

    result.pageDetails.title = (await page.title().catch(() => '')) || targetUrl;

    if (options.captureScreenshot !== false) {
      try {
        const buffer = await page.screenshot({
          type: 'jpeg',
          quality: 80,
          fullPage: false,
          animations: 'disabled',
          scale: 'css',
          timeout: 8000
        });
        result.screenshot = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      } catch (err) {
        logger.warn(`Screenshot capture notice for ${targetUrl}: ${err.message}`);
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

export default {
  runBrowserAudit
};


