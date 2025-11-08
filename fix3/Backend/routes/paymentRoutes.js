/**
 * ====================================
 * Payment Routes - مسیرهای پرداخت
 * ====================================
 */

const express = require('express');
const router = express.Router();

// Controllers
const {
    createPayment,
    verifyPayment,
    getPaymentById,
    getMyPayments,
    refundPayment,
    getPaymentStats
} = require('../controllers/paymentController');

// Middleware
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');

// ======================================================
// مسیر عمومی (Callback از درگاه)
// ======================================================
router.get('/verify', verifyPayment);

// ======================================================
// مسیرهای کاربر (نیاز به احراز هویت)
// ======================================================
router.use(protect);

// ایجاد پرداخت
router.post('/create', createPayment);

// دریافت لیست پرداخت‌های کاربر
router.get('/my-payments', getMyPayments);

// دریافت اطلاعات یک پرداخت
router.get('/:id', getPaymentById);

// ======================================================
// مسیرهای ادمین
// ======================================================

// آمار پرداخت‌ها
router.get('/admin/stats', isAdmin, getPaymentStats);

// بازگشت وجه
router.post('/:id/refund', isAdmin, refundPayment);

module.exports = router;