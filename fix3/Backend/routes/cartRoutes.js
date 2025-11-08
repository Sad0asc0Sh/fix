/**
 * ====================================
 * Cart Routes - مسیرهای سبد خرید
 * ====================================
 */

const express = require('express');
const router = express.Router();

// Controllers
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    getCartCount,
    validateCart,
    calculateShipping
} = require('../controllers/cartController');

// Validators
const {
    addToCartValidator,
    updateCartValidator,
    removeFromCartValidator,
    applyCouponValidator,
    calculateShippingValidator
} = require('../validators/cartValidator');

// Middleware
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { cache } = require('../middleware/cache');

// ======================================================
// تمام مسیرها نیاز به احراز هویت دارند
// ======================================================
router.use(protect);

// ======================================================
// دریافت سبد خرید
// ======================================================
router.get(
    '/',
    cache(60, { includeUserId: true }), // کش 1 دقیقه
    getCart
);

// ======================================================
// دریافت تعداد آیتم‌های سبد
// ======================================================
router.get(
    '/count',
    cache(60, { includeUserId: true }),
    getCartCount
);

// ======================================================
// افزودن به سبد خرید
// ======================================================
router.post(
    '/add',
    addToCartValidator,
    validate,
    addToCart
);

// ======================================================
// به‌روزرسانی سبد خرید
// ======================================================
router.put(
    '/update',
    updateCartValidator,
    validate,
    updateCartItem
);

// ======================================================
// حذف از سبد خرید
// ======================================================
router.delete(
    '/remove/:productId',
    removeFromCartValidator,
    validate,
    removeFromCart
);

// ======================================================
// خالی کردن سبد خرید
// ======================================================
router.delete(
    '/clear',
    clearCart
);

// ======================================================
// اعمال کد تخفیف
// ======================================================
router.post(
    '/apply-coupon',
    applyCouponValidator,
    validate,
    applyCoupon
);

// ======================================================
// حذف کد تخفیف
// ======================================================
router.delete(
    '/remove-coupon',
    removeCoupon
);

// ======================================================
// اعتبارسنجی سبد خرید (قبل از تسویه)
// ======================================================
router.post(
    '/validate',
    validateCart
);

// ======================================================
// محاسبه هزینه ارسال
// ======================================================
router.post(
    '/shipping',
    calculateShippingValidator,
    validate,
    calculateShipping
);

module.exports = router;