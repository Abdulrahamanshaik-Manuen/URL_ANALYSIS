const cheerio = require('cheerio');

/**
 * Performs deep content inspection, reading time, heading hierarchy, keyword matching, and CSS queries
 * @param {string} html
 * @param {object} [options={}]
 * @returns {object}
 */
function analyzeContent(html = '', options = {}) {
  const $ = cheerio.load(html || '');

  // Extract clean readable text
  const clean$ = cheerio.load(html || '');
  clean$('script, style, noscript, svg, nav, footer, header').remove();
  const mainText = clean$('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = mainText ? mainText.split(/\s+/).filter(Boolean).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Full body text
  const fullBodyText = $('body').text().replace(/\s+/g, ' ').trim();

  // Headings hierarchy inspection
  const headingsList = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const level = el.tagName.toLowerCase();
    const text = $(el).text().trim().replace(/\s+/g, ' ');
    if (text) {
      headingsList.push({ level, text: text.substring(0, 120) });
    }
  });

  const headingCounts = {
    h1: $('h1').length,
    h2: $('h2').length,
    h3: $('h3').length,
    h4: $('h4').length,
    h5: $('h5').length,
    h6: $('h6').length
  };

  // 1. Keyword check
  let keywordMatch = null;
  if (options.keyword && typeof options.keyword === 'string') {
    const kw = options.keyword.trim();
    if (kw) {
      const regex = new RegExp(kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
      const matches = fullBodyText.match(regex) || [];
      
      const snippets = [];
      let match;
      while ((match = regex.exec(fullBodyText)) !== null && snippets.length < 5) {
        const start = Math.max(0, match.index - 40);
        const end = Math.min(fullBodyText.length, match.index + kw.length + 40);
        snippets.push('...' + fullBodyText.substring(start, end) + '...');
      }

      keywordMatch = {
        keyword: kw,
        found: matches.length > 0,
        count: matches.length,
        snippets
      };
    }
  }

  // 2. Custom Regex Match
  let regexMatch = null;
  if (options.regex && typeof options.regex === 'string') {
    try {
      const userRegex = new RegExp(options.regex, 'g');
      const matches = fullBodyText.match(userRegex) || [];
      regexMatch = {
        pattern: options.regex,
        valid: true,
        found: matches.length > 0,
        count: matches.length,
        matches: matches.slice(0, 15)
      };
    } catch (err) {
      regexMatch = {
        pattern: options.regex,
        valid: false,
        error: `Invalid regular expression: ${err.message}`
      };
    }
  }

  // 3. CSS Selector query
  let cssSelectorResult = null;
  if (options.cssSelector && typeof options.cssSelector === 'string') {
    try {
      const selected = $(options.cssSelector);
      const elements = [];

      selected.each((idx, el) => {
        if (idx < 10) {
          elements.push({
            tagName: el.tagName,
            text: $(el).text().trim().substring(0, 150),
            attributes: el.attribs || {}
          });
        }
      });

      cssSelectorResult = {
        selector: options.cssSelector,
        valid: true,
        matchCount: selected.length,
        elements
      };
    } catch (err) {
      cssSelectorResult = {
        selector: options.cssSelector,
        valid: false,
        error: `Invalid CSS selector: ${err.message}`
      };
    }
  }

  // 4. Structural Tag Breakdown
  const structure = {
    paragraphs: $('p').length,
    totalHeadings: headingsList.length,
    headingCounts,
    tables: $('table').length,
    forms: $('form').length,
    inputs: $('input, textarea, select').length,
    lists: $('ul, ol').length,
    listItems: $('li').length,
    blockquotes: $('blockquote').length,
    codeBlocks: $('pre, code').length
  };

  return {
    wordCount,
    readingTimeMinutes,
    characterCount: fullBodyText.length,
    textPreview: fullBodyText.substring(0, 400) + (fullBodyText.length > 400 ? '...' : ''),
    headings: {
      counts: headingCounts,
      list: headingsList.slice(0, 30)
    },
    structure,
    keywordMatch,
    regexMatch,
    cssSelectorResult
  };
}

module.exports = {
  analyzeContent
};
