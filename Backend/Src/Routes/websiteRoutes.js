import express from 'express';
import * as websiteController from '../Controllers/websiteController.js';

const router = express.Router();

// GET /api/websites - List websites with pagination & search
router.get('/', websiteController.getWebsites);

// GET /api/websites/:id - Get single website details
router.get('/:id', websiteController.getWebsiteById);

// GET /api/websites/:id/scans - Get historical scans for website
router.get('/:id/scans', websiteController.getWebsiteScans);

// DELETE /api/websites/:id - Delete website and cascade delete scans
router.delete('/:id', websiteController.deleteWebsite);

export default router;

