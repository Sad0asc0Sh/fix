const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, query } = require('express-validator');
const { cache } = require('../middleware/cache'); // کش

// Controllers
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  updateOrderToPaid,
  updateOrderToDelivered,
  getOrders,
  getOrderStats,
  downloadInvoice,
  trackOrder,
  verifyPayment
} = require('../controllers/orderController');

// Middleware
const { protect, authorize, checkOwnership } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// ====================================
// Rate Limiters
// ====================================
const createOrderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ساعت
  max: 10,
  keyGenerator: (req) => (req.user?._id?.toString() || req.ip),
  message: { success: false, message: 'شما به تازگی تعداد زیادی سفارش ثبت کرده‌اید. لطفاً ۱ ساعت دیگر تلاش کنید.' },
  standardHeaders: true,
  legacyHeaders: false
});

const trackOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقیقه
  max: 20,
  message: { success: false, message: 'تعداد درخواست‌های ردیابی شما بیش از حد مجاز است.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ====================================
// Validation Rules
// ====================================

const createOrderRules = [
  body('orderItems')
    .isArray({ min: 1 })
    .withMessage('سبد خرید نمی‌تواند خالی باشد.')
    .custom((items) => {
      for (const it of items) {
        if (!it.product) throw new Error('شناسه محصول هر آیتم الزامی است.');
        if (!/^[0-9a-fA-F]{24}$/.test(it.product)) throw new Error('شناسه محصول نامعتبر است.');
        if (typeof it.quantity !== 'number' || it.quantity < 1) throw new Error('تعداد هر آیتم باید عددی حداقل ۱ باشد.');
      }
      return true;
    }),

  body('shippingAddress.fullName')
    .notEmpty().withMessage('نام کامل گیرنده الزامی است.'),

  body('shippingAddress.address')
    .notEmpty().withMessage('آدرس الزامی است.')
    .isLength({ min: 10 }).withMessage('آدرس باید حداقل ۱۰ کاراکتر باشد.'),

  body('shippingAddress.city')
    .notEmpty().withMessage('شهر الزامی است.'),

  body('shippingAddress.postalCode')
    .notEmpty().withMessage('کد پستی الزامی است.')
    .matches(/^\d{10}$/).withMessage('کد پستی باید ۱۰ رقم باشد.'),

  body('shippingAddress.phone')
    .notEmpty().withMessage('شماره تلفن الزامی است.')
    .matches(/^09\d{9}$/).withMessage('شماره تلفن باید با 09 شروع شود و ۱۱ رقم باشد.'),

  body('paymentMethod')
    .notEmpty().withMessage('روش پرداخت الزامی است.')
    .isIn(['online', 'cod', 'wallet']).withMessage('روش پرداخت نامعتبر است.'),

  body('couponCode')
    .optional()
    .isString().withMessage('کد تخفیف نامعتبر است.')
    .trim()
    .toUpperCase()
];

const updateStatusRules = [
  param('id').isMongoId().withMessage('شناسه سفارش نامعتبر است.'),
  body('status')
    .notEmpty().withMessage('وضعیت جدید الزامی است.')
    .isIn(['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded'])
    .withMessage('مقدار وضعیت نامعتبر است.'),
  body('note')
    .optional()
    .isString().withMessage('یادداشت باید متن باشد.')
    .trim()
    .isLength({ max: 500 }).withMessage('یادداشت نمی‌تواند بیش از ۵۰۰ کاراکتر باشد.')
];

const trackOrderRules = [
  query('orderNumber').notEmpty().withMessage('شماره سفارش الزامی است.'),
  query('email').notEmpty().withMessage('ایمیل الزامی است.').isEmail().withMessage('ایمیل معتبر نیست.')
];

const verifyPaymentRules = [
  query('Authority').notEmpty().withMessage('پارامتر Authority الزامی است.'),
  query('Status').notEmpty().withMessage('پارامتر Status الزامی است.')
];

const cancelOrderRules = [
  body('reason')
    .optional()
    .isString().withMessage('دلیل لغو باید متن باشد.')
    .trim()
    .isLength({ max: 500 }).withMessage('دلیل لغو نمی‌تواند بیش از ۵۰۰ کاراکتر باشد.')
];

// ====================================
// USER ROUTES
// ====================================

// ایجاد سفارش (بدون کش)
router.post(
  '/',
  protect,
  createOrderLimiter,
  createOrderRules,
  validate,
  createOrder
);

// سفارشات من (کش با userId)
router.get(
  '/my-orders',
  protect,
  cache(60, { includeUserId: true }),
  getMyOrders
);

// ردیابی سفارش (عمومی - کش کوتاه)
router.get(
  '/track',
  trackOrderLimiter,
  trackOrderRules,
  validate,
  cache(60),
  trackOrder
);

// تایید پرداخت (Callback درگاه) - بدون کش
router.get(
  '/verify-payment',
  verifyPaymentRules,
  validate,
  verifyPayment
);

// مشاهده جزئیات سفارش (مالک یا ادمین) - کش با userId
router.get(
  '/:id',
  protect,
  param('id').isMongoId().withMessage('شناسه سفارش نامعتبر است.'),
  validate,
  cache(60, { includeUserId: true }),
  checkOwnership('Order', 'user'),
  getOrderById
);

// دانلود فاکتور (مالک یا ادمین) - بدون کش (فایل/جریان)
router.get(
  '/:id/invoice',
  protect,
  param('id').isMongoId().withMessage('شناسه سفارش نامعتبر است.'),
  validate,
  checkOwnership('Order', 'user'),
  downloadInvoice
);

// لغو سفارش توسط کاربر (بدون کش)
router.put(
  '/:id/cancel',
  protect,
  param('id').isMongoId().withMessage('شناسه سفارش نامعتبر است.'),
  cancelOrderRules,
  validate,
  checkOwnership('Order', 'user'),
  cancelOrder
);

// (اختیاری) ثبت پرداخت موفق توسط کاربر
// router.put(
//   '/:id/pay',
//   protect,
//   param('id').isMongoId().withMessage('شناسه سفارش نامعتبر است.'),
//   validate,
//   checkOwnership('Order', 'user'),
//   updateOrderToPaid
// );

// ====================================
// ADMIN ROUTES
// ====================================
const adminAndManagerAuth = [protect, authorize('admin', 'manager')];

// همه سفارش‌ها (کش عمومی کوتاه)
router.get(
  '/admin/all',
  ...adminAndManagerAuth,
  cache(60),
  getOrders
);

// آمار سفارش‌ها (کش طولانی‌تر)
router.get(
  '/admin/stats',
  ...adminAndManagerAuth,
  cache(300),
  getOrderStats
);

// تغییر وضعیت سفارش (بدون کش - عملیات نوشتن)
router.put(
  '/:id/status',
  ...adminAndManagerAuth,
  updateStatusRules,
  validate,
  updateOrderStatus
);

// تحویل سفارش (بدون کش - عملیات نوشتن)
router.put(
  '/:id/deliver',
  ...adminAndManagerAuth,
  param('id').isMongoId().withMessage('شناسه سفارش نامعتبر است.'),
  validate,
  updateOrderToDelivered
);

module.exports = router;