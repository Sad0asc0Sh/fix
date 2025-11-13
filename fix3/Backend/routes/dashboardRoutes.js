const express = require('express');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');
const { getDashboardSummary } = require('../controllers/dashboardController');

const router = express.Router();

// GET /api/admin/dashboard/summary
router.get('/summary', protect, isAdmin, getDashboardSummary);

module.exports = router;

