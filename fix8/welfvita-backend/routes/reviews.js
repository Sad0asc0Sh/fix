const express = require('express')
const router = express.Router()
const {
  getAllReviewsAsAdmin,
  updateReviewStatus, // (تأیید یا مخفی کردن)
  deleteReview,
  postAdminReply, // پاسخ ادمین به نظر
} = require('../controllers/reviewController')
const { protect, authorize } = require('../middleware/auth')

// (در آینده روت POST /:productId برای ثبت توسط کاربر خواهیم داشت)

// --- روت‌های ادمین ---
router.get('/admin', protect, authorize('admin', 'manager', 'superadmin'), getAllReviewsAsAdmin)
router.put('/:id/status', protect, authorize('admin', 'manager', 'superadmin'), updateReviewStatus) // برای isApproved
router.put('/:id/reply', protect, authorize('admin', 'manager', 'superadmin'), postAdminReply) // پاسخ ادمین
router.delete('/:id', protect, authorize('admin', 'manager', 'superadmin'), deleteReview)

module.exports = router
