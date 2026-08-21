const express = require('express');
const router = express.Router();

const { getAllProducts, getProductById, getCategories } = require('../Controller/productController');
const { getLiveRates } = require('../Controller/rateController');
const { createInquiry, getAllInquiries } = require('../Controller/inquiryController');
const config = require('../Config/config');

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    serverTime: new Date().toISOString(),
    company: config.company.name,
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Company Info
router.get('/company', (req, res) => {
  res.status(200).json({
    success: true,
    data: config.company
  });
});

// Product Routes
router.get('/products', getAllProducts);
router.get('/products/categories', getCategories);
router.get('/products/:id', getProductById);

// Live Rate Routes
router.get('/rates', getLiveRates);

// Inquiry / Quotation Routes
router.post('/inquiries', createInquiry);
router.get('/inquiries', getAllInquiries);

module.exports = router;
