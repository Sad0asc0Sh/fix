const express = require('express')
const router = express.Router()

const { getDashboardStats } = require('../controllers/dashboardController')
const { protect, authorize } = require('../middleware/auth')

// دریافت تمام آمارهای داشبورد در یک API واحد
router.get(
  '/stats',
  protect,
  authorize('admin', 'manager', 'superadmin'),
  getDashboardStats,
)

module.exports = router

