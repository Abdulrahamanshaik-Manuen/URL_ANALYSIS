const axios = require('axios');
const app = require('./Server');

async function testLiveServer() {
  console.log('🌐 Testing Express Live Endpoints...');
  const baseUrl = 'http://localhost:5000/api';

  try {
    // 1. Health check
    console.log('1. Testing GET /api/health');
    const health = await axios.get(`${baseUrl}/health`);
    console.log('   Health Status:', health.data.status, '| Service:', health.data.service);

    // 2. Quick Check DNS
    console.log('\n2. Testing GET /api/quick-check/dns?url=https://example.com');
    const quickDns = await axios.get(`${baseUrl}/quick-check/dns?url=https://example.com`);
    console.log('   DNS Response Time:', quickDns.data.data.responseTimeMs, 'ms | A Records:', quickDns.data.data.records.a);

    // 3. API Check
    console.log('\n3. Testing POST /api/api-check');
    const apiCheck = await axios.post(`${baseUrl}/api-check`, {
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET'
    });
    console.log('   API Status:', apiCheck.data.data.statusCode, '| Schema properties:', Object.keys(apiCheck.data.data.schema.properties));

    // 4. Quick Check SSL
    console.log('\n4. Testing GET /api/quick-check/ssl?url=https://example.com');
    const quickSsl = await axios.get(`${baseUrl}/quick-check/ssl?url=https://example.com`);
    console.log('   SSL Valid:', quickSsl.data.data.valid, '| Days Remaining:', quickSsl.data.data.daysRemaining);

    console.log('\n🎉 ALL LIVE SERVER ENDPOINT TESTS PASSED WITH 200 OK!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Server Live Test Failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

setTimeout(testLiveServer, 1000);
