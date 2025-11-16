const express = require('express')
const router = express.Router()
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController')
const { protect, authorize } = require('../middleware/auth')

// ============================================
// GET /api/orders - دریافت لیست تمام سفارشات
// فقط برای ادمین
// ============================================
router.get('/', protect, authorize('admin', 'manager', 'superadmin'), getAllOrders)

// ============================================
// GET /api/orders/:id - دریافت جزئیات یک سفارش
// فقط برای ادمین
// ============================================
router.get('/:id', protect, authorize('admin', 'manager', 'superadmin'), getOrderById)

// ============================================
// PUT /api/orders/:id/status - به‌روزرسانی وضعیت سفارش
// فقط برای ادمین
// ============================================
router.put(
  '/:id/status',
  protect,
  authorize('admin', 'manager', 'superadmin'),
  updateOrderStatus,
)

module.exports = router
