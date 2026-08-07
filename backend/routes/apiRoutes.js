const express = require('express');
const router = express.Router();

const { locateAddress, getHistory, getDashboardStats, checkCache } = require('../controllers/locationController');

// Define API routes
router.post('/locate', locateAddress);
router.get('/history', getHistory);
router.get('/admin/dashboard', getDashboardStats);
router.post('/cache', checkCache);

module.exports = router;
