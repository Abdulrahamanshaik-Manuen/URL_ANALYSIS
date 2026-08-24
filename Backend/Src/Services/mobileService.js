import * as cheerio from 'cheerio';


/**
 * Checks mobile readiness from HTML and viewport meta tags
 * @param {string} html
 * @returns {object}
 */
export function analyzeMobileReadiness(html = '') {
  const $ = cheerio.load(html || '');

  const viewportMeta = $('meta[name="viewport" i]').attr('content') || null;
  const hasViewportMeta = !!viewportMeta;
  const isWidthDeviceWidth = hasViewportMeta ? /width\s*=\s*device-width/i.test(viewportMeta) : false;
  const hasInitialScale = hasViewportMeta ? /initial-scale\s*=\s*1/i.test(viewportMeta) : false;

  // Media queries check in inline styles or style tags
  let hasMediaQueries = false;
  $('style').each((_, el) => {
    const css = $(el).text();
    if (/@media/i.test(css)) {
      hasMediaQueries = true;
    }
  });

  const mobileScore = (hasViewportMeta ? 40 : 0) + (isWidthDeviceWidth ? 30 : 0) + (hasInitialScale ? 20 : 0) + (hasMediaQueries ? 10 : 0);

  return {
    isMobileFriendly: hasViewportMeta && isWidthDeviceWidth,
    score: mobileScore,
    viewportMeta: {
      present: hasViewportMeta,
      content: viewportMeta,
      hasWidthDeviceWidth: isWidthDeviceWidth,
      hasInitialScale: hasInitialScale
    },
    responsiveIndicators: {
      hasMediaQueries,
      touchIcons: $('link[rel*="apple-touch-icon" i]').length > 0
    },
    recommendation: !hasViewportMeta
      ? 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> for mobile responsiveness'
      : null
  };
}

export default {
  analyzeMobileReadiness
};

