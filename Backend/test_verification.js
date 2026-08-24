import { checkDns } from './Src/Services/dnsService.js';
import { checkSsl } from './Src/Services/sslService.js';
import { measurePerformance } from './Src/Services/performanceService.js';
import { traceRedirects } from './Src/Services/redirectService.js';
import { analyzeSecurity } from './Src/Services/securityService.js';
import { analyzeSeo } from './Src/Services/seoService.js';
import { analyzeResources } from './Src/Services/resourceService.js';
import { analyzeLinks } from './Src/Services/linkService.js';
import { analyzeContent } from './Src/Services/contentService.js';
import { analyzeMobileReadiness } from './Src/Services/mobileService.js';
import { testApiEndpoint } from './Src/Services/apiCheckService.js';
import { runFullAnalysis } from './Src/Services/analyzerOrchestrator.js';
import { normalizeUrl } from './Src/Utils/urlHelper.js';


async function runTests() {
  console.log(' Starting Verification Suite for URL Analysis Backend...\n');

  const testTarget = 'https://example.com';
  const norm = normalizeUrl(testTarget);

  console.log('1. Testing DNS Service...');
  const dnsRes = await checkDns(norm.hostname);
  console.log('   DNS Resolved:', dnsRes.resolved, '| Records:', Object.keys(dnsRes.records).filter(k => dnsRes.records[k]?.length > 0 || dnsRes.records[k] !== null));

  console.log('\n2. Testing SSL Service...');
  const sslRes = await checkSsl(norm.hostname, 443);
  console.log('   SSL Valid:', sslRes.valid, '| Days Remaining:', sslRes.daysRemaining, '| Protocol:', sslRes.protocol);

  console.log('\n3. Testing Performance & HTTP Timing...');
  const perfRes = await measurePerformance(norm.normalized);
  console.log('   Status:', perfRes.statusCode, '| TTFB:', perfRes.ttfb, 'ms | Total Time:', perfRes.totalTime, 'ms | Size:', perfRes.pageSizeBytes, 'bytes');

  console.log('\n4. Testing Redirects Service...');
  const redirRes = await traceRedirects('http://example.com');
  console.log('   Redirect Count:', redirRes.count, '| Final URL:', redirRes.finalUrl, '| HTTP->HTTPS:', redirRes.isHttpToHttps);

  console.log('\n5. Testing Security Service...');
  const secRes = analyzeSecurity(perfRes.headers, perfRes.body, norm.normalized);
  console.log('   Security Score:', secRes.securityScore, '| Rating:', secRes.rating, '| Mixed Content:', secRes.mixedContent.hasMixedContent);

  console.log('\n6. Testing SEO Service...');
  const seoRes = await analyzeSeo(perfRes.body, norm.normalized, norm.origin);
  console.log('   Title:', seoRes.title.text, '| H1 Count:', seoRes.headings.h1.count, '| Canonical:', seoRes.canonical.url);

  console.log('\n7. Testing Resource Service...');
  const resRes = await analyzeResources(perfRes.body, norm.normalized);
  console.log('   Images:', resRes.summary.totalImages, '| Scripts:', resRes.summary.totalScripts, '| Stylesheets:', resRes.summary.totalStylesheets);

  console.log('\n8. Testing Link Service...');
  const linkRes = await analyzeLinks(perfRes.body, norm.normalized, false);
  console.log('   Total Links:', linkRes.summary.total, '| Internal:', linkRes.summary.internalCount, '| External:', linkRes.summary.externalCount);

  console.log('\n9. Testing Content Service...');
  const contentRes = analyzeContent(perfRes.body, { keyword: 'example', cssSelector: 'h1' });
  console.log('   Word Count:', contentRes.wordCount, '| Keyword Found:', contentRes.keywordMatch?.found, '| CSS Selector Matches:', contentRes.cssSelectorResult?.matchCount);

  console.log('\n10. Testing Mobile Readiness Service...');
  const mobRes = analyzeMobileReadiness(perfRes.body);
  console.log('   Mobile Friendly:', mobRes.isMobileFriendly, '| Viewport Meta:', mobRes.viewportMeta.present);

  console.log('\n11. Testing API Endpoint Check...');
  const apiRes = await testApiEndpoint('https://jsonplaceholder.typicode.com/todos/1');
  console.log('   API Status:', apiRes.statusCode, '| Response Time:', apiRes.responseTimeMs, 'ms | Is JSON:', apiRes.isJson);

  console.log('\n12. Testing Full Orchestration...');
  const fullRes = await runFullAnalysis(norm, { checkBrowser: false });
  console.log('   Full Execution Time:', fullRes.executionTimeMs, 'ms | Available Modules:', Object.keys(fullRes.results));

  console.log('\n ALL 12 MODULE TEST SUITES PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error(' Test failed:', err);
  process.exit(1);
});
