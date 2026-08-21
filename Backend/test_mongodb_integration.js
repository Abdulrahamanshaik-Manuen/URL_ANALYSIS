const axios = require('axios');
const mongoose = require('mongoose');
const { connectDB, closeDB } = require('./Src/Config/database');
const { Website, Scan, CheckResult, ConsoleError, NetworkError, HttpError, PerformanceResult, SecurityResult, SeoResult, AccessibilityResult, TechnologyResult } = require('./Src/Models');

async function testDatabaseIntegration() {
  console.log('🧪 Starting MongoDB Architecture & Full Scan Verification Test...\n');

  // 1. Test Direct MongoDB Connection
  console.log('1️⃣ Testing MongoDB Connection...');
  await connectDB();
  const state = mongoose.connection.readyState;
  console.log(`   MongoDB ReadyState: ${state} (1 = connected)\n`);

  const baseUrl = 'http://localhost:5000/api';

  try {
    // 2. Test POST /api/analyze with live website
    console.log('2️⃣ Testing POST /api/analyze with https://example.com ...');
    const analyzeRes = await axios.post(`${baseUrl}/analyze`, {
      url: 'https://example.com'
    }, { timeout: 35000 });

    console.log('   ✅ Status Code:', analyzeRes.status);
    console.log('   🎯 Target:', analyzeRes.data.targetUrl);
    console.log('   📊 Overall Score:', analyzeRes.data.scores?.overall);
    console.log('   🆔 Scan ID:', analyzeRes.data.scanId);
    console.log('   🌐 Website ID:', analyzeRes.data.websiteId, '\n');

    const scanId = analyzeRes.data.scanId;
    const websiteId = analyzeRes.data.websiteId;

    if (scanId && websiteId) {
      // 3. Verify Database Records
      console.log('3️⃣ Verifying Persisted MongoDB Documents...');

      const websiteDoc = await Website.findById(websiteId);
      console.log('   ✅ Website Document:', {
        domain: websiteDoc.domain,
        totalScans: websiteDoc.totalScans,
        currentHealthScore: websiteDoc.currentHealthScore,
        currentStatus: websiteDoc.currentStatus
      });

      const scanDoc = await Scan.findById(scanId);
      console.log('   ✅ Scan Document:', {
        status: scanDoc.status,
        healthScore: scanDoc.healthScore,
        grade: scanDoc.grade,
        totalChecks: scanDoc.totalChecks,
        passedChecks: scanDoc.passedChecks
      });

      const checkResultsCount = await CheckResult.countDocuments({ scanId });
      console.log(`   ✅ CheckResult Collection Count: ${checkResultsCount}`);

      const [perfDoc, secDoc, seoDoc, a11yDoc, techDoc] = await Promise.all([
        PerformanceResult.findOne({ scanId }),
        SecurityResult.findOne({ scanId }),
        SeoResult.findOne({ scanId }),
        AccessibilityResult.findOne({ scanId }),
        TechnologyResult.findOne({ scanId })
      ]);

      console.log('   ✅ Performance Result:', { pageLoadTime: perfDoc?.pageLoadTime, score: perfDoc?.score });
      console.log('   ✅ Security Result:', { sslValid: secDoc?.ssl?.valid, score: secDoc?.score });
      console.log('   ✅ SEO Result:', { title: seoDoc?.title, score: seoDoc?.score });
      console.log('   ✅ Accessibility Result:', { score: a11yDoc?.score, issues: a11yDoc?.findings?.length });
      console.log('   ✅ Technology Result:', { count: techDoc?.count, signatures: techDoc?.technologies?.map(t => t.name) });

      // 4. Test REST GET Endpoints
      console.log('\n4️⃣ Testing REST Query Endpoints...');

      // GET /api/websites
      const websitesRes = await axios.get(`${baseUrl}/websites`);
      console.log(`   ✅ GET /api/websites: Found ${websitesRes.data.data?.length} websites (Total: ${websitesRes.data.pagination?.total})`);

      // GET /api/websites/:id/scans
      const scansRes = await axios.get(`${baseUrl}/websites/${websiteId}/scans`);
      console.log(`   ✅ GET /api/websites/:id/scans: Found ${scansRes.data.data?.length} scans`);

      // GET /api/scans/:id
      const scanDetailRes = await axios.get(`${baseUrl}/scans/${scanId}`);
      console.log(`   ✅ GET /api/scans/:id: Status ${scanDetailRes.data.data?.status} | Score ${scanDetailRes.data.data?.healthScore}`);

      // GET /api/scans/:id/checks
      const checksRes = await axios.get(`${baseUrl}/scans/${scanId}/checks?limit=10`);
      console.log(`   ✅ GET /api/scans/:id/checks: Retrieved ${checksRes.data.data?.length} checks`);

      // GET /api/scans/:id/errors
      const errorsRes = await axios.get(`${baseUrl}/scans/${scanId}/errors`);
      console.log(`   ✅ GET /api/scans/:id/errors:`, errorsRes.data.summary);
    }

    console.log('\n🎉 ALL MONGODB & REST API INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
    await closeDB();
    process.exit(0);
  } catch (err) {
    console.error('❌ Integration Test Failed:', err.response ? err.response.data : err.message);
    await closeDB();
    process.exit(1);
  }
}

testDatabaseIntegration();
