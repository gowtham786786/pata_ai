const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

const { 
  locateAddress, 
  getHistory, 
  getDashboardStats, 
  checkCache, 
  submitFeedback, 
  getGeocodeLogs, 
  getCorrections,
  getUserRole
} = require('../controllers/locationController');

// Define API routes
router.get('/auth/role', verifyToken, getUserRole);
router.post('/locate', verifyToken, locateAddress);
router.post('/feedback', verifyToken, submitFeedback);
router.get('/history', verifyToken, getHistory);
router.get('/admin/dashboard', verifyToken, getDashboardStats);
router.get('/admin/geocode-logs', verifyToken, getGeocodeLogs);
router.get('/admin/corrections', verifyToken, getCorrections);
router.post('/cache', verifyToken, checkCache);

module.exports = router;
