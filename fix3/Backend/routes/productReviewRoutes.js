// routes/productReviewRoutes.js
// روت‌های نظرات محصول (سازگار با کنترلرها، کش، ولیدیشن و ریت‌لیمیت)

const express = require('express');
const router = express.Router({ mergeParams: true }); // برای دسترسی به productId از روت والد

// Controllers
const { getByProduct, create } = require('../controllers/reviewController');

// Middleware
const { protect, requireEmailVerified } = require('../middleware/auth');
const { cache } = require('../middleware/cache');
const { reviewLimiter } = require('../middleware/rateLimiter');

// Validators (فرض بر این است که این‌ها در validators/reviewValidator.js تعریف شده‌اند و خودشان validate را صدا می‌زنند)
const {
  getProductReviewsValidator, // param('productId') + سایر چک‌ها
  createReviewValidator       // body('rating','comment') + param('productId')
} = require('../validators/reviewValidator');

// ==========================================
// /api/products/:productId/reviews
// ==========================================

// دریافت نظرات تاییدشده یک محصول (با کش)
router.get(
  '/',
  getProductReviewsValidator,     // ولیدیشن productId و پارامترها
  cache(60),                      // کش 1 دقیقه‌ای لیست نظرات
  getByProduct
);

// ثبت نظر جدید برای یک محصول (نیاز به ورود + ریت‌لیمیت + تایید ایمیل)
router.post(
  '/',
  protect,
  reviewLimiter,                  // محدودیت ثبت نظر (۱۰ نظر در ساعت)
  requireEmailVerified,           // کاربر باید ایمیل تایید شده داشته باشد
  createReviewValidator,          // ولیدیشن rating/comment/productId
  create
);

module.exports = router;