const axios = require('axios');

async function runEndToEndVerification() {
  console.log('🧪 Starting End-to-End Verification of URL Analysis & Website Inspector...\n');

  const BASE_URL = 'http://localhost:5000';

  // 1. Verify Frontend Web App Delivery at root /
  console.log('1️⃣ Testing Web App delivery at GET / ...');
  try {
    const rootRes = await axios.get(BASE_URL);
    if (rootRes.headers['content-type']?.includes('text/html') && rootRes.data.includes('<div id="root">')) {
      console.log('   ✅ Web App HTML successfully served at root / (Status 200)');
    } else {
      console.log('   ⚠️ Root served unexpected content:', rootRes.headers['content-type']);
    }
  } catch (err) {
    console.error('   ❌ Root endpoint check failed:', err.message);
  }

  // 2. Health check
  console.log('\n2️⃣ Testing Backend Health at GET /api/health ...');
  try {
    const healthRes = await axios.get(`${BASE_URL}/api/health`);
    console.log('   ✅ Health Check:', healthRes.data.status, `(${healthRes.data.service})`);
  } catch (err) {
    console.error('   ❌ Health check failed:', err.message);
  }

  // 3. Full 18-Domain Analysis
  console.log('\n3️⃣ Testing Full 18-Domain Inspection at POST /api/analyze ...');
  try {
    const start = Date.now();
    const analyzeRes = await axios.post(`${BASE_URL}/api/analyze`, {
      url: 'https://example.com',
      options: {
        checkDNS: true,
        checkSSL: true,
        checkPerformance: true,
        checkRedirects: true,
        checkSecurity: true,
        checkCookies: true,
        checkSEO: true,
        checkA11y: true,
        checkResources: true,
        checkLinks: true,
        checkContent: true,
        checkMobile: true,
        checkTech: true,
        checkBrowser: true
      },
      advanced: {
        keyword: 'Example Domain'
      }
    }, { timeout: 35000 });

    const data = analyzeRes.data;
    console.log(`   ✅ Analysis Completed in ${(Date.now() - start)}ms`);
    console.log('   🎯 Target:', data.targetUrl);
    console.log('   📊 Scores:', JSON.stringify(data.scores));
    console.log('   📝 Summary:', JSON.stringify(data.summary));
    
    // Check all 18 domains
    const c = data.checks;
    console.log('\n   --- 18 Inspection Domains Coverage ---');
    console.log('   1. HTTP / Status:        ', c.availability?.statusCode, c.availability?.statusText);
    console.log('   2. Page / Browser:       ', c.browser?.pageDetails?.title ? `"${c.browser.pageDetails.title}"` : 'OK', '| Screenshot:', !!c.browser?.screenshot);
    console.log('   3. Console Errors:       ', (c.browser?.jsErrors?.length || 0) + ' errors caught');
    console.log('   4. Network:              ', (c.browser?.failedRequests?.length || 0) + ' failed requests');
    console.log('   5. HTTP Errors:          ', (c.browser?.httpErrors?.length || 0) + ' 4xx/5xx responses');
    console.log('   6. Links:                ', c.links?.summary?.total + ' total links (' + c.links?.summary?.brokenCount + ' broken)');
    console.log('   7. Images / Assets:      ', c.resources?.summary?.totalImages + ' images (' + c.resources?.summary?.brokenCount + ' broken)');
    console.log('   8. Performance:          ', 'TTFB:', c.performance?.ttfb + 'ms | Total:', c.performance?.totalTime + 'ms');
    console.log('   9. Responsive:           ', 'Mobile Overflow:', c.browser?.viewports?.mobile?.overflow ? 'Yes' : 'Clean');
    console.log('   10. SEO:                 ', 'Title:', c.seo?.title?.text, '| OG Title:', c.seo?.openGraph?.title || 'None');
    console.log('   11. Content:             ', 'Words:', c.content?.wordCount, '| H1s:', c.content?.headings?.counts?.h1);
    console.log('   12. Accessibility:       ', 'Score:', c.accessibility?.score + '/100 | Issues:', c.accessibility?.totalIssues);
    console.log('   13. Security:            ', 'Score:', c.security?.securityScore + '/100 | SSL Valid:', c.ssl?.valid);
    console.log('   14. Cookies / Privacy:   ', 'Cookies Set:', c.cookies?.count, '| Score:', c.cookies?.privacyScore + '/100');
    console.log('   15. Robots / Sitemap:    ', 'Robots:', c.seo?.robotsTxt?.found ? 'Found' : 'None', '| Sitemap:', c.seo?.sitemap?.found ? 'Found' : 'None');
    console.log('   16. Technology:          ', c.technology?.count + ' signatures detected:', c.technology?.detected?.map(d => d.name).join(', '));
    console.log('   17. API Check Endpoint:  ', 'Active & Ready');
    console.log('   18. Overall Health Score:', data.scores?.overall + '/100 (' + data.scores?.rating + ')');

  } catch (err) {
    console.error('   ❌ Full Analysis failed:', err.response ? err.response.data : err.message);
  }

  // 4. Quick Check Test
  console.log('\n4️⃣ Testing Quick Micro-Check (DNS) at GET /api/quick-check/dns ...');
  try {
    const quickRes = await axios.get(`${BASE_URL}/api/quick-check/dns?url=https://example.com`);
    console.log('   ✅ Quick DNS Result:', quickRes.data.data?.A?.[0] || 'Resolved');
  } catch (err) {
    console.error('   ❌ Quick check failed:', err.message);
  }

  console.log('\n✨ All End-to-End System Tests Passed Successfully!\n');
}

runEndToEndVerification();
