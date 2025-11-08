const express = require('express');
const router = express.Router();
const {
    getAllCoupons,
    getAvailableCoupons,
    getCoupon,
    validateCoupon,
    applyCouponToCart,
    removeCouponFromCart,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
    getCouponStats
} = require('../controllers/couponController');

const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { body, param } = require('express-validator');

// ======================================================
// Validation Rules
// ======================================================
const createCouponValidation = [
    body('code')
        .notEmpty().withMessage('کد تخفیف الزامی است')
        .isLength({ min: 3, max: 20 }).withMessage('کد تخفیف باید بین 3 تا 20 کاراکتر باشد')
        .matches(/^[A-Z0-9]+$/).withMessage('کد تخفیف فقط باید شامل حروف بزرگ انگلیسی و اعداد باشد'),
    body('type')
        .notEmpty().withMessage('نوع تخفیف الزامی است')
        .isIn(['percentage', 'fixed']).withMessage('نوع تخفیف باید percentage یا fixed باشد'),
    body('value')
        .notEmpty().withMessage('مقدار تخفیف الزامی است')
        .isNumeric().withMessage('مقدار تخفیف باید عدد باشد')
        .custom((value, { req }) => {
            if (req.body.type === 'percentage' && (value < 1 || value > 100)) {
                throw new Error('درصد تخفیف باید بین 1 تا 100 باشد');
            }
            if (value < 0) {
                throw new Error('مقدار تخفیف نمی‌تواند منفی باشد');
            }
            return true;
        }),
    body('validUntil')
        .notEmpty().withMessage('تاریخ انقضا الزامی است')
        .isISO8601().withMessage('فرمت تاریخ نامعتبر است'),
    body('minPurchase')
        .optional()
        .isNumeric().withMessage('حداقل خرید باید عدد باشد'),
    body('maxUses')
        .optional()
        .isInt({ min: 1 }).withMessage('حداکثر استفاده باید عدد مثبت باشد'),
    body('maxUsesPerUser')
        .optional()
        .isInt({ min: 1 }).withMessage('حداکثر استفاده هر کاربر باید عدد مثبت باشد')
];

const validateCouponValidation = [
    body('code')
        .notEmpty().withMessage('کد تخفیف الزامی است'),
    body('amount')
        .notEmpty().withMessage('مبلغ خرید الزامی است')
        .isNumeric().withMessage('مبلغ خرید باید عدد باشد')
        .custom(value => value > 0).withMessage('مبلغ خرید باید بیشتر از صفر باشد')
];

const applyCouponValidation = [
    body('code')
        .notEmpty().withMessage('کد تخفیف الزامی است')
];

// ======================================================
// Public Routes
// ======================================================

// ======================================================
// Protected Routes (User)
// ======================================================
router.use(protect);

// Get available coupons
router.get('/available', getAvailableCoupons);

// Validate coupon
router.post('/validate', validateCouponValidation, validate, validateCoupon);

// Apply coupon to cart
router.post('/apply', applyCouponValidation, validate, applyCouponToCart);

// Remove coupon from cart
router.delete('/remove', removeCouponFromCart);

// ======================================================
// Admin Routes
// ======================================================
router.use(authorize('admin'));

// Get all coupons
router.get('/', getAllCoupons);

// Create coupon
router.post('/', createCouponValidation, validate, createCoupon);

// Get single coupon
router.get('/:id', getCoupon);

// Update coupon
router.put('/:id', updateCoupon);

// Delete coupon
router.delete('/:id', deleteCoupon);

// Toggle coupon status
router.patch('/:id/toggle', toggleCouponStatus);

// Get coupon statistics
router.get('/:id/stats', getCouponStats);

module.exports = router;