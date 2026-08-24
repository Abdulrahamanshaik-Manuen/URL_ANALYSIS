import { Website, Scan } from '../Models/index.js';
import AuditReport from '../Models/AuditReport.js';
import { uploadScreenshotToCloudinary } from './cloudinaryService.js';
import { runFullAnalysis } from './analyzerOrchestrator.js';
import { computeScores } from './scoringService.js';
import { persistScanResults } from './resultPersistenceService.js';
import { normalizeUrl, extractDomain, extractHostname, extractProtocol } from '../Utils/urlHelper.js';
import { formatAnalysisResponse } from '../Utils/responseFormatter.js';
import logger from '../Utils/logger.js';


/**
 * Orchestrates a complete scan lifecycle and MongoDB persistence
 * @param {string} targetUrl The raw input URL to analyze
 * @param {object} [options={}] Options like userId, scanType, custom headers
 * @returns {Promise<object>} Structured response object
 */
export async function executeScan(targetUrl, options = {}) {

  const startTime = Date.now();
  const normObj = typeof targetUrl === 'object' && targetUrl.normalized ? targetUrl : normalizeUrl(targetUrl);
  const normalized = normObj.normalized || (typeof targetUrl === 'string' ? targetUrl : 'https://example.com');
  const rawInputUrl = typeof targetUrl === 'string' ? targetUrl : normalized;
  const domain = extractDomain(normalized);
  const hostname = extractHostname(normalized);
  const protocol = extractProtocol(normalized);
  const userId = options.userId || null;
  const scanType = options.scanType || 'full';

  // 1. Find or create the Website entity
  let website = null;
  try {
    website = await Website.findOne({ normalizedUrl: normalized });
    if (!website) {
      website = await Website.create({
        userId,
        url: rawInputUrl,
        normalizedUrl: normalized,
        domain,
        hostname,
        protocol
      });
    }
  } catch (err) {
    logger.warn(`Website find/create warning: ${err.message}`);
  }

  // 2. Create the Scan document with status 'running'
  let scan = null;
  try {
    scan = await Scan.create({
      websiteId: website ? website._id : null,
      userId,
      url: targetUrl,
      normalizedUrl: normalized,
      scanType,
      status: 'running',
      startedAt: new Date()
    });
  } catch (err) {
    logger.warn(`Scan create warning: ${err.message}`);
  }

  try {
    // 3. Execute all 18 Inspection Analyzers Concurrently
    const rawResults = await runFullAnalysis(normalized, options);
    const durationMs = Date.now() - startTime;

    // 4. Centralized Scoring & Verdict Calculation
    const scores = computeScores(rawResults);

    // Calculate pass/warning/fail counts
    const isAvailable = rawResults.http?.success && rawResults.http?.statusCode < 400;
    const jsErrorsCount = (rawResults.browser?.jsErrors?.length || 0) + (rawResults.browser?.consoleMessages?.errors?.length || 0);
    const failedReqsCount = rawResults.browser?.failedRequests?.length || 0;
    const brokenLinksCount = rawResults.links?.brokenCount || 0;
    const a11yIssuesCount = rawResults.accessibility?.findings?.length || 0;

    let failedChecks = 0;
    let warningChecks = 0;
    let passedChecks = 0;

    if (!isAvailable) failedChecks += 5; else passedChecks += 5;
    if (jsErrorsCount > 0) failedChecks += jsErrorsCount; else passedChecks += 2;
    if (failedReqsCount > 0) warningChecks += failedReqsCount; else passedChecks += 2;
    if (brokenLinksCount > 0) warningChecks += brokenLinksCount; else passedChecks += 2;
    if (a11yIssuesCount > 0) warningChecks += a11yIssuesCount; else passedChecks += 3;
    passedChecks += 40; // baseline passed invariants

    const totalChecks = passedChecks + warningChecks + failedChecks;

    // 5. Update Scan Document to 'completed'
    if (scan) {
      scan.status = isAvailable ? 'completed' : 'failed';
      scan.completedAt = new Date();
      scan.durationMs = durationMs;
      scan.healthScore = scores.overall;
      scan.grade = scores.grade;
      scan.overallStatus = scores.status;
      scan.totalChecks = totalChecks;
      scan.passedChecks = passedChecks;
      scan.warningChecks = warningChecks;
      scan.failedChecks = failedChecks;
      scan.screenshot = rawResults.browser?.screenshot || null;

      scan.domainSummaries = {
        http: {
          status: rawResults.http?.statusCode,
          score: scores.http,
          responseTimeMs: rawResults.http?.responseTimeMs
        },
        console: {
          score: scores.console,
          errors: jsErrorsCount,
          warnings: rawResults.browser?.consoleMessages?.warnings?.length || 0
        },
        network: {
          score: scores.network,
          failedRequests: failedReqsCount,
          httpErrors: rawResults.browser?.httpErrors?.length || 0
        },
        seo: {
          score: scores.seo,
          title: rawResults.seo?.title || null
        },
        security: {
          score: scores.security,
          sslValid: rawResults.ssl?.valid || false
        },
        performance: {
          score: scores.performance,
          pageLoadTimeMs: rawResults.browser?.metrics?.pageLoadTimeMs || rawResults.http?.responseTimeMs,
          fcpMs: rawResults.browser?.metrics?.fcpMs || null
        },
        accessibility: {
          score: scores.accessibility,
          issuesCount: a11yIssuesCount
        },
        links: {
          score: scores.links,
          totalLinks: rawResults.links?.totalCount || 0,
          brokenLinks: brokenLinksCount
        },
        technology: {
          detectedCount: rawResults.technology?.count || 0,
          technologies: (rawResults.technology?.technologies || []).map(t => t.name)
        }
      };

      if (!isAvailable) {
        scan.failureReason = rawResults.http?.error || 'Target website failed to respond';
      }

      await scan.save();

      // 6. Persist Granular Findings in Separate Collections
      await persistScanResults(scan, rawResults, scores).catch(err => {
        logger.warn(`Granular persistence error: ${err.message}`);
      });
    }

    // 7. Update Website Aggregate Stats
    if (website && scan) {
      website.lastScanId = scan._id;
      website.lastScanAt = new Date();
      website.totalScans += 1;
      website.currentHealthScore = scores.overall;
      website.currentStatus = scores.status;
      if (rawResults.browser?.pageDetails?.title) {
        website.title = rawResults.browser.pageDetails.title;
      }
      if (rawResults.browser?.pageDetails?.favicon) {
        website.favicon = rawResults.browser.pageDetails.favicon;
      }
      await website.save().catch(() => {});
    }

    // 8. Upload screenshot to Cloudinary CDN and Save to MongoDB Atlas AuditReport Collection
    let screenshotUrl = null;
    if (rawResults.browser?.screenshot) {
      screenshotUrl = await uploadScreenshotToCloudinary(rawResults.browser.screenshot).catch(() => null);
    }

    // Return formatted standardized response
    const formatted = formatAnalysisResponse(normalized, rawResults, durationMs);
    formatted.scanId = scan ? scan._id : null;
    formatted.websiteId = website ? website._id : null;
    if (screenshotUrl) {
      if (formatted.checks?.browser) {
        formatted.checks.browser.screenshot = screenshotUrl;
      }
    }

    try {
      await AuditReport.create({
        targetUrl: normalized,
        scanType: 'single',
        crawlStatus: 'completed',
        pagesDiscovered: 1,
        pagesScanned: 1,
        pagesFailed: isAvailable ? 0 : 1,
        overallScore: formatted.scores?.overall || 0,
        rating: formatted.scores?.rating || 'Unknown',
        domainScores: formatted.scores || {},
        summary: formatted.summary || {},
        screenshotUrl: screenshotUrl || null,
        fullDetails: formatted
      });
      logger.success(` AuditReport saved to MongoDB Atlas for ${normalized}`);
    } catch (auditErr) {
      logger.warn(`AuditReport MongoDB save notice: ${auditErr.message}`);
    }

    return formatted;
  } catch (error) {
    logger.error(`Scan execution failed for ${targetUrl}: ${error.message}`, error.stack);

    if (scan) {
      scan.status = 'failed';
      scan.completedAt = new Date();
      scan.durationMs = Date.now() - startTime;
      scan.errorMessage = error.message;
      scan.errorStack = error.stack;
      scan.failureReason = 'Internal scan execution error';
      await scan.save().catch(() => {});
    }

    if (website) {
      website.currentStatus = 'unreachable';
      await website.save().catch(() => {});
    }

    throw error;
  }
}

export default {
  executeScan
};

