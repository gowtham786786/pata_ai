const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

const { locateAddress, getHistory, getDashboardStats, checkCache } = require('../controllers/locationController');

// Define API routes
router.post('/locate', verifyToken, locateAddress);
router.get('/history', verifyToken, getHistory);
router.get('/admin/dashboard', verifyToken, getDashboardStats);
router.post('/cache', verifyToken, checkCache);

module.exports = router;
