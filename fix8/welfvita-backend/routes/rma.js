const express = require('express')
const router = express.Router()
const {
  getAllRMAs,
  getRMAById,
  updateRMAStatus,
} = require('../controllers/rmaController')
const { protect, authorize } = require('../middleware/auth')

// ============================================
// GET /api/rma/admin - دریافت لیست تمام RMAها
// فقط برای ادمین
// ============================================
router.get('/admin', protect, authorize('admin', 'manager', 'superadmin'), getAllRMAs)

// ============================================
// GET /api/rma/:id - دریافت جزئیات یک RMA
// فقط برای ادمین
// ============================================
router.get('/:id', protect, authorize('admin', 'manager', 'superadmin'), getRMAById)

// ============================================
// PUT /api/rma/:id/status - به‌روزرسانی وضعیت RMA
// فقط برای ادمین
// ============================================
router.put(
  '/:id/status',
  protect,
  authorize('admin', 'manager', 'superadmin'),
  updateRMAStatus,
)

module.exports = router
