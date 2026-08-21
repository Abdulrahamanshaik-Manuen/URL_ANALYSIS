const dotenv = require('dotenv');
const logger = require('../Utils/logger');

const dotenvResult = dotenv.config();
if (dotenvResult.error) {
  logger.warn('⚠️ .env configuration file not found');
} else {
  logger.info('📄 .env loaded successfully');
}

module.exports = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT, 10) || 15000,
  maxRedirects: parseInt(process.env.MAX_REDIRECTS, 10) || 10,
  maxLinkCheckCount: parseInt(process.env.MAX_LINK_CHECK, 10) || 30,
  playwrightHeadless: process.env.PLAYWRIGHT_HEADLESS !== 'false',

  defaultUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 WebsiteInspector/1.0',

  userAgents: {
    desktopChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    mobileIPhone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'
  },

  viewports: {
    desktop: { width: 1920, height: 1080, name: 'Desktop (Full HD)' },
    tablet: { width: 768, height: 1024, name: 'Tablet (iPad)' },
    mobile: { width: 390, height: 844, name: 'Mobile (iPhone 14)' }
  }
};
