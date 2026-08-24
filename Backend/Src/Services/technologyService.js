import * as cheerio from 'cheerio';



/**
 * Detects technologies, server, CMS, frameworks, libraries, analytics, and CDNs
 * @param {object} headers
 * @param {string} html
 * @param {string} targetUrl
 * @returns {object}
 */
export function detectTechnologies(headers = {}, html = '', targetUrl = '') {

  const $ = cheerio.load(html || '');
  const lowerHeaders = {};
  Object.keys(headers).forEach(k => {
    lowerHeaders[k.toLowerCase()] = String(headers[k]);
  });

  const rawHtml = html || '';
  const htmlLower = rawHtml.toLowerCase();

  const technologies = {
    servers: [],
    cms: [],
    frameworks: [],
    cssLibraries: [],
    analytics: [],
    cdn: [],
    fonts: [],
    programmingLanguages: []
  };

  // 1. Web Servers
  const serverHeader = lowerHeaders['server'] || '';
  if (serverHeader) {
    if (/nginx/i.test(serverHeader)) technologies.servers.push({ name: 'Nginx', version: serverHeader });
    else if (/apache/i.test(serverHeader)) technologies.servers.push({ name: 'Apache', version: serverHeader });
    else if (/cloudflare/i.test(serverHeader)) technologies.servers.push({ name: 'Cloudflare Server' });
    else if (/litespeed/i.test(serverHeader)) technologies.servers.push({ name: 'LiteSpeed' });
    else if (/caddy/i.test(serverHeader)) technologies.servers.push({ name: 'Caddy' });
    else if (/microsoft-iis/i.test(serverHeader)) technologies.servers.push({ name: 'Microsoft IIS', version: serverHeader });
    else technologies.servers.push({ name: serverHeader });
  }

  // 2. CMS & Platforms
  if (htmlLower.includes('wp-content') || htmlLower.includes('wp-includes') || $('meta[name="generator" i][content*="wordpress" i]').length > 0) {
    technologies.cms.push({ name: 'WordPress', category: 'CMS' });
  }
  if (htmlLower.includes('cdn.shopify.com') || htmlLower.includes('shopify.theme') || $('meta[name="generator" i][content*="shopify" i]').length > 0) {
    technologies.cms.push({ name: 'Shopify', category: 'E-Commerce' });
  }
  if (htmlLower.includes('static.wixstatic.com') || htmlLower.includes('wix-site')) {
    technologies.cms.push({ name: 'Wix', category: 'Website Builder' });
  }
  if (htmlLower.includes('squarespace-cdn.com') || htmlLower.includes('squarespace')) {
    technologies.cms.push({ name: 'Squarespace', category: 'Website Builder' });
  }
  if (htmlLower.includes('ghost.org') || $('meta[name="generator" i][content*="ghost" i]').length > 0) {
    technologies.cms.push({ name: 'Ghost', category: 'CMS / Publishing' });
  }
  if (htmlLower.includes('webflow.com') || $('html[data-wf-page]').length > 0) {
    technologies.cms.push({ name: 'Webflow', category: 'Website Builder' });
  }
  if (htmlLower.includes('drupal.js') || $('meta[name="generator" i][content*="drupal" i]').length > 0) {
    technologies.cms.push({ name: 'Drupal', category: 'CMS' });
  }
  if (htmlLower.includes('magento') || htmlLower.includes('mage/cookies.js')) {
    technologies.cms.push({ name: 'Magento', category: 'E-Commerce' });
  }

  // 3. JavaScript Frameworks & UI Libraries
  if (htmlLower.includes('__next') || $('script[src*="/_next/"]').length > 0) {
    technologies.frameworks.push({ name: 'Next.js', category: 'React Framework' });
  }
  if (htmlLower.includes('react') || $('[data-reactroot], [data-react-helmet]').length > 0 || htmlLower.includes('react-dom')) {
    if (!technologies.frameworks.some(f => f.name === 'Next.js')) {
      technologies.frameworks.push({ name: 'React', category: 'JavaScript UI Library' });
    }
  }
  if (htmlLower.includes('__nuxt') || $('script[src*="/_nuxt/"]').length > 0) {
    technologies.frameworks.push({ name: 'Nuxt.js', category: 'Vue Framework' });
  }
  if (htmlLower.includes('vue.js') || htmlLower.includes('vue.min.js') || $('[data-v-]').length > 0) {
    if (!technologies.frameworks.some(f => f.name === 'Nuxt.js')) {
      technologies.frameworks.push({ name: 'Vue.js', category: 'JavaScript Framework' });
    }
  }
  if (htmlLower.includes('ng-version') || htmlLower.includes('angular.js') || $('[ng-app], [ng-version]').length > 0) {
    technologies.frameworks.push({ name: 'Angular', category: 'JavaScript Framework' });
  }
  if (htmlLower.includes('svelte') || htmlLower.includes('__svelte')) {
    technologies.frameworks.push({ name: 'Svelte', category: 'JavaScript UI Compiler' });
  }
  if (htmlLower.includes('remix-run') || htmlLower.includes('__remix')) {
    technologies.frameworks.push({ name: 'Remix', category: 'Fullstack Framework' });
  }
  if (htmlLower.includes('astro-island') || $('astro-island').length > 0) {
    technologies.frameworks.push({ name: 'Astro', category: 'Static Site Generator' });
  }
  if (htmlLower.includes('jquery.js') || htmlLower.includes('jquery.min.js') || htmlLower.includes('jquery-')) {
    technologies.frameworks.push({ name: 'jQuery', category: 'JavaScript Library' });
  }

  // 4. CSS Libraries
  if (htmlLower.includes('tailwind') || $('[class*="flex-col"], [class*="bg-"], [class*="text-"]').length > 10) {
    technologies.cssLibraries.push({ name: 'Tailwind CSS' });
  }
  if (htmlLower.includes('bootstrap') || $('link[href*="bootstrap"]').length > 0) {
    technologies.cssLibraries.push({ name: 'Bootstrap' });
  }
  if (htmlLower.includes('material-ui') || htmlLower.includes('mui')) {
    technologies.cssLibraries.push({ name: 'Material UI' });
  }

  // 5. Analytics & Tag Managers
  if (htmlLower.includes('googletagmanager.com/gtm.js') || htmlLower.includes('gtm-')) {
    technologies.analytics.push({ name: 'Google Tag Manager' });
  }
  if (htmlLower.includes('google-analytics.com') || htmlLower.includes('gtag(') || htmlLower.includes('ga(')) {
    technologies.analytics.push({ name: 'Google Analytics (GA4)' });
  }
  if (htmlLower.includes('static.hotjar.com') || htmlLower.includes('_hjsettings')) {
    technologies.analytics.push({ name: 'Hotjar' });
  }
  if (htmlLower.includes('connect.facebook.net/en_us/fbevents.js') || htmlLower.includes('fbq(')) {
    technologies.analytics.push({ name: 'Facebook Pixel' });
  }
  if (htmlLower.includes('cdn.segment.com/analytics.js')) {
    technologies.analytics.push({ name: 'Segment' });
  }

  // 6. CDN & Cloud Infrastructure
  if (lowerHeaders['cf-ray'] || serverHeader.includes('cloudflare')) {
    technologies.cdn.push({ name: 'Cloudflare' });
  }
  if (lowerHeaders['x-amz-cf-id'] || lowerHeaders['x-cache']?.includes('cloudfront')) {
    technologies.cdn.push({ name: 'Amazon CloudFront' });
  }
  if (lowerHeaders['x-fastly-request-id'] || lowerHeaders['fastly-debug-digest']) {
    technologies.cdn.push({ name: 'Fastly' });
  }
  if (lowerHeaders['x-vercel-id']) {
    technologies.cdn.push({ name: 'Vercel Edge Network' });
  }
  if (lowerHeaders['x-nf-request-id']) {
    technologies.cdn.push({ name: 'Netlify' });
  }

  // 7. Fonts & Icons
  if ($('link[href*="fonts.googleapis.com"]').length > 0) {
    technologies.fonts.push({ name: 'Google Fonts' });
  }
  if ($('link[href*="use.typekit.net"]').length > 0) {
    technologies.fonts.push({ name: 'Adobe Fonts (Typekit)' });
  }
  if ($('link[href*="fontawesome"], script[src*="fontawesome"]').length > 0) {
    technologies.fonts.push({ name: 'Font Awesome' });
  }

  // 8. Backend Languages / X-Powered-By
  const poweredBy = lowerHeaders['x-powered-by'] || '';
  if (poweredBy) {
    technologies.programmingLanguages.push({ name: poweredBy, source: 'X-Powered-By Header' });
  }

  const allDetected = [
    ...technologies.servers,
    ...technologies.cms,
    ...technologies.frameworks,
    ...technologies.cssLibraries,
    ...technologies.analytics,
    ...technologies.cdn,
    ...technologies.fonts,
    ...technologies.programmingLanguages
  ];

  return {
    count: allDetected.length,
    detected: allDetected,
    byCategory: technologies
  };
}

export default {
  detectTechnologies
};

