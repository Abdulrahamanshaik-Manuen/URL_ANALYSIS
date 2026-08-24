import express from 'express';
import analyzeRoutes from './analyzeRoutes.js';
import websiteRoutes from './websiteRoutes.js';
import scanRoutes from './scanRoutes.js';
import crawlRoutes from './crawlRoutes.js';
import * as historyController from '../Controllers/historyController.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'URL Analysis & Website Inspector Engine',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// History & Preferences API endpoints (MongoDB Atlas)
router.get('/history', historyController.getHistory);
router.get('/history/:id', historyController.getReportById);
router.delete('/history/:id', historyController.deleteReport);
router.get('/preferences', historyController.getPreferences);
router.post('/preferences', historyController.savePreferences);

// Mount modular sub-routers
router.use('/websites', websiteRoutes);
router.use('/scans', scanRoutes);
router.use('/crawl', crawlRoutes);
router.use('/', analyzeRoutes);

export default router;

