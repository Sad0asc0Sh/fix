// routes/adminReviewRoutes.js
// روت‌های مدیریتی نظرات محصول (سازگار با کنترلر و ولیدیشن‌های فعلی)

const express = require('express');
const router = express.Router();

// Controllers
const {
  adminDashboard,
  adminList,
  updateStatus,
  reply
} = require('../controllers/reviewController');

// Middleware
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');
const { cache } = require('../middleware/cache');
const { reviewLimiter } = require('../middleware/rateLimiter');

// Validators
const {
  updateStatusValidator,     // body.status = approved|rejected
  approveReviewValidator,    // body.isApproved → تبدیل به status
  replyValidator,            // body.text
  replyToReviewValidator     // body.reply → تبدیل به text
} = require('../validators/reviewValidator');

// فقط ادمین/منیجر
router.use(protect, isAdmin);

// داشبورد نظرات
// GET /api/admin/reviews/dashboard
router.get('/dashboard', cache(60), adminDashboard);

// لیست نظرات با فیلتر
// GET /api/admin/reviews
router.get('/', cache(60), adminList);

// تغییر وضعیت نظر: approved | rejected
// PUT /api/admin/reviews/:id/status
router.put('/:id/status', updateStatusValidator, updateStatus);

// تایید/رد با ورودی بولین (isApproved)
// PUT /api/admin/reviews/:id/approve
router.put('/:id/approve', approveReviewValidator, updateStatus);

// پاسخ به نظر
// POST /api/admin/reviews/:id/reply
router.post('/:id/reply', reviewLimiter, replyValidator, reply);

// (اختیاری) alias برای فیلد reply به‌جای text
// POST /api/admin/reviews/:id/reply-alias
router.post('/:id/reply-alias', reviewLimiter, replyToReviewValidator, reply);

module.exports = router;