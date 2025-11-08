const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const Product = require('../models/Product');

/**
 * مقادیر مجاز category از مدل
 */
const validCategories = Product.schema.path('category').enumValues || [];

/**
 * ابزار کمکی: قانون MongoId قابل استفاده مجدد
 * استفاده: [ mongoIdRule('id'), validate ]
 */
const mongoIdRule = (field = 'id', label = 'شناسه') =>
  param(field).isMongoId().withMessage(`${label} نامعتبر است`);

/**
 * ====================================
 * Validator: ایجاد محصول جدید (ادمین)
 * export: productValidator + createProductValidator (alias)
 * ====================================
 */
const productValidator = [
  // نام
  body('name')
    .notEmpty().withMessage('نام محصول الزامی است')
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('نام محصول باید بین 3 تا 200 کاراکتر باشد')
    .custom(async (value) => {
      const existing = await Product.findOne({ name: value });
      if (existing) throw new Error('محصولی با این نام قبلاً ثبت شده است');
      return true;
    }),

  // توضیحات
  body('description')
    .notEmpty().withMessage('توضیحات محصول الزامی است')
    .trim()
    .isLength({ min: 10, max: 3000 }).withMessage('توضیحات باید بین 10 تا 3000 کاراکتر باشد'),

  // توضیح کوتاه
  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('توضیحات کوتاه نمی‌تواند بیش از 500 کاراکتر باشد'),

  // قیمت
  body('price')
    .notEmpty().withMessage('قیمت محصول الزامی است')
    .isFloat({ min: 0 }).withMessage('قیمت باید عدد مثبت باشد')
    .toFloat(),

  // قیمت اصلی
  body('originalPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('قیمت اصلی باید عدد مثبت باشد')
    .toFloat()
    .custom((value, { req }) => {
      if (value && req.body.price && Number(value) < Number(req.body.price)) {
        throw new Error('قیمت اصلی نمی‌تواند کمتر از قیمت فروش باشد');
      }
      return true;
    }),

  // تخفیف
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('تخفیف باید بین 0 تا 100 درصد باشد')
    .toFloat(),

  // دسته‌بندی
  body('category')
    .notEmpty().withMessage('دسته‌بندی محصول الزامی است')
    .isIn(validCategories).withMessage(`دسته‌بندی باید یکی از: ${validCategories.join(', ')} باشد`),

  // زیردسته و برند
  body('subCategory').optional().trim().isLength({ max: 100 }).withMessage('زیردسته نمی‌تواند بیش از 100 کاراکتر باشد'),
  body('brand').optional().trim().isLength({ max: 100 }).withMessage('نام برند نمی‌تواند بیش از 100 کاراکتر باشد'),

  // تگ‌ها
  body('tags')
    .optional()
    .isArray().withMessage('تگ‌ها باید آرایه باشد')
    .custom((tags) => {
      if (Array.isArray(tags) && tags.length > 20) throw new Error('حداکثر 20 تگ مجاز است');
      return true;
    }),
  body('tags.*').optional().trim().isLength({ min: 2, max: 50 }).withMessage('هر تگ باید بین 2 تا 50 کاراکتر باشد'),

  // موجودی
  body('stock')
    .notEmpty().withMessage('موجودی انبار الزامی است')
    .isInt({ min: 0 }).withMessage('موجودی باید عدد صحیح و مثبت باشد')
    .toInt(),

  // آستانه موجودی کم
  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 }).withMessage('آستانه موجودی کم باید عدد صحیح و مثبت باشد')
    .toInt(),

  // تصاویر (در Cloudinary از multer می‌آید، این بخش فقط در صورت ارسال JSON)
  body('images')
    .optional()
    .isArray({ min: 1 }).withMessage('حداقل یک تصویر الزامی است')
    .custom((images) => {
      if (images.length > 10) throw new Error('حداکثر 10 تصویر مجاز است');
      return true;
    }),
  body('images.*.url').optional().isURL().withMessage('آدرس تصویر معتبر نیست'),

  // مشخصات فنی
  body('specifications').optional().isArray().withMessage('مشخصات فنی باید آرایه باشد'),
  body('specifications.*.key').optional().trim().notEmpty().withMessage('کلید مشخصات نمی‌تواند خالی باشد'),
  body('specifications.*.value').optional().trim().notEmpty().withMessage('مقدار مشخصات نمی‌تواند خالی باشد'),

  // Variants (اختیاری)
  body('variants').optional().isArray().withMessage('variants باید آرایه باشد'),
  body('variants.*.name').optional().trim().notEmpty().withMessage('نام ویژگی (variant) الزامی است'),
  body('variants.*.options').optional().isArray().withMessage('گزینه‌های variant باید آرایه باشد'),
  body('variants.*.options.*.value').optional().trim().notEmpty().withMessage('مقدار گزینه variant الزامی است'),
  body('variants.*.options.*.priceModifier').optional().isFloat({ min: 0 }).withMessage('priceModifier باید عدد مثبت باشد').toFloat(),
  body('variants.*.options.*.stock').optional().isInt({ min: 0 }).withMessage('موجودی گزینه باید عدد صحیح و مثبت باشد').toInt(),

  // SKU
  body('sku')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('SKU نمی‌تواند بیش از 50 کاراکتر باشد')
    .isAlphanumeric('en-US', { ignore: '-_' }).withMessage('SKU فقط باید شامل حروف، اعداد، - و _ باشد')
    .custom(async (value) => {
      if (value) {
        const existing = await Product.findOne({ sku: value.toUpperCase() });
        if (existing) throw new Error('این SKU قبلاً استفاده شده است');
      }
      return true;
    }),

  // Barcode
  body('barcode')
    .optional()
    .trim()
    .isNumeric().withMessage('بارکد باید عدد باشد')
    .isLength({ min: 8, max: 13 }).withMessage('بارکد باید بین 8 تا 13 رقم باشد')
    .custom(async (value) => {
      if (value) {
        const existing = await Product.findOne({ barcode: value });
        if (existing) throw new Error('این بارکد قبلاً استفاده شده است');
      }
      return true;
    }),

  // وضعیت‌ها
  body('isActive').optional().isBoolean().withMessage('وضعیت فعال باید بولین باشد'),
  body('isFeatured').optional().isBoolean().withMessage('وضعیت ویژه باید بولین باشد'),
  body('isNew').optional().isBoolean().withMessage('وضعیت جدید باید بولین باشد'),

  // ابعاد
  body('dimensions.length').optional().isFloat({ min: 0 }).withMessage('طول باید عدد مثبت باشد').toFloat(),
  body('dimensions.width').optional().isFloat({ min: 0 }).withMessage('عرض باید عدد مثبت باشد').toFloat(),
  body('dimensions.height').optional().isFloat({ min: 0 }).withMessage('ارتفاع باید عدد مثبت باشد').toFloat(),
  body('dimensions.unit').optional().isIn(['cm', 'inch']).withMessage('واحد ابعاد باید cm یا inch باشد'),

  // وزن
  body('weight.value').optional().isFloat({ min: 0 }).withMessage('وزن باید عدد مثبت باشد').toFloat(),
  body('weight.unit').optional().isIn(['kg', 'g']).withMessage('واحد وزن باید kg یا g باشد'),

  // SEO
  body('seo.metaTitle').optional().trim().isLength({ max: 60 }).withMessage('عنوان متا نمی‌تواند بیش از 60 کاراکتر باشد'),
  body('seo.metaDescription').optional().trim().isLength({ max: 160 }).withMessage('توضیحات متا نمی‌تواند بیش از 160 کاراکتر باشد'),
  body('seo.keywords').optional().isArray().withMessage('کلمات کلیدی باید آرایه باشد'),

  validate
];

