const cheerio = require('cheerio');
const axios = require('axios');
const config = require('../Config/config');
const logger = require('../Utils/logger');

/**
 * Checks for robots.txt on the root origin
 * @param {string} origin
 * @returns {Promise<object>}
 */
async function checkRobotsTxt(origin) {
  const robotsUrl = `${origin}/robots.txt`;
  try {
    const res = await axios.get(robotsUrl, {
      timeout: 5000,
      headers: { 'User-Agent': config.defaultUserAgent },
      validateStatus: () => true
    });

    if (res.status === 200 && typeof res.data === 'string') {
      const lines = res.data.split('\n').map(l => l.trim()).filter(Boolean);
      const disallows = [];
      const sitemaps = [];

      lines.forEach(l => {
        if (/^disallow:/i.test(l)) {
          disallows.push(l.split(':')[1]?.trim() || '');
        } else if (/^sitemap:/i.test(l)) {
          sitemaps.push(l.substring(l.indexOf(':') + 1).trim());
        }
      });

      return {
        found: true,
        url: robotsUrl,
        statusCode: res.status,
        sitemapsFound: sitemaps,
        disallowCount: disallows.length,
        disallows: disallows.slice(0, 10),
        rawPreview: res.data.substring(0, 300)
      };
    }

    return { found: false, url: robotsUrl, statusCode: res.status, message: 'Robots.txt not found or non-200' };
  } catch (err) {
    return { found: false, url: robotsUrl, error: err.message };
  }
}

/**
 * Checks for sitemap.xml on the root origin
 * @param {string} origin
 * @returns {Promise<object>}
 */
async function checkSitemapXml(origin) {
  const sitemapUrl = `${origin}/sitemap.xml`;
  try {
    const res = await axios.get(sitemapUrl, {
      timeout: 5000,
      headers: { 'User-Agent': config.defaultUserAgent },
      validateStatus: () => true
    });

    if (res.status === 200 && typeof res.data === 'string' && (res.data.includes('<urlset') || res.data.includes('<sitemapindex'))) {
      const $ = cheerio.load(res.data, { xmlMode: true });
      const locs = $('loc').length;
      return {
        found: true,
        url: sitemapUrl,
        statusCode: res.status,
        isSitemapIndex: res.data.includes('<sitemapindex'),
        urlCount: locs,
        message: `Valid sitemap found containing ${locs} URL entries`
      };
    }

    return { found: false, url: sitemapUrl, statusCode: res.status, message: 'Sitemap.xml not accessible or invalid XML format' };
  } catch (err) {
    return { found: false, url: sitemapUrl, error: err.message };
  }
}

/**
 * Performs complete SEO analysis on HTML content
 * @param {string} html
 * @param {string} currentUrl
 * @param {string} origin
 * @returns {Promise<object>}
 */
async function analyzeSeo(html = '', currentUrl = '', origin = '') {
  const $ = cheerio.load(html || '');

  // 1. Title Tag
  const titleText = $('title').text().trim();
  const titleCheck = {
    text: titleText,
    length: titleText.length,
    status: titleText.length === 0 ? 'missing' : (titleText.length > 60 ? 'too_long' : (titleText.length < 10 ? 'too_short' : 'optimal')),
    recommendation: titleText.length === 0 ? 'Add a descriptive <title> tag' : (titleText.length > 60 ? 'Keep title under 60 characters' : null)
  };

  // 2. Meta Description
  const metaDesc = $('meta[name="description" i]').attr('content')?.trim() || '';
  const descCheck = {
    text: metaDesc,
    length: metaDesc.length,
    status: metaDesc.length === 0 ? 'missing' : (metaDesc.length > 160 ? 'too_long' : (metaDesc.length < 50 ? 'too_short' : 'optimal')),
    recommendation: metaDesc.length === 0 ? 'Add a compelling meta description tag' : null
  };

  // 3. Canonical Tag
  const canonical = $('link[rel="canonical" i]').attr('href')?.trim() || null;

  // 4. Meta Robots
  const metaRobots = $('meta[name="robots" i]').attr('content')?.trim() || 'index, follow';

  // 5. Headings
  const h1s = [];
  $('h1').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h1s.push(text);
  });
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;

  const headingsCheck = {
    h1: {
      count: h1s.length,
      items: h1s.slice(0, 5),
      status: h1s.length === 1 ? 'optimal' : (h1s.length === 0 ? 'missing' : 'multiple')
    },
    h2Count,
    h3Count
  };

  // 6. Open Graph
  const og = {};
  $('meta[property^="og:" i]').each((_, el) => {
    const prop = $(el).attr('property')?.toLowerCase();
    const content = $(el).attr('content');
    if (prop && content) {
      og[prop.replace('og:', '')] = content;
    }
  });

  // 7. Twitter Card
  const twitter = {};
  $('meta[name^="twitter:" i]').each((_, el) => {
    const name = $(el).attr('name')?.toLowerCase();
    const content = $(el).attr('content');
    if (name && content) {
      twitter[name.replace('twitter:', '')] = content;
    }
  });

  // 8. Favicon
  let favicon = $('link[rel*="icon" i]').attr('href') || '/favicon.ico';
  if (favicon && !favicon.startsWith('http')) {
    favicon = origin ? `${origin}${favicon.startsWith('/') ? '' : '/'}${favicon}` : favicon;
  }

  // 9. Robots.txt and Sitemap.xml (parallel fetch)
  const [robotsTxt, sitemap] = await Promise.all([
    origin ? checkRobotsTxt(origin) : Promise.resolve({ found: false }),
    origin ? checkSitemapXml(origin) : Promise.resolve({ found: false })
  ]);

  return {
    title: titleCheck,
    metaDescription: descCheck,
    canonical: {
      url: canonical,
      matchesCurrent: canonical ? (canonical === currentUrl || canonical === currentUrl + '/') : null
    },
    robotsDirective: metaRobots,
    headings: headingsCheck,
    openGraph: og,
    twitterCard: twitter,
    favicon: {
      url: favicon,
      found: !!favicon
    },
    robotsTxt,
    sitemap
  };
}

module.exports = {
  analyzeSeo,
  checkRobotsTxt,
  checkSitemapXml
};
