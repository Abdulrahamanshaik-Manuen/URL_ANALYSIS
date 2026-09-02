import axios from 'axios';
import * as cheerio from 'cheerio';

import AuditReport from '../Models/AuditReport.js';
import { uploadScreenshotToCloudinary } from './cloudinaryService.js';
import { runFullAnalysis } from './analyzerOrchestrator.js';
import browserService from './browserService.js';
import { normalizeUrl, extractDomain, extractHostname, extractProtocol } from '../Utils/urlHelper.js';
import { formatAnalysisResponse } from '../Utils/responseFormatter.js';
import { SiteCrawl, Website } from '../Models/index.js';
import logger from '../Utils/logger.js';


/**
 * Normalizes link URL against origin domain and verifies same-domain scope
 */
function normalizeDiscoveredLink(rawHref, pageUrl, origin, hostname) {
  try {
    if (!rawHref || typeof rawHref !== 'string') return null;

    const trimmed = rawHref.trim();
    if (
      trimmed.startsWith('#') ||
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:') ||
      trimmed.startsWith('data:')
    ) {
      return null;
    }

    // Resolve relative URLs against the current PAGE URL (or fallback to origin)
    const base = pageUrl || origin;
    const resolved = new URL(trimmed, base);

    // Enforce same-domain or same-hostname boundary
    if (resolved.hostname !== hostname && !resolved.hostname.endsWith(`.${hostname}`)) {
      return null;
    }

    // Strip hash fragments
    resolved.hash = '';

    let cleanHref = resolved.href;

    // Detect and reject recursive URL traps (e.g. ~and~, /?/, /&/, or multiple ? query params)
    if (
      cleanHref.includes('~and~') ||
      cleanHref.includes('/&/') ||
      cleanHref.includes('/?/') ||
      cleanHref.includes('?') && cleanHref.includes('&~') ||
      (cleanHref.match(/\?/g) || []).length > 2 ||
      (cleanHref.match(/~/g) || []).length > 2
    ) {
      return null;
    }

    // Detect repeating path segments (e.g. /about/about/ or /products/products/)
    const pathSegments = resolved.pathname.split('/').filter(Boolean);
    const uniqueSegments = new Set(pathSegments.map(s => s.toLowerCase()));
    if (pathSegments.length > uniqueSegments.size + 1) {
      return null; // Reject recursive repeating path trap!
    }

    // Strip trailing ? or & if present
    cleanHref = cleanHref.replace(/[?&]+$/, '');

    return cleanHref;
  } catch (e) {
    return null;
  }
}

/**
 * Extracts seed URLs from sitemap.xml, sitemap indices, and robots.txt
 */
