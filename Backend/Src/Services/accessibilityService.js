const cheerio = require('cheerio');

/**
 * Performs accessibility (a11y) audit on HTML
 * @param {string} html
 * @param {string} baseUrl
 * @returns {object}
 */
function analyzeAccessibility(html = '', baseUrl = '') {
  const $ = cheerio.load(html || '');
  const issues = [];
  const passed = [];

  // 1. Missing Image Alt Attributes
  const images = $('img');
  let missingAltCount = 0;
  let emptyAltCount = 0;
  const missingAltSample = [];

  images.each((_, el) => {
    const alt = $(el).attr('alt');
    const src = $(el).attr('src') || $(el).attr('data-src') || '[unknown]';
    if (alt === undefined) {
      missingAltCount++;
      if (missingAltSample.length < 5) {
        missingAltSample.push({ src, issue: 'Missing alt attribute' });
      }
    } else if (alt.trim() === '') {
      emptyAltCount++;
    }
  });

  if (missingAltCount > 0) {
    issues.push({
      type: 'images_missing_alt',
      severity: 'high',
      title: 'Images Missing Alt Text',
      description: `${missingAltCount} image(s) lack an alt attribute, which prevents screen readers from describing the image.`,
      count: missingAltCount,
      sample: missingAltSample
    });
  } else if (images.length > 0) {
    passed.push({ title: 'All images have alt attributes', count: images.length });
  }

  // 2. Form Input Labels
  const inputs = $('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea');
  let unlabeledInputCount = 0;
  const unlabeledSample = [];

  inputs.each((_, el) => {
    const id = $(el).attr('id');
    const name = $(el).attr('name') || $(el).attr('type') || 'input';
    const ariaLabel = $(el).attr('aria-label');
    const ariaLabelledBy = $(el).attr('aria-labelledby');
    const hasLabel = id ? $(`label[for="${id}"]`).length > 0 : false;
    const isWrappedInLabel = $(el).closest('label').length > 0;

    if (!hasLabel && !isWrappedInLabel && !ariaLabel && !ariaLabelledBy) {
      unlabeledInputCount++;
      if (unlabeledSample.length < 5) {
        unlabeledSample.push({ name, id: id || null, type: $(el).attr('type') || el.tagName });
      }
    }
  });

  if (unlabeledInputCount > 0) {
    issues.push({
      type: 'unlabeled_form_controls',
      severity: 'high',
      title: 'Form Inputs Missing Labels',
      description: `${unlabeledInputCount} form input(s) are missing associated <label> elements or aria-label attributes.`,
      count: unlabeledInputCount,
      sample: unlabeledSample
    });
  } else if (inputs.length > 0) {
    passed.push({ title: 'All form controls are properly labeled', count: inputs.length });
  }

  // 3. Empty Buttons
  const buttons = $('button, a[role="button"]');
  let emptyButtonCount = 0;
  const emptyButtonSample = [];

  buttons.each((_, el) => {
    const text = $(el).text().trim();
    const ariaLabel = $(el).attr('aria-label');
    const ariaLabelledBy = $(el).attr('aria-labelledby');
    const title = $(el).attr('title');
    const hasImgAlt = $(el).find('img[alt]').filter((_, img) => $(img).attr('alt').trim().length > 0).length > 0;

    if (!text && !ariaLabel && !ariaLabelledBy && !title && !hasImgAlt) {
      emptyButtonCount++;
      if (emptyButtonSample.length < 5) {
        emptyButtonSample.push({ html: $.html(el).substring(0, 100) });
      }
    }
  });

  if (emptyButtonCount > 0) {
    issues.push({
      type: 'empty_buttons',
      severity: 'medium',
      title: 'Buttons Missing Accessible Text',
      description: `${emptyButtonCount} button(s) have no visible text or ARIA label.`,
      count: emptyButtonCount,
      sample: emptyButtonSample
    });
  } else if (buttons.length > 0) {
    passed.push({ title: 'All buttons have accessible names', count: buttons.length });
  }

  // 4. HTML Language Attribute
  const htmlLang = $('html').attr('lang');
  const hasLang = !!htmlLang && htmlLang.trim().length > 0;
  if (!hasLang) {
    issues.push({
      type: 'missing_html_lang',
      severity: 'medium',
      title: 'Missing HTML Language Attribute',
      description: 'The <html> tag is missing a lang attribute (e.g. <html lang="en">), required for screen reader speech synthesis.'
    });
  } else {
    passed.push({ title: `HTML lang attribute is defined ("${htmlLang}")` });
  }

  // 5. Document Title
  const title = $('title').text().trim();
  if (!title) {
    issues.push({
      type: 'missing_title',
      severity: 'high',
      title: 'Missing Document Title',
      description: 'The page lacks a <title> element, making navigation difficult for assistive technologies.'
    });
  } else {
    passed.push({ title: 'Page title is present' });
  }

  // 6. ARIA Landmarks and Roles
  const landmarks = {
    header: $('header, [role="banner"]').length,
    nav: $('nav, [role="navigation"]').length,
    main: $('main, [role="main"]').length,
    footer: $('footer, [role="contentinfo"]').length
  };

  const hasMainLandmark = landmarks.main > 0;
  if (!hasMainLandmark) {
    issues.push({
      type: 'missing_main_landmark',
      severity: 'low',
      title: 'Missing <main> Landmark',
      description: 'Page lacks a <main> landmark to help screen reader users skip directly to primary content.'
    });
  } else {
    passed.push({ title: 'Main landmark (<main>) is present' });
  }

  // 7. Calculate Accessibility Score (0-100)
  let score = 100;
  issues.forEach(issue => {
    if (issue.severity === 'high') score -= 25;
    else if (issue.severity === 'medium') score -= 15;
    else if (issue.severity === 'low') score -= 5;
  });
  score = Math.max(10, Math.min(100, score));

  return {
    score,
    rating: score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 50 ? 'Needs Improvement' : 'Poor',
    htmlLang: htmlLang || null,
    totalIssues: issues.length,
    issues,
    passed,
    stats: {
      totalImages: images.length,
      missingAltCount,
      emptyAltCount,
      totalInputs: inputs.length,
      unlabeledInputCount,
      totalButtons: buttons.length,
      emptyButtonCount,
      landmarks
    }
  };
}

module.exports = {
  analyzeAccessibility
};
