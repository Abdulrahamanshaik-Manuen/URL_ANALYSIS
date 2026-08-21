const axios = require('axios');
const app = require('./Server');

async function testFullAnalyze() {
  console.log('🚀 Testing Full POST /api/analyze on live server...');
  try {
    const res = await axios.post('http://localhost:5000/api/analyze', {
      url: 'https://example.com',
      options: {
        checkDNS: true,
        checkSSL: true,
        checkPerformance: true,
        checkRedirects: true,
        checkSecurity: true,
        checkSEO: true,
        checkResources: true,
        checkLinks: true,
        checkContent: true,
        checkMobile: true,
        checkBrowser: true
      },
      advanced: {
        keyword: 'Example Domain',
        cssSelector: 'h1'
      }
    }, { timeout: 30000 });

    console.log('✅ Analysis Success:', res.data.success);
    console.log('   Target URL:', res.data.targetUrl);
    console.log('   Scores:', res.data.scores);
    console.log('   Summary:', res.data.summary);
    console.log('   SEO Title:', res.data.checks.seo?.title);
    console.log('   Security Score:', res.data.checks.security?.securityScore);
    console.log('   Browser Screenshot Captured:', !!res.data.checks.browser?.screenshot);
    console.log('   Total Execution Time:', res.data.executionTimeMs, 'ms');

    process.exit(0);
  } catch (err) {
    console.error('❌ Full Analysis Failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

setTimeout(testFullAnalyze, 1000);
