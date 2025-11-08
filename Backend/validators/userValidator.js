/**
 * ====================================
 * User Validator - اعتبارسنجی کاربر
 * ====================================
 */

const { body, param } = require('express-validator');

// ======================================================
// اعتبارسنجی به‌روزرسانی پروفایل
// ======================================================
exports.updateProfileValidator = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('نام باید بین ۲ تا ۵۰ کاراکتر باشد')
        .matches(/^[\u0600-\u06FFa-zA-Z\s\u200C()]+$/)
        .withMessage('نام فقط می‌تواند شامل حروف فارسی یا انگلیسی باشد'),

    body('phone')
        .optional()
        .trim()
        .matches(/^09\d{9}$/)
        .withMessage('شماره تلفن باید با 09 شروع شود و ۱۱ رقم باشد'),

    body('preferences.newsletter')
        .optional()
        .isBoolean()
        .withMessage('مقدار خبرنامه باید true یا false باشد'),

    body('preferences.notifications.email')
        .optional()
        .isBoolean()
        .withMessage('مقدار اعلان ایمیل باید true یا false باشد'),

    body('preferences.notifications.sms')
        .optional()
        .isBoolean()
        .withMessage('مقدار اعلان پیامکی باید true یا false باشد'),

    body('preferences.language')
        .optional()
        .isIn(['fa', 'en'])
        .withMessage('زبان باید fa یا en باشد')
];

// ======================================================
// اعتبارسنجی تغییر رمز عبور
// ======================================================
exports.changePasswordValidator = [
    body('currentPassword')
        .notEmpty()
        .withMessage('لطفاً رمز عبور فعلی را وارد کنید'),

    body('newPassword')
        .notEmpty()
        .withMessage('لطفاً رمز عبور جدید را وارد کنید')
        .isLength({ min: 6, max: 128 })
        .withMessage('رمز عبور جدید باید بین ۶ تا ۱۲۸ کاراکتر باشد')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('رمز عبور باید شامل حروف بزرگ، کوچک و عدد باشد'),

    body('confirmPassword')
        .notEmpty()
        .withMessage('لطفاً تکرار رمز عبور را وارد کنید')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('تکرار رمز عبور مطابقت ندارد');
            }
            return true;
        })
];

// ======================================================
// اعتبارسنجی افزودن آدرس
// ======================================================
exports.addAddressValidator = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('عنوان آدرس باید بین ۲ تا ۵۰ کاراکتر باشد'),

    body('recipientName')
        .notEmpty()
        .withMessage('لطفاً نام گیرنده را وارد کنید')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('نام گیرنده باید بین ۲ تا ۵۰ کاراکتر باشد')
        .matches(/^[\u0600-\u06FFa-zA-Z\s]+$/)
        .withMessage('نام گیرنده فقط می‌تواند شامل حروف باشد'),

    body('phone')
        .notEmpty()
        .withMessage('لطفاً شماره تماس را وارد کنید')
        .trim()
        .matches(/^09\d{9}$/)
        .withMessage('شماره تلفن باید با 09 شروع شود و ۱۱ رقم باشد'),

    body('province')
        .notEmpty()
        .withMessage('لطفاً استان را انتخاب کنید')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('نام استان نامعتبر است'),

    body('city')
        .notEmpty()
        .withMessage('لطفاً شهر را انتخاب کنید')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('نام شهر نامعتبر است'),

    body('address')
        .notEmpty()
        .withMessage('لطفاً آدرس کامل را وارد کنید')
        .trim()
        .isLength({ min: 10, max: 300 })
        .withMessage('آدرس باید بین ۱۰ تا ۳۰۰ کاراکتر باشد'),

    body('postalCode')
        .notEmpty()
        .withMessage('لطفاً کد پستی را وارد کنید')
        .trim()
        .matches(/^\d{10}$/)
        .withMessage('کد پستی باید ۱۰ رقم باشد')
        .isNumeric()
        .withMessage('کد پستی فقط باید شامل اعداد باشد'),

    body('plaque')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('پلاک نباید بیشتر از ۲۰ کاراکتر باشد'),

    body('unit')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('واحد نباید بیشتر از ۲۰ کاراکتر باشد'),

    body('isDefault')
        .optional()
        .isBoolean()
        .withMessage('مقدار پیش‌فرض باید true یا false باشد')
];

// ======================================================
// اعتبارسنجی به‌روزرسانی آدرس
// ======================================================
exports.updateAddressValidator = [
    param('id')
        .notEmpty()
        .withMessage('شناسه آدرس الزامی است')
        .isMongoId()
        .withMessage('شناسه آدرس نامعتبر است'),

    ...exports.addAddressValidator // استفاده مجدد از validator افزودن آدرس
];

// ======================================================
// اعتبارسنجی شناسه آدرس
// ======================================================
exports.addressIdValidator = [
    param('id')
        .notEmpty()
        .withMessage('شناسه آدرس الزامی است')
        .isMongoId()
        .withMessage('شناسه آدرس نامعتبر است')
];

// ======================================================
// اعتبارسنجی شناسه سفارش
// ======================================================
exports.orderIdValidator = [
    param('id')
        .notEmpty()
        .withMessage('شناسه سفارش الزامی است')
        .isMongoId()
        .withMessage('شناسه سفارش نامعتبر است')
];

// ======================================================
// اعتبارسنجی لغو سفارش
// ======================================================
exports.cancelOrderValidator = [
    param('id')
        .notEmpty()
        .withMessage('شناسه سفارش الزامی است')
        .isMongoId()
        .withMessage('شناسه سفارش نامعتبر است'),

    body('reason')
        .optional()
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('دلیل لغو باید بین ۵ تا ۵۰۰ کاراکتر باشد')
];

// ======================================================
// اعتبارسنجی حذف حساب
// ======================================================
exports.deleteAccountValidator = [
    body('password')
        .notEmpty()
        .withMessage('لطفاً رمز عبور خود را برای تایید وارد کنید')
        .isLength({ min: 6 })
        .withMessage('رمز عبور نامعتبر است')
];

// ======================================================
// اعتبارسنجی Pagination
// ======================================================
exports.paginationValidator = [
    body('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('شماره صفحه باید عدد مثبت باشد'),

    body('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('تعداد آیتم‌ها باید بین ۱ تا ۱۰۰ باشد')
];