// alias برای سازگاری با نام قبلی
const createProductValidator = productValidator;

/**
 * ====================================
 * Validator: به‌روزرسانی محصول
 * ====================================
 */
const updateProductValidator = [
  mongoIdRule('id', 'شناسه محصول'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('نام محصول باید بین 3 تا 200 کاراکتر باشد')
    .custom(async (value, { req }) => {
      const existing = await Product.findOne({ name: value, _id: { $ne: req.params.id } });
      if (existing) throw new Error('محصولی با این نام قبلاً ثبت شده است');
      return true;
    }),

  body('description').optional().trim().isLength({ min: 10, max: 3000 }).withMessage('توضیحات باید بین 10 تا 3000 کاراکتر باشد'),
  body('shortDescription').optional().trim().isLength({ max: 500 }).withMessage('توضیحات کوتاه نمی‌تواند بیش از 500 کاراکتر باشد'),

  body('price').optional().isFloat({ min: 0 }).withMessage('قیمت باید عدد مثبت باشد').toFloat(),
  body('originalPrice').optional().isFloat({ min: 0 }).withMessage('قیمت اصلی باید عدد مثبت باشد').toFloat(),
  body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('تخفیف باید بین 0 تا 100 درصد باشد').toFloat(),

  body('category').optional().isIn(validCategories).withMessage(`دسته‌بندی باید یکی از: ${validCategories.join(', ')} باشد`),
  body('subCategory').optional().trim().isLength({ max: 100 }).withMessage('زیردسته نمی‌تواند بیش از 100 کاراکتر باشد'),
  body('brand').optional().trim().isLength({ max: 100 }).withMessage('نام برند نمی‌تواند بیش از 100 کاراکتر باشد'),
  body('tags').optional().isArray().withMessage('تگ‌ها باید آرایه باشد'),

  body('stock').optional().isInt({ min: 0 }).withMessage('موجودی باید عدد صحیح و مثبت باشد').toInt(),
  body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('آستانه موجودی کم باید عدد صحیح و مثبت باشد').toInt(),

  body('sku')
    .optional()
    .trim()
    .custom(async (value, { req }) => {
      if (value) {
        const existing = await Product.findOne({ sku: value.toUpperCase(), _id: { $ne: req.params.id } });
        if (existing) throw new Error('این SKU قبلاً استفاده شده است');
      }
      return true;
    }),

  body('barcode')
    .optional()
    .trim()
    .isNumeric().withMessage('بارکد باید عدد باشد')
    .custom(async (value, { req }) => {
      if (value) {
        const existing = await Product.findOne({ barcode: value, _id: { $ne: req.params.id } });
        if (existing) throw new Error('این بارکد قبلاً استفاده شده است');
      }
      return true;
    }),

  body('isActive').optional().isBoolean().withMessage('وضعیت فعال باید بولین باشد'),
  body('isFeatured').optional().isBoolean().withMessage('وضعیت ویژه باید بولین باشد'),
  body('isNew').optional().isBoolean().withMessage('وضعیت جدید باید بولین باشد'),

  validate
];

/**
 * ====================================
 * Validator: حذف محصول
 * ====================================
 */
const deleteProductValidator = [
  mongoIdRule('id', 'شناسه محصول'),
  validate
];

/**
 * ====================================
 * Validator: دریافت محصول با ID یا Slug
 * ====================================
 */
const getProductValidator = [
  param('idOrSlug').notEmpty().withMessage('شناسه یا slug محصول الزامی است').trim(),
  validate
];

/**
 * ====================================
 * Validator: جستجو/فیلتر
 * - در endpoint /search از q استفاده می‌کنیم (alias: search)
 * ====================================
 */
const searchProductsValidator = [
  // q یا search
  query('q').optional().trim().isLength({ min: 2, max: 100 }).withMessage('عبارت جستجو باید بین 2 تا 100 کاراکتر باشد'),
  query('search').optional().trim().isLength({ min: 2, max: 100 }).withMessage('عبارت جستجو باید بین 2 تا 100 کاراکتر باشد'),

  query('category').optional().isIn(validCategories).withMessage(`دسته‌بندی باید یکی از: ${validCategories.join(', ')} باشد`),

  query('minPrice').optional().isFloat({ min: 0 }).withMessage('حداقل قیمت باید عدد مثبت باشد').toFloat(),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('حداکثر قیمت باید عدد مثبت باشد')
    .toFloat()
    .custom((value, { req }) => {
      if (req.query.minPrice && parseFloat(value) < parseFloat(req.query.minPrice)) {
        throw new Error('حداکثر قیمت نمی‌تواند کمتر از حداقل قیمت باشد');
      }
      return true;
    }),

  query('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('امتیاز باید بین 0 تا 5 باشد').toFloat(),
  query('inStock').optional().isBoolean().withMessage('فیلتر موجودی باید بولین باشد'),

  query('page').optional().isInt({ min: 1 }).withMessage('شماره صفحه باید عدد صحیح مثبت باشد').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('تعداد نتایج باید بین 1 تا 100 باشد').toInt(),

  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'price', '-price', 'rating', '-rating', 'soldCount', '-soldCount', 'name', '-name'])
    .withMessage('فیلد مرتب‌سازی نامعتبر است'),

  validate
];

/**
 * ====================================
 * Validator: آپلود تصاویر (Cloudinary)
 * ====================================
 */
const uploadImagesValidator = [
  mongoIdRule('id', 'شناسه محصول'),
  // فایل‌ها توسط Multer اعتبارسنجی می‌شوند
  validate
];

module.exports = {
  // Create
  productValidator,
  createProductValidator, // alias

  // Update/Delete
  updateProductValidator,
  deleteProductValidator,

  // Get/Search
  getProductValidator,
  searchProductsValidator,

  // Upload
  uploadImagesValidator,

  // Utils
  mongoIdRule
};