async function fetchSitemapSeeds(origin, hostname) {
  const seeds = [];
  const candidateUrls = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`,
    `${origin}/sitemap.php`,
    `${origin}/robots.txt`
  ];

  for (const candidate of candidateUrls) {
    try {
      const res = await axios.get(candidate, { timeout: 4000 }).catch(() => null);
      if (res && res.status === 200 && typeof res.data === 'string') {
        if (candidate.endsWith('robots.txt')) {
          const sitemapDirectives = res.data.match(/Sitemap:\s*(.+)/gi) || [];
          for (const dir of sitemapDirectives) {
            const smUrl = dir.replace(/Sitemap:\s*/i, '').trim();
            if (smUrl && !candidateUrls.includes(smUrl)) {
              candidateUrls.push(smUrl);
            }
          }
        } else {
          const matches = res.data.match(/<loc>(.*?)<\/loc>/g) || [];
          for (const m of matches) {
            const raw = m.replace(/<\/?loc>/g, '').trim();
            const norm = normalizeDiscoveredLink(raw, origin, hostname);
            if (norm && !seeds.includes(norm)) {
              seeds.push(norm);
            }
          }
        }
      }
    } catch (e) {}
  }
  return seeds.slice(0, 100);
}

/**
 * Executes a true Playwright-driven website crawl across every discovered page
 * @param {string} startUrl Target starting URL
 * @param {object} [options={}] Crawl configuration (maxPages, concurrency, respectRobots)
 * @param {Function} [onProgress=null] SSE progress callback
 * @returns {Promise<object>} Site crawl summary and page audit records
 */
async function executeWebsiteCrawl(startUrl, options = {}, onProgress = null) {
  const startTime = Date.now();
  const normObj = normalizeUrl(startUrl);

  if (!normObj.valid) {
    throw new Error(normObj.error || 'Invalid starting URL for crawl');
  }

  const normalized = normObj.normalized;
  const domain = extractDomain(normalized);
  const hostname = extractHostname(normalized);
  const origin = normObj.origin;
  const maxPages = options.maxPages === Infinity || options.maxPages === 'unlimited' || options.maxPages === 0 ? Infinity : Math.max(1, parseInt(options.maxPages) || 50);
  const concurrency = Math.max(1, parseInt(options.concurrency) || 4);

  logger.info(`Starting Playwright browser website crawl for ${normalized} (Max Pages: ${maxPages}, Concurrency: ${concurrency})`);

  const visited = new Set([normalized]);
  const discoveredSet = new Set([normalized]);
  const queue = [normalized];
  const pagesResults = [];

  const emitProgress = (event, data) => {
    if (typeof onProgress === 'function') {
      try {
        onProgress({ event, data });
      } catch (e) {}
    }
  };

  emitProgress('crawl_start', {
    startUrl: normalized,
    domain,
    maxPages,
    concurrency
  });

  // Fetch optional sitemap seeds
  const sitemapSeeds = await fetchSitemapSeeds(origin, hostname);
  for (const seed of sitemapSeeds) {
    if (!discoveredSet.has(seed) && discoveredSet.size < maxPages * 2) {
      discoveredSet.add(seed);
      queue.push(seed);
    }
  }

  // Create SiteCrawl DB record
  let siteCrawl = null;
  try {
    siteCrawl = await SiteCrawl.create({
      startUrl: normalized,
      domain,
      totalPagesDiscovered: discoveredSet.size,
      status: 'running'
    });
  } catch (err) {
    logger.warn(`SiteCrawl DB creation warning: ${err.message}`);
  }

  // Crawl worker loop - Opens EVERY page in Playwright browser
  async function worker() {
    while (queue.length > 0 && pagesResults.length < maxPages) {
      const currentUrl = queue.shift();
      if (!currentUrl) break;

      const pageNorm = normalizeUrl(currentUrl);

      const crawlingProgressText = `Crawling ${pagesResults.length + 1} / ${Math.max(discoveredSet.size, pagesResults.length + 1)} pages`;

      emitProgress('page_start', {
        currentUrl,
        crawledCount: pagesResults.length,
        discoveredCount: discoveredSet.size,
        remainingCount: queue.length,
        crawlingProgressText
      });

      try {
        let results, executionTimeMs;

        // Execute full 18-domain real dynamic analysis for EVERY page discovered
        const fullRes = await runFullAnalysis(
          pageNorm,
          { ...options, checkBrowser: true },
          options
        ).catch((err) => ({
          results: {
            availability: { isAvailable: false, statusCode: 500, statusText: err.message },
            performance: { totalTime: 0, ttfb: 0 },
            security: { securityScore: 0 },
            ssl: { valid: false, daysRemaining: 0 },
            seo: { title: { text: currentUrl } },
            links: { links: [], broken: [] }
          },
          executionTimeMs: 0
        }));

        results = fullRes.results;
        executionTimeMs = fullRes.executionTimeMs;

        const formatted = formatAnalysisResponse(currentUrl, results, executionTimeMs);

        // Extract links from Playwright DOM (Navbar, Footer, Body) & static links inspector
        const pageLinks = [];

        // 1. Playwright DOM extracted links (Navbar, Footer, Buttons, Interactive Elements)
        if (results.browser && Array.isArray(results.browser.domLinks)) {
          results.browser.domLinks.forEach(l => {
            const norm = normalizeDiscoveredLink(l.url, currentUrl, origin, hostname);
            if (norm) pageLinks.push(norm);
          });
        }

        // 2. Static HTML links inspector
        if (results.links && Array.isArray(results.links.links)) {
          results.links.links.forEach(l => {
            const norm = normalizeDiscoveredLink(l.url, currentUrl, origin, hostname);
            if (norm) pageLinks.push(norm);
          });
        }

        // Add newly discovered same-domain links to queue
        for (const link of pageLinks) {
          if (!discoveredSet.has(link) && discoveredSet.size < maxPages * 5) {
            discoveredSet.add(link);
            if (!visited.has(link) && queue.length < maxPages * 3) {
              visited.add(link);
              queue.push(link);
            }
          }
        }

        const urlObj = new URL(currentUrl);

        // Upload Playwright page screenshot to Cloudinary for MongoDB persistence
        const rawScreenshot = formatted.checks?.browser?.screenshot || results.browser?.screenshot || null;
        let pageScreenshotUrl = null;
        if (rawScreenshot && typeof rawScreenshot === 'string') {
          if (rawScreenshot.startsWith('http://') || rawScreenshot.startsWith('https://')) {
            pageScreenshotUrl = rawScreenshot;
          } else {
            pageScreenshotUrl = await uploadScreenshotToCloudinary(rawScreenshot).catch(() => null);
          }
        }

        if (pageScreenshotUrl && formatted.checks?.browser) {
          formatted.checks.browser.screenshot = pageScreenshotUrl;
        } else if (rawScreenshot && formatted.checks?.browser && !formatted.checks.browser.screenshot) {
          formatted.checks.browser.screenshot = rawScreenshot;
        }

        const buttonAudit = results.browser?.buttonAudit || {};

        const pageRecord = {
          url: currentUrl,
          path: urlObj.pathname + urlObj.search,
          title: formatted.summary?.title || formatted.checks?.browser?.pageDetails?.title || formatted.checks?.seo?.title?.text || urlObj.pathname,
          statusCode: formatted.summary?.statusCode ?? (formatted.summary?.isAvailable === false ? 500 : 200),
          statusText: formatted.summary?.statusText || (formatted.summary?.isAvailable === false ? 'Unreachable' : 'OK'),
          responseTimeMs: formatted.summary?.responseTimeMs || 0,
          healthScore: formatted.scores?.overall ?? 0,
          jsErrorsCount: formatted.summary?.jsErrorsCount || 0,
          brokenLinksCount: formatted.summary?.brokenLinksCount || 0,
          a11yIssuesCount: formatted.summary?.a11yIssuesCount || 0,
          buttonsCount: buttonAudit.totalButtons || 0,
          buttonIssuesCount: buttonAudit.buttonIssuesCount || 0,
          sslValid: formatted.summary?.sslValid === true,
          screenshotUrl: pageScreenshotUrl || rawScreenshot || null,
          details: formatted
        };

        pagesResults.push(pageRecord);

        // Calculate live site score
        const currentSiteScore = Math.round(
          pagesResults.reduce((acc, p) => acc + p.healthScore, 0) / pagesResults.length
        );

        const liveProgressText = `Crawled ${pagesResults.length} / ${discoveredSet.size} pages`;

        emitProgress('page_done', {
          page: pageRecord,
          crawledCount: pagesResults.length,
          discoveredCount: discoveredSet.size,
          remainingCount: queue.length,
          siteHealthScore: currentSiteScore,
          crawlingProgressText: liveProgressText
        });
      } catch (err) {
        logger.warn(`Failed crawling ${currentUrl} with Playwright: ${err.message}`);
        const failedRecord = {
          url: currentUrl,
          path: new URL(currentUrl).pathname,
          title: 'Crawl Error',
          statusCode: 500,
          statusText: 'Crawl Error',
          responseTimeMs: 0,
          healthScore: 0,
          jsErrorsCount: 1,
          brokenLinksCount: 0,
          a11yIssuesCount: 0,
          sslValid: false,
          details: { error: err.message }
        };
        pagesResults.push(failedRecord);
      }
    }
  }

  // Launch workers up to concurrency limit
  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  const durationMs = Date.now() - startTime;
  const siteHealthScore = pagesResults.length > 0
    ? Math.round(pagesResults.reduce((acc, p) => acc + p.healthScore, 0) / pagesResults.length)
    : 0;

  // Persist completed crawl in DB
  if (siteCrawl) {
    siteCrawl.status = 'completed';
    siteCrawl.totalPagesDiscovered = discoveredSet.size;
    siteCrawl.totalPagesCrawled = pagesResults.length;
    siteCrawl.siteHealthScore = siteHealthScore;
    siteCrawl.durationMs = durationMs;
    siteCrawl.pages = pagesResults;
    await siteCrawl.save().catch(() => {});
  }

  const failedCount = pagesResults.filter(p => !p.statusCode || p.statusCode >= 400).length;
  const firstScreenshot = pagesResults[0]?.details?.checks?.browser?.screenshot || null;
  let coverScreenshotUrl = null;
  if (firstScreenshot) {
    coverScreenshotUrl = await uploadScreenshotToCloudinary(firstScreenshot).catch(() => null);
  }

  try {
    await AuditReport.create({
      targetUrl: normalized,
      scanType: 'crawl',
      crawlStatus: 'completed',
      pagesDiscovered: discoveredSet.size,
      pagesScanned: pagesResults.length,
      pagesFailed: failedCount,
      overallScore: siteHealthScore,
      rating: siteHealthScore >= 90 ? 'Excellent' : siteHealthScore >= 75 ? 'Good' : siteHealthScore >= 50 ? 'Fair' : 'Poor',
      domainScores: pagesResults[0]?.details?.scores || {},
      summary: pagesResults[0]?.details?.summary || {},
      screenshotUrl: coverScreenshotUrl || firstScreenshot || null,
      crawledPages: pagesResults,
      fullDetails: pagesResults[0]?.details || {}
    });
    logger.success(` Full Website Crawl Report saved to MongoDB Atlas for ${normalized}`);
  } catch (auditErr) {
    logger.warn(`AuditReport MongoDB crawl save notice: ${auditErr.message}`);
  }

  const finalPayload = {
    success: true,
    startUrl: normalized,
    domain,
    timestamp: new Date().toISOString(),
    durationMs,
    totalPagesDiscovered: discoveredSet.size,
    totalPagesCrawled: pagesResults.length,
    siteHealthScore,
    pages: pagesResults
  };

  emitProgress('crawl_done', finalPayload);

  return finalPayload;
}

export {
  executeWebsiteCrawl
};

export default {
  executeWebsiteCrawl
};


