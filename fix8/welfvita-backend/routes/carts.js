const express = require('express')
const router = express.Router()
const {
  getAbandonedCarts,
  getCartStats,
  sendEmailReminder,
  sendSmsReminder,
} = require('../controllers/cartController')
const { protect, authorize } = require('../middleware/auth')

// ============================================
// GET /api/carts/admin/abandoned - دریافت سبدهای رها شده
// فقط برای ادمین
// ============================================
router.get(
  '/admin/abandoned',
  protect,
  authorize('admin', 'manager', 'superadmin'),
  getAbandonedCarts,
)

// ============================================
// GET /api/carts/admin/stats - آمار سبدها
// فقط برای ادمین
// ============================================
router.get(
  '/admin/stats',
  protect,
  authorize('admin', 'manager', 'superadmin'),
  getCartStats,
)

// ============================================
// POST /api/carts/admin/remind/email/:cartId - ارسال یادآوری ایمیل
// فقط برای ادمین
// ============================================
router.post(
  '/admin/remind/email/:cartId',
  protect,
  authorize('admin', 'manager', 'superadmin'),
  sendEmailReminder,
)

// ============================================
// POST /api/carts/admin/remind/sms/:cartId - ارسال یادآوری پیامک
// فقط برای ادمین
// ============================================
router.post(
  '/admin/remind/sms/:cartId',
  protect,
  authorize('admin', 'manager', 'superadmin'),
  sendSmsReminder,
)

// در آینده روت‌های زیر برای فرانت‌اند سایت مشتری اضافه خواهد شد:
// POST   /api/carts          - افزودن آیتم به سبد
// GET    /api/carts/my-cart  - دریافت سبد فعلی کاربر
// PUT    /api/carts/my-cart  - به‌روزرسانی سبد
// DELETE /api/carts/my-cart  - حذف سبد

module.exports = router
