/**
 * ====================================
 * Cart Validator - اعتبارسنجی سبد خرید
 * ====================================
 */

const { body, param } = require('express-validator');

// ======================================================
// اعتبارسنجی افزودن به سبد خرید
// ======================================================
exports.addToCartValidator = [
    body('productId')
        .notEmpty()
        .withMessage('شناسه محصول الزامی است')
        .isMongoId()
        .withMessage('شناسه محصول نامعتبر است'),

    body('quantity')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('تعداد باید بین ۱ تا ۱۰۰ باشد')
        .toInt(),

    body('variant')
        .optional()
        .isObject()
        .withMessage('اطلاعات نوع محصول باید یک شیء باشد'),

    body('variant.name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('نام نوع محصول باید بین ۱ تا ۵۰ کاراکتر باشد'),

    body('variant.value')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('مقدار نوع محصول باید بین ۱ تا ۵۰ کاراکتر باشد')
];

// ======================================================
// اعتبارسنجی به‌روزرسانی سبد خرید
// ======================================================
exports.updateCartValidator = [
    body('productId')
        .notEmpty()
        .withMessage('شناسه محصول الزامی است')
        .isMongoId()
        .withMessage('شناسه محصول نامعتبر است'),

    body('quantity')
        .notEmpty()
        .withMessage('تعداد الزامی است')
        .isInt({ min: 1, max: 100 })
        .withMessage('تعداد باید بین ۱ تا ۱۰۰ باشد')
        .toInt(),

    body('variant')
        .optional()
        .isObject()
        .withMessage('اطلاعات نوع محصول باید یک شیء باشد'),

    body('variant.name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('نام نوع محصول باید بین ۱ تا ۵۰ کاراکتر باشد'),

    body('variant.value')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('مقدار نوع محصول باید بین ۱ تا ۵۰ کاراکتر باشد')
];

// ======================================================
// اعتبارسنجی حذف از سبد خرید
// ======================================================
exports.removeFromCartValidator = [
    param('productId')
        .notEmpty()
        .withMessage('شناسه محصول الزامی است')
        .isMongoId()
        .withMessage('شناسه محصول نامعتبر است'),

    body('variant')
        .optional()
        .isObject()
        .withMessage('اطلاعات نوع محصول باید یک شیء باشد')
];

// ======================================================
// اعتبارسنجی کد تخفیف
// ======================================================
exports.applyCouponValidator = [
    body('code')
        .notEmpty()
        .withMessage('لطفاً کد تخفیف را وارد کنید')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('کد تخفیف باید بین ۳ تا ۵۰ کاراکتر باشد')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('کد تخفیف فقط می‌تواند شامل حروف بزرگ انگلیسی و اعداد باشد')
        .toUpperCase()
];

// ======================================================
// اعتبارسنجی محاسبه هزینه ارسال
// ======================================================
exports.calculateShippingValidator = [
    body('province')
        .notEmpty()
        .withMessage('لطفاً استان را انتخاب کنید')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('نام استان نامعتبر است')
        .matches(/^[\u0600-\u06FFa-zA-Z\s]+$/)
        .withMessage('نام استان فقط می‌تواند شامل حروف باشد'),

    body('city')
        .notEmpty()
        .withMessage('لطفاً شهر را انتخاب کنید')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('نام شهر نامعتبر است')
        .matches(/^[\u0600-\u06FFa-zA-Z\s]+$/)
        .withMessage('نام شهر فقط می‌تواند شامل حروف باشد')
];

// ======================================================
// اعتبارسنجی یادداشت سبد خرید
// ======================================================
exports.updateNotesValidator = [
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('یادداشت نباید بیشتر از ۵۰۰ کاراکتر باشد')
];