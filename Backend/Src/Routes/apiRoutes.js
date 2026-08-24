import express from 'express';
import config from '../Config/config.js';

const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    serverTime: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Company Info
router.get('/company', (req, res) => {
  res.status(200).json({
    success: true,
    data: config.company || {}
  });
});

export default router;

