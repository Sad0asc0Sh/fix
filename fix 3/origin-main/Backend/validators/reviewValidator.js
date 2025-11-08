// validators/reviewValidator.js
/**
 * ====================================
 * Review Validator - اعتبارسنجی نظرات (سازگار)
 * ====================================
 */

const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate');

// ابزار کمکی: قانون MongoId با پیام سفارشی
const mongoIdRule = (field = 'id', label = 'شناسه') =>
  param(field).notEmpty().withMessage(`${label} الزامی است`)
    .isMongoId().withMessage(`${label} نامعتبر است`);

const allowedStatuses = ['approved', 'rejected'];

/**
 * ایجاد نظر کاربر
 * مسیر: POST /api/products/:productId/reviews
 * توجه: productId از params می‌آید (نه از body)
 */
const createReviewValidator = [
  mongoIdRule('productId', 'شناسه محصول'),

  body('rating')
    .notEmpty().withMessage('امتیاز الزامی است')
    .isInt({ min: 1, max: 5 }).withMessage('امتیاز باید بین ۱ تا ۵ باشد')
    .toInt(),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('عنوان نظر باید بین ۳ تا ۱۰۰ کاراکتر باشد'),

  body('comment')
    .notEmpty().withMessage('متن نظر الزامی است')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('متن نظر باید بین ۱۰ تا ۱۰۰۰ کاراکتر باشد'),

  validate
];

/**
 * به‌روزرسانی نظر
 * مسیر: PUT /api/reviews/:id
 */
const updateReviewValidator = [
  mongoIdRule('id', 'شناسه نظر'),

  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('امتیاز باید بین ۱ تا ۵ باشد')
    .toInt(),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('عنوان نظر باید بین ۳ تا ۱۰۰ کاراکتر باشد'),

  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('متن نظر باید بین ۱۰ تا ۱۰۰۰ کاراکتر باشد'),

  validate
];

/**
 * حذف نظر
 * مسیر: DELETE /api/reviews/:id
 */
const deleteReviewValidator = [
  mongoIdRule('id', 'شناسه نظر'),
  validate
];

/**
 * دریافت نظرات یک محصول
 * مسیر: GET /api/products/:productId/reviews
 */
const getProductReviewsValidator = [
  mongoIdRule('productId', 'شناسه محصول'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('شماره صفحه باید عدد صحیح مثبت باشد')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('تعداد نتایج باید بین ۱ تا ۱۰۰ باشد')
    .toInt(),

  validate
];

/**
 * ادمین: تغییر وضعیت نظر (approved/rejected)
 * مسیر: PUT /api/admin/reviews/:id/status
 */
const updateStatusValidator = [
  mongoIdRule('id', 'شناسه نظر'),

  body('status')
    .notEmpty().withMessage('وضعیت جدید الزامی است')
    .isIn(allowedStatuses).withMessage(`وضعیت باید یکی از ${allowedStatuses.join(', ')} باشد`)
    .customSanitizer((v) => String(v).toLowerCase()),

  validate
];

/**
 * ادمین: تایید نظر به‌صورت بولین (alias برای سازگاری)
 * - ورودی: isApproved: true|false
 * - تبدیل خودکار به status: approved/rejected
 * مسیر: PUT /api/admin/reviews/:id/approve
 */
const approveReviewValidator = [
  mongoIdRule('id', 'شناسه نظر'),

  body('isApproved')
    .notEmpty().withMessage('وضعیت تایید الزامی است')
    .isBoolean().withMessage('وضعیت تایید باید true یا false باشد')
    .toBoolean()
    .custom((value, { req }) => {
      req.body.status = value ? 'approved' : 'rejected';
      return true;
    }),

  validate
];

/**
 * ادمین: پاسخ به نظر
 * مسیر: POST /api/admin/reviews/:id/reply
 */
const replyValidator = [
  mongoIdRule('id', 'شناسه نظر'),

  body('text')
    .notEmpty().withMessage('متن پاسخ الزامی است')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('پاسخ باید بین ۵ تا ۵۰۰ کاراکتر باشد'),

  validate
];

/**
 * ادمین: پاسخ به نظر (alias با فیلد reply)
 * - ورودی: reply
 * - تبدیل به text
 */
const replyToReviewValidator = [
  mongoIdRule('id', 'شناسه نظر'),

  body('reply')
    .notEmpty().withMessage('متن پاسخ الزامی است')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('پاسخ باید بین ۵ تا ۵۰۰ کاراکتر باشد')
    .custom((value, { req }) => {
      req.body.text = value;
      return true;
    }),

  validate
];

module.exports = {
  // User
  createReviewValidator,
  updateReviewValidator,
  deleteReviewValidator,
  getProductReviewsValidator,

  // Admin
  updateStatusValidator,
  approveReviewValidator,
  replyValidator,
  replyToReviewValidator,

  // Util
  mongoIdRule
};