const express = require('express');
const router = express.Router();

// Controllers
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  getFeaturedProducts,
  getRelatedProducts,
  searchProducts,
  getProductsByCategory,
  getProductStats,
  uploadImages,
  deleteImage,
  setPrimaryImage
} = require('../controllers/productController');

// Middleware
const { protect } = require('../middleware/auth');
const {
  productValidator,
  updateProductValidator,
  getProductValidator,
  searchProductsValidator,
  mongoIdRule // ← به‌جای mongoIdValidator
} = require('../validators/productValidator');
const { uploadProductImages, handleMulterError } = require('../middleware/upload');
const { cache } = require('../middleware/cache');

// ==========================================
// 🔓 PUBLIC ROUTES
// ==========================================

// جستجو
router.get(
  '/search',
  searchProductsValidator,
  searchProducts
);

// محصولات ویژه
router.get(
  '/featured',
  cache(600),
  getFeaturedProducts
);

// محصولات یک دسته‌بندی
router.get(
  '/category/:categorySlug',
  cache(300),
  getProductsByCategory
);

// محصولات مرتبط
router.get(
  '/:id/related',
  mongoIdRule('id', 'شناسه محصول'),
  cache(600),
  getRelatedProducts
);

// دریافت محصول با id یا slug
router.get(
  '/:idOrSlug',
  getProductValidator,
  cache(180),
  getProduct
);

// لیست محصولات
router.get(
  '/',
  searchProductsValidator,
  getProducts
);

// ==========================================
// 🔐 ADMIN ROUTES
// ==========================================

// آمار محصولات
router.get(
  '/admin/stats',
  protect,
  getProductStats
);

// ایجاد محصول
router.post(
  '/',
  protect,
  uploadProductImages,
  handleMulterError,
  productValidator,
  createProduct
);

// به‌روزرسانی محصول
router.put(
  '/:id',
  protect,
  mongoIdRule('id', 'شناسه محصول'),
  updateProductValidator,
  updateProduct
);

// حذف (نرم) محصول
router.delete(
  '/:id',
  protect,
  mongoIdRule('id', 'شناسه محصول'),
  deleteProduct
);

// بازیابی محصول
router.put(
  '/:id/restore',
  protect,
  mongoIdRule('id', 'شناسه محصول'),
  restoreProduct
);

// آپلود تصاویر بیشتر
router.post(
  '/:id/images',
  protect,
  mongoIdRule('id', 'شناسه محصول'),
  uploadProductImages,
  handleMulterError,
  uploadImages
);

// حذف یک تصویر
router.delete(
  '/:id/images/:imageId',
  protect,
  mongoIdRule('id', 'شناسه محصول'),
  deleteImage
);

// تنظیم تصویر اصلی
router.put(
  '/:id/images/:imageId/primary',
  protect,
  mongoIdRule('id', 'شناسه محصول'),
  setPrimaryImage
);

// ==========================================
// 📝 اتصال روت‌های نظرات
// ==========================================
const productReviewRouter = require('./productReviewRoutes');
router.use('/:productId/reviews', productReviewRouter);

module.exports = router;