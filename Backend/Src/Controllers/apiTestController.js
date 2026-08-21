const { testApiEndpoint } = require('../Services/apiCheckService');
const logger = require('../Utils/logger');

/**
 * Controller for dedicated API / Endpoint testing
 */
async function handleApiTest(req, res) {
  try {
    const { url, method = 'GET', headers, body, auth, timeout } = req.body;
    const normalizedUrl = req.normalizedUrl;

    logger.info(`Testing API endpoint: [${method}] ${normalizedUrl.normalized}`);

    const result = await testApiEndpoint(normalizedUrl.normalized, {
      method,
      headers,
      body,
      auth,
      timeout
    });

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: result
    });
  } catch (err) {
    logger.error(`API test error: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to complete API endpoint test',
      message: err.message
    });
  }
}

module.exports = {
  handleApiTest
};
