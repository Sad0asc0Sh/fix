const express = require('express')
const router = express.Router()

const {
  getSalesReports,
  getProductReports,
  getCustomerReports,
} = require('../controllers/reportController')
const { protect, authorize } = require('../middleware/auth')

// گزارش فروش
router.get(
  '/sales',
  protect,
  authorize('admin', 'manager', 'superadmin'),
  getSalesReports,
)

// گزارش محصولات
router.get(
  '/products',
  protect,
  authorize('admin', 'manager', 'superadmin'),
  getProductReports,
)

// گزارش مشتریان
router.get(
  '/customers',
  protect,
  authorize('admin', 'manager', 'superadmin'),
  getCustomerReports,
)

module.exports = router

