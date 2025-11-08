/**
 * ====================================
 * Category Routes - مسیرهای دسته‌بندی
 * ====================================
 */

const express = require('express');
const router = express.Router();

// Controllers
const {
    getCategories,
    getCategoryTree,
    getRootCategories,
    getCategoryById,
    getCategoryBySlug,
    getCategoryProducts,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    setFeaturedCategory,
    getFeaturedCategories,
    searchCategories
} = require('../controllers/categoryController');

// Middleware
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');
const { cache } = require('../middleware/cache');
const { uploadCategoryImage: categoryUpload, handleMulterError } = require('../middleware/upload');

// ======================================================
// مسیرهای عمومی (Public)
// ======================================================

// جستجو
router.get('/search', cache(300), searchCategories);

// دسته‌بندی‌های ویژه
router.get('/featured', cache(600), getFeaturedCategories);

// درخت دسته‌بندی‌ها
router.get('/tree', cache(1800), getCategoryTree);

// دسته‌بندی‌های اصلی
router.get('/root', cache(1800), getRootCategories);

// دریافت با slug
router.get('/slug/:slug', cache(600), getCategoryBySlug);

// محصولات یک دسته‌بندی
router.get('/:id/products', cache(300), getCategoryProducts);

// لیست تمام دسته‌بندی‌ها
router.get('/', cache(600), getCategories);

// دریافت یک دسته‌بندی
router.get('/:id', cache(600), getCategoryById);

// ======================================================
// مسیرهای مدیریتی (Admin)
// ======================================================

// ایجاد دسته‌بندی
router.post(
    '/',
    protect,
    isAdmin,
    categoryUpload,
    handleMulterError,
    createCategory
);

// به‌روزرسانی دسته‌بندی
router.put(
    '/:id',
    protect,
    isAdmin,
    categoryUpload,
    handleMulterError,
    updateCategory
);

// حذف دسته‌بندی
router.delete(
    '/:id',
    protect,
    isAdmin,
    deleteCategory
);

// فعال/غیرفعال کردن
router.put(
    '/:id/toggle',
    protect,
    isAdmin,
    toggleCategoryStatus
);

// تنظیم ویژه
router.put(
    '/:id/featured',
    protect,
    isAdmin,
    setFeaturedCategory
);

module.exports = router;