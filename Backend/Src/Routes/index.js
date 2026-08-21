const express = require('express');
const router = express.Router();
const analyzeRoutes = require('./analyzeRoutes');
const websiteRoutes = require('./websiteRoutes');
const scanRoutes = require('./scanRoutes');
const crawlRoutes = require('./crawlRoutes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'URL Analysis & Website Inspector Engine',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount modular sub-routers
router.use('/websites', websiteRoutes);
router.use('/scans', scanRoutes);
router.use('/crawl', crawlRoutes);
router.use('/', analyzeRoutes);

module.exports = router;
