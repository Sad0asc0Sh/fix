// validators/authValidator.js
// اعتبارسنجی کامل Auth (سازگار با کنترلرها و روت‌های فعلی)

const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

// الگوی پیچیدگی رمز عبور: حداقل یک حرف کوچک، یک حرف بزرگ و یک رقم
const passwordComplexity = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

/**
 * ثبت‌نام کاربر
 * POST /api/auth/register
 */
const registerValidator = [
  body('name')
    .notEmpty().withMessage('نام الزامی است')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('نام باید بین ۲ تا ۵۰ کاراکتر باشد')
    .matches(/^[\u0600-\u06FFa-zA-Z\s]+$/).withMessage('نام فقط می‌تواند شامل حروف باشد'),

  body('email')
    .notEmpty().withMessage('ایمیل الزامی است')
    .isEmail().withMessage('فرمت ایمیل معتبر نیست')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('ایمیل خیلی طولانی است'),

  body('password')
    .notEmpty().withMessage('رمز عبور الزامی است')
    .isLength({ min: 6, max: 128 }).withMessage('رمز عبور باید بین ۶ تا ۱۲۸ کاراکتر باشد')
    .matches(passwordComplexity).withMessage('رمز عبور باید شامل حداقل یک حرف بزرگ، یک حرف کوچک و یک عدد باشد'),

  validate
];

/**
 * ورود کاربر
 * POST /api/auth/login
 */
const loginValidator = [
  body('email')
    .notEmpty().withMessage('ایمیل الزامی است')
    .isEmail().withMessage('فرمت ایمیل معتبر نیست')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('رمز عبور الزامی است'),

  validate
];

/**
 * به‌روزرسانی پروفایل
 * PUT /api/auth/updateprofile
 */
const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('نام باید بین ۲ تا ۵۰ کاراکتر باشد')
    .matches(/^[\u0600-\u06FFa-zA-Z\s]+$/).withMessage('نام فقط می‌تواند شامل حروف باشد'),

  body('email')
    .optional()
    .isEmail().withMessage('فرمت ایمیل معتبر نیست')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('ایمیل خیلی طولانی است'),

  body('phone')
    .optional()
    .trim()
    .matches(/^09\d{9}$/).withMessage('شماره تلفن باید با 09 شروع شود و ۱۱ رقم باشد'),

  body('address')
    .optional()
    .isString().withMessage('آدرس باید متن باشد')
    .trim()
    .isLength({ min: 5, max: 300 }).withMessage('آدرس باید بین ۵ تا ۳۰۰ کاراکتر باشد'),

  validate
];

/**
 * تغییر رمز عبور
 * PUT /api/auth/changepassword
 */
const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('رمز عبور فعلی الزامی است'),

  body('newPassword')
    .notEmpty().withMessage('رمز عبور جدید الزامی است')
    .isLength({ min: 6, max: 128 }).withMessage('رمز عبور جدید باید بین ۶ تا ۱۲۸ کاراکتر باشد')
    .matches(passwordComplexity).withMessage('رمز عبور جدید باید شامل حداقل یک حرف بزرگ، یک حرف کوچک و یک عدد باشد')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('رمز عبور جدید نمی‌تواند با رمز عبور فعلی یکسان باشد');
      }
      return true;
    }),

  body('confirmPassword')
    .notEmpty().withMessage('تکرار رمز عبور الزامی است')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('تکرار رمز عبور مطابقت ندارد');
      }
      return true;
    }),

  validate
];

/**
 * فراموشی رمز عبور
 * POST /api/auth/forgotpassword
 */
const forgotPasswordValidator = [
  body('email')
    .notEmpty().withMessage('ایمیل الزامی است')
    .isEmail().withMessage('فرمت ایمیل معتبر نیست')
    .normalizeEmail(),

  validate
];

/**
 * بازنشانی رمز عبور
 * PUT /api/auth/resetpassword/:resettoken
 */
const resetPasswordValidator = [
  param('resettoken')
    .notEmpty().withMessage('توکن بازنشانی الزامی است')
    .isLength({ min: 20 }).withMessage('توکن نامعتبر است'),

  body('password')
    .notEmpty().withMessage('رمز عبور جدید الزامی است')
    .isLength({ min: 6, max: 128 }).withMessage('رمز عبور باید بین ۶ تا ۱۲۸ کاراکتر باشد')
    .matches(passwordComplexity).withMessage('رمز عبور باید شامل حداقل یک حرف بزرگ، یک حرف کوچک و یک عدد باشد'),

  body('confirmPassword')
    .notEmpty().withMessage('تکرار رمز عبور الزامی است')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('تکرار رمز عبور مطابقت ندارد');
      }
      return true;
    }),

  validate
];

module.exports = {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator
};