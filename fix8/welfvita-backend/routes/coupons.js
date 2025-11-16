const express = require('express')
const router = express.Router()
const {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} = require('../controllers/couponController')
const { protect, authorize } = require('../middleware/auth')

// ============================================
// GET /api/coupons/validate/:code - اعتبارسنجی کد تخفیف
// این روت برای کاربران عادی (در فرانت‌اند سایت) است
// پارامتر query: totalPrice (مبلغ کل سبد خرید)
// ============================================
router.get('/validate/:code', validateCoupon)

// ============================================
// POST /api/coupons - ایجاد کوپن جدید
// فقط برای ادمین، مدیر و سوپرادمین
// Body:
//   - code: کد تخفیف (الزامی)
//   - discountType: نوع تخفیف - percent یا fixed (الزامی)
//   - discountValue: مقدار تخفیف (الزامی)
//   - minPurchase: حداقل خرید (اختیاری)
//   - expiresAt: تاریخ انقضا (الزامی)
//   - isActive: وضعیت فعال/غیرفعال (اختیاری)
//   - usageLimit: محدودیت تعداد استفاده (اختیاری)
// ============================================
router.post('/', protect, authorize('admin', 'manager', 'superadmin'), createCoupon)

// ============================================
// GET /api/coupons - دریافت لیست کوپن‌ها
// فقط برای ادمین
// پارامترهای Query:
//   - page: شماره صفحه (پیش‌فرض: 1)
//   - limit: تعداد آیتم در هر صفحه (پیش‌فرض: 20)
//   - isActive: فیلتر بر اساس وضعیت (true/false)
//   - discountType: فیلتر بر اساس نوع تخفیف (percent/fixed)
//   - search: جستجو در کد تخفیف
// ============================================
router.get('/', protect, authorize('admin', 'manager', 'superadmin'), getAllCoupons)

// ============================================
// GET /api/coupons/:id - دریافت جزئیات یک کوپن
// فقط برای ادمین
// ============================================
router.get('/:id', protect, authorize('admin', 'manager', 'superadmin'), getCouponById)

// ============================================
// PUT /api/coupons/:id - به‌روزرسانی کوپن
// فقط برای ادمین
// Body: مشابه POST
// ============================================
router.put('/:id', protect, authorize('admin', 'manager', 'superadmin'), updateCoupon)

// ============================================
// DELETE /api/coupons/:id - حذف کوپن
// فقط برای سوپرادمین
// ============================================
router.delete('/:id', protect, authorize('superadmin'), deleteCoupon)

module.exports = router
