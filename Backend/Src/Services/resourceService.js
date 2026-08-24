import * as cheerio from 'cheerio';

import axios from 'axios';
import { resolveUrl } from '../Utils/urlHelper.js';
import config from '../Config/config.js';
import logger from '../Utils/logger.js';


/**
 * Checks a sample of resource URLs to see if any are broken (404/500/timeout)
 * @param {Array<string>} urls
 * @param {number} maxProbe
 * @returns {Promise<Array<object>>}
 */
async function probeBrokenResources(urls, maxProbe = 20) {
  const sample = urls.slice(0, maxProbe);
  const results = [];

  const checks = sample.map(async (resUrl) => {
    try {
      const res = await axios.head(resUrl, {
        timeout: 4000,
        headers: { 'User-Agent': config.defaultUserAgent },
        validateStatus: () => true
      });
      if (res.status >= 400) {
        results.push({ url: resUrl, statusCode: res.status, statusText: res.statusText, broken: true });
      }
    } catch (err) {
      results.push({ url: resUrl, error: err.message, broken: true });
    }
  });

  await Promise.allSettled(checks);
  return results;
}

/**
 * Analyzes all resources referenced within HTML
 * @param {string} html
 * @param {string} baseUrl
 * @returns {Promise<object>}
 */
export async function analyzeResources(html = '', baseUrl = '') {

  const $ = cheerio.load(html || '');

  const images = [];
  const stylesheets = [];
  const scripts = [];
  const fonts = [];
  const videos = [];
  const iframes = [];

  // 1. Images
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    const alt = $(el).attr('alt');
    const width = $(el).attr('width');
    const height = $(el).attr('height');
    const loading = $(el).attr('loading') || 'eager';
    const resolved = resolveUrl(src, baseUrl);

    if (resolved) {
      const ext = resolved.split('.').pop().split('?')[0].toLowerCase();
      const isModernFormat = ['webp', 'avif', 'svg'].includes(ext);

      images.push({
        url: resolved,
        alt: alt || null,
        hasAlt: typeof alt === 'string' && alt.trim().length > 0,
        hasDimensions: !!(width && height),
        width: width || null,
        height: height || null,
        format: ext,
        isModernFormat,
        loading
      });
    }
  });

  // 2. CSS Stylesheets
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href');
    const resolved = resolveUrl(href, baseUrl);
    if (resolved) {
      stylesheets.push({ url: resolved });
    }
  });

  // 3. JavaScript Files
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src');
    const resolved = resolveUrl(src, baseUrl);
    if (resolved) {
      scripts.push({
        url: resolved,
        async: $(el).attr('async') !== undefined,
        defer: $(el).attr('defer') !== undefined,
        type: $(el).attr('type') || 'text/javascript'
      });
    }
  });

  // 4. Fonts & Preloads
  $('link[rel="preload"][as="font"], link[href*=".woff"], link[href*=".woff2"]').each((_, el) => {
    const href = $(el).attr('href');
    const resolved = resolveUrl(href, baseUrl);
    if (resolved) fonts.push({ url: resolved });
  });

  // 5. Videos
  $('video, video source').each((_, el) => {
    const src = $(el).attr('src');
    const resolved = resolveUrl(src, baseUrl);
    if (resolved) videos.push({ url: resolved });
  });

  // 6. Iframes
  $('iframe').each((_, el) => {
    const src = $(el).attr('src');
    const resolved = resolveUrl(src, baseUrl);
    if (resolved) iframes.push({ url: resolved, title: $(el).attr('title') || null });
  });

  // Probe candidates for broken status
  const allCandidateUrls = [
    ...images.map(i => i.url),
    ...stylesheets.map(s => s.url),
    ...scripts.map(sc => sc.url)
  ];

  const brokenList = await probeBrokenResources(allCandidateUrls, 20);

  const imagesMissingAlt = images.filter(i => !i.hasAlt).length;
  const imagesMissingDimensions = images.filter(i => !i.hasDimensions).length;
  const legacyFormatImages = images.filter(i => !i.isModernFormat && ['png', 'jpg', 'jpeg'].includes(i.format)).length;

  return {
    summary: {
      totalImages: images.length,
      imagesMissingAlt,
      imagesMissingDimensions,
      legacyFormatImages,
      totalStylesheets: stylesheets.length,
      totalScripts: scripts.length,
      totalFonts: fonts.length,
      totalVideos: videos.length,
      totalIframes: iframes.length,
      brokenCount: brokenList.length
    },
    images: {
      count: images.length,
      missingAltCount: imagesMissingAlt,
      missingDimensionsCount: imagesMissingDimensions,
      sample: images.slice(0, 30)
    },
    stylesheets: {
      count: stylesheets.length,
      sample: stylesheets.slice(0, 15)
    },
    scripts: {
      count: scripts.length,
      sample: scripts.slice(0, 20)
    },
    fonts: {
      count: fonts.length,
      sample: fonts.slice(0, 10)
    },
    videos: {
      count: videos.length,
      sample: videos.slice(0, 5)
    },
    iframes: {
      count: iframes.length,
      sample: iframes.slice(0, 5)
    },
    broken: brokenList
  };
}

export default {
  analyzeResources
};

