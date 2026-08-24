import * as cheerio from 'cheerio';

import axios from 'axios';
import { resolveUrl, isInternalLink } from '../Utils/urlHelper.js';
import config from '../Config/config.js';
import logger from '../Utils/logger.js';


/**
 * Validates links with concurrency control
 * @param {Array<object>} links
 * @param {number} maxChecks
 * @param {number} concurrency
 * @returns {Promise<{ broken: Array<object>, redirected: Array<object>, checkedCount: number }>}
 */
async function checkBrokenLinks(links, maxChecks = 25, concurrency = 5) {
  const uniqueUrls = new Map();
  links.forEach(l => {
    if (l.url && !uniqueUrls.has(l.url) && uniqueUrls.size < maxChecks) {
      uniqueUrls.set(l.url, l.text);
    }
  });

  const urlsToCheck = Array.from(uniqueUrls.entries()).map(([url, text]) => ({ url, text }));
  const broken = [];
  const redirected = [];

  let index = 0;
  async function worker() {
    while (index < urlsToCheck.length) {
      const item = urlsToCheck[index++];
      try {
        const res = await axios.head(item.url, {
          timeout: 4500,
          headers: { 'User-Agent': config.defaultUserAgent },
          maxRedirects: 0,
          validateStatus: () => true
        });

        if (res.status >= 400) {
          if (res.status === 405) {
            const getRes = await axios.get(item.url, {
              timeout: 4500,
              headers: { 'User-Agent': config.defaultUserAgent, 'Range': 'bytes=0-100' },
              validateStatus: () => true
            });
            if (getRes.status >= 400) {
              broken.push({ url: item.url, text: item.text, statusCode: getRes.status, statusText: getRes.statusText });
            }
          } else {
            broken.push({ url: item.url, text: item.text, statusCode: res.status, statusText: res.statusText });
          }
        } else if ([301, 302, 307, 308].includes(res.status)) {
          redirected.push({ url: item.url, text: item.text, statusCode: res.status, location: res.headers.location || null });
        }
      } catch (err) {
        broken.push({ url: item.url, text: item.text, error: err.message, statusCode: null });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, urlsToCheck.length) }, () => worker());
  await Promise.all(workers);

  return {
    broken,
    redirected,
    checkedCount: urlsToCheck.length
  };
}

/**
 * Analyzes all links on the HTML page
 * @param {string} html
 * @param {string} baseUrl
 * @param {boolean} [checkStatus=true]
 * @returns {Promise<object>}
 */
async function analyzeLinks(html = '', baseUrl = '', checkStatus = true) {
  const $ = cheerio.load(html || '');
  const urlObj = new URL(baseUrl);
  const baseOrigin = urlObj.origin;

  const internalLinks = [];
  const externalLinks = [];
  const emptyOrDeadLinks = [];
  const anchorLinks = [];
  const specialLinks = [];

  $('a').each((_, el) => {
    const rawHref = $(el).attr('href');
    const text = $(el).text().trim().replace(/\s+/g, ' ').substring(0, 80) || '';
    const rel = $(el).attr('rel') || null;
    const target = $(el).attr('target') || null;

    if (!rawHref || rawHref.trim() === '' || rawHref === '#' || rawHref.startsWith('javascript:void(0)')) {
      emptyOrDeadLinks.push({ href: rawHref || '[empty]', text: text || '[No Anchor Text]' });
      return;
    }

    if (rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
      specialLinks.push({ url: rawHref, text, type: rawHref.startsWith('mailto:') ? 'email' : 'phone' });
      return;
    }

    if (rawHref.startsWith('#')) {
      anchorLinks.push({ url: rawHref, text: text || rawHref });
      return;
    }

    const resolved = resolveUrl(rawHref, baseUrl);
    if (!resolved) return;

    const isInternal = isInternalLink(resolved, baseOrigin);
    const linkItem = { url: resolved, text: text || '[No Anchor Text]', rel, target, isInternal };

    if (isInternal) {
      internalLinks.push(linkItem);
    } else {
      externalLinks.push(linkItem);
    }
  });

  const allExtracts = [...internalLinks, ...externalLinks];
  let statusAudit = { broken: [], redirected: [], checkedCount: 0 };

  if (checkStatus && allExtracts.length > 0) {
    statusAudit = await checkBrokenLinks(allExtracts, config.maxLinkCheckCount, 6);
  }

  return {
    summary: {
      total: internalLinks.length + externalLinks.length + emptyOrDeadLinks.length + anchorLinks.length + specialLinks.length,
      internalCount: internalLinks.length,
      externalCount: externalLinks.length,
      emptyOrDeadCount: emptyOrDeadLinks.length,
      anchorCount: anchorLinks.length,
      specialCount: specialLinks.length,
      brokenCount: statusAudit.broken.length,
      redirectedCount: statusAudit.redirected.length,
      auditedSampleCount: statusAudit.checkedCount
    },
    internal: {
      count: internalLinks.length,
      sample: internalLinks.slice(0, 40)
    },
    external: {
      count: externalLinks.length,
      sample: externalLinks.slice(0, 40)
    },
    emptyOrDead: {
      count: emptyOrDeadLinks.length,
      sample: emptyOrDeadLinks.slice(0, 20)
    },
    anchor: {
      count: anchorLinks.length,
      sample: anchorLinks.slice(0, 15)
    },
    special: {
      count: specialLinks.length,
      sample: specialLinks.slice(0, 15)
    },
    broken: statusAudit.broken,
    redirected: statusAudit.redirected
  };
}

export {
  analyzeLinks,
  checkBrokenLinks
};

export default {
  analyzeLinks,
  checkBrokenLinks
};


