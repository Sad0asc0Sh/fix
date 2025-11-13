const express = require('express');
const { body, param } = require('express-validator');
const rateLimit = require('express-rate-limit');

const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  refreshToken,
  adminLogin
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const router = express.Router();

/**
 * ====================================
 * Rate Limiters مخصوص Auth
 * ====================================
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'تعداد تلاش‌های ورود از حد مجاز گذشته. لطفاً 15 دقیقه صبر کنید'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'تعداد درخواست‌های بازیابی رمز عبور از حد مجاز گذشته. لطفاً 1 ساعت صبر کنید'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * ====================================
 * قوانین اعتبارسنجی (Validation Rules)
 * ====================================
 */
const registerRules = [
  body('name')
    .notEmpty().withMessage('نام الزامی است')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('نام باید بین 2 تا 50 کاراکتر باشد')
    .matches(/^[\u0600-\u06FFa-zA-Z\s\u200C]+$/).withMessage('نام فقط می‌تواند شامل حروف باشد'),
  
  body('email')
    .notEmpty().withMessage('ایمیل الزامی است')
    .isEmail().withMessage('فرمت ایمیل معتبر نیست')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('ایمیل خیلی طولانی است'),
  
  body('password')
    .notEmpty().withMessage('رمز عبور الزامی است')
    .isLength({ min: 6, max: 128 }).withMessage('رمز عبور باید بین 6 تا 128 کاراکتر باشد')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('رمز عبور باید شامل حداقل یک حرف بزرگ، یک حرف کوچک و یک عدد باشد')
];

const loginRules = [
  body('email')
    .notEmpty().withMessage('ایمیل الزامی است')
    .isEmail().withMessage('فرمت ایمیل معتبر نیست')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('رمز عبور الزامی است')
];

const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('نام باید بین 2 تا 50 کاراکتر باشد')
    .matches(/^[\u0600-\u06FFa-zA-Z\s]+$/).withMessage('نام فقط می‌تواند شامل حروف باشد'),
  
  body('email')
    .optional()
    .isEmail().withMessage('فرمت ایمیل معتبر نیست')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('ایمیل خیلی طولانی است')
];

const changePasswordRules = [
  body('currentPassword')
    .notEmpty().withMessage('رمز عبور فعلی الزامی است'),
  
  body('newPassword')
    .notEmpty().withMessage('رمز عبور جدید الزامی است')
    .isLength({ min: 6, max: 128 }).withMessage('رمز عبور جدید باید بین 6 تا 128 کاراکتر باشد')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('رمز عبور جدید باید شامل حداقل یک حرف بزرگ، یک حرف کوچک و یک عدد باشد')
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
    })
];

const forgotPasswordRules = [
  body('email')
    .notEmpty().withMessage('ایمیل الزامی است')
    .isEmail().withMessage('فرمت ایمیل معتبر نیست')
    .normalizeEmail()
];

const resetPasswordRules = [
  param('resettoken')
    .notEmpty().withMessage('توکن بازنشانی الزامی است')
    .isLength({ min: 20 }).withMessage('توکن نامعتبر است'),
  
  body('password')
    .notEmpty().withMessage('رمز عبور جدید الزامی است')
    .isLength({ min: 6, max: 128 }).withMessage('رمز عبور باید بین 6 تا 128 کاراکتر باشد')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('رمز عبور باید شامل حداقل یک حرف بزرگ، یک حرف کوچک و یک عدد باشد'),
  
  body('confirmPassword')
    .notEmpty().withMessage('تکرار رمز عبور الزامی است')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('تکرار رمز عبور مطابقت ندارد');
      }
      return true;
    })
];

/**
 * ====================================
 * روت‌های عمومی (Public Routes)
 * ====================================
 */
router.post('/register', authLimiter, registerRules, validate, registerUser);
router.post('/login', authLimiter, loginRules, validate, loginUser);
router.post('/admin/login', authLimiter, loginRules, validate, adminLogin);
router.post('/forgotpassword', passwordResetLimiter, forgotPasswordRules, validate, forgotPassword);
router.put('/resetpassword/:resettoken', resetPasswordRules, validate, resetPassword);
router.post('/refresh', refreshToken);

/**
 * ====================================
 * روت‌های خصوصی (Private Routes)
 * ====================================
 */
router.use(protect);

router.get('/me', getMe);
router.put('/updateprofile', updateProfileRules, validate, updateProfile);
router.put('/changepassword', changePasswordRules, validate, changePassword);
router.post('/logout', logout);

module.exports = router;