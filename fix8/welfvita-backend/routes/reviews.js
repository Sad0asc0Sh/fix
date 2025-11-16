const express = require('express')
const router = express.Router()
const {
  getAllReviewsAsAdmin,
  updateReviewStatus, // (تأیید یا مخفی کردن)
  deleteReview,
} = require('../controllers/reviewController')
const { protect, authorize } = require('../middleware/auth')

// (در آینده روت POST /:productId برای ثبت توسط کاربر خواهیم داشت)

// --- روت‌های ادمین ---
router.get('/admin', protect, authorize('admin', 'superadmin'), getAllReviewsAsAdmin)
router.put('/:id/status', protect, authorize('admin', 'superadmin'), updateReviewStatus) // برای isApproved
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteReview)

module.exports = router
