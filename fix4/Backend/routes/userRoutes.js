/**
 * ====================================
 * User Routes - مسیرهای کاربر
 * ====================================
 */

const express = require('express');
const router = express.Router();

// Controllers
const {
    getProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAvatar,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getOrders,
    getOrderById,
    cancelOrder,
    getUserStats,
    deleteAccount
} = require('../controllers/userController');

// Validators
const {
    updateProfileValidator,
    changePasswordValidator,
    addAddressValidator,
    updateAddressValidator,
    addressIdValidator,
    orderIdValidator,
    cancelOrderValidator,
    deleteAccountValidator
} = require('../validators/userValidator');

// Middleware
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { avatarUpload, handleMulterError } = require('../middleware/upload');
const { cache } = require('../middleware/cache');

// ======================================================
// تمام مسیرها نیاز به احراز هویت دارند
// ======================================================
router.use(protect);

// ======================================================
// پروفایل کاربر
// ======================================================
router.route('/profile')
    .get(cache(300, { includeUserId: true }), getProfile)
    .put(updateProfileValidator, validate, updateProfile);

// ======================================================
// تغییر رمز عبور
// ======================================================
router.put(
    '/change-password',
    changePasswordValidator,
    validate,
    changePassword
);

// ======================================================
// آواتار
// ======================================================
router.route('/avatar')
    .put(avatarUpload, handleMulterError, uploadAvatar)
    .delete(deleteAvatar);

// ======================================================
// آدرس‌ها
// ======================================================
router.route('/addresses')
    .get(cache(300, { includeUserId: true }), getAddresses)
    .post(addAddressValidator, validate, addAddress);

router.route('/addresses/:id')
    .put(updateAddressValidator, validate, updateAddress)
    .delete(addressIdValidator, validate, deleteAddress);

router.put(
    '/addresses/:id/default',
    addressIdValidator,
    validate,
    setDefaultAddress
);

// ======================================================
// سفارشات
// ======================================================
router.get('/orders', getOrders);

router.get(
    '/orders/:id',
    orderIdValidator,
    validate,
    getOrderById
);

router.put(
    '/orders/:id/cancel',
    cancelOrderValidator,
    validate,
    cancelOrder
);

// ======================================================
// آمار کاربر
// ======================================================
router.get('/stats', cache(600, { includeUserId: true }), getUserStats);

// ======================================================
// حذف حساب
// ======================================================
router.delete(
    '/account',
    deleteAccountValidator,
    validate,
    deleteAccount
);

module.exports = router;