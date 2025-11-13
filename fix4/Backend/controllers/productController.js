const Product = require('../models/Product');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const sanitizeHtml = require('sanitize-html');
const slugify = require('slugify');
const { deleteFromCloudinary, extractPublicId } = require('../middleware/upload');

const ApiFeatures = require('../utils/apiFeatures');
const ApiResponse = require('../utils/apiResponse');

let cacheManager;
try {
  cacheManager = require('../utils/cacheManager');
} catch (_) {}

/**
 * Helpers
 */
const cleanHtml = (input) =>
  sanitizeHtml(input || '', { allowedTags: [], allowedAttributes: {} });

const isObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(String(v));

const clearProductsCache = () => {
  try {
    cacheManager?.clearPattern?.('/api/products');
    cacheManager?.clearPattern?.('/api/categories');
  } catch (_) {}
};

/**
 * ====================================
 * دریافت تمام محصولات (با استفاده از ApiFeatures)
 * ====================================
 */
exports.getProducts = async (req, res, next) => {
  try {
    const baseQuery = { isActive: true };
    if (req.query.includeInactive === 'true') {
      delete baseQuery.isActive;
    }

    const features = new ApiFeatures(Product.find(baseQuery), req.query)
      .filter()
      .sort()
      .limitFields();

    const countQuery = Product.countDocuments(features.query.getFilter());
    const findQuery = features.paginate().query;

    const [data, totalItems] = await Promise.all([findQuery, countQuery]);
    
    const { page, limit } = features.pagination;
    const pagination = {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNextPage: page * limit < totalItems,
        hasPrevPage: page > 1
    };

    return ApiResponse.successWithPagination(res, data, pagination);

  } catch (error) {
    console.error('!!! CRITICAL ERROR IN getProducts !!!', error);
    res.status(500).json({
      success: false,
      message: 'A critical server error occurred in getProducts.',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
  }
};

/**
 * ====================================
 * جستجو محصولات (روت اختصاصی)
 * ====================================
 */
exports.searchProducts = catchAsync(async (req, res) => {
  const searchTerm = req.query.q || '';
  if (!searchTerm) {
    return res.status(200).json({ success: true, count: 0, data: [] });
  }

  const cleanSearch = cleanHtml(searchTerm);
  const limit = parseInt(req.query.limit, 10) || 10;

  const products = await Product.find(
    { $text: { $search: cleanSearch }, isActive: true },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .select('name price images slug category rating numReviews');

  res.status(200).json({ success: true, count: products.length, data: products });
});

/**
 * ====================================
 * محصولات ویژه
 * ====================================
 */
exports.getFeaturedProducts = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 5;
  const products = await Product.find({ isFeatured: true, isActive: true })
    .sort('-createdAt')
    .limit(limit)
    .select('name price images slug category rating numReviews');
  res.status(200).json({ success: true, count: products.length, data: products });
});

/**
 * ====================================
 * محصولات یک دسته‌بندی
 * ====================================
 */
exports.getProductsByCategory = catchAsync(async (req, res) => {
  const categorySlugOrName = req.params.categorySlug;
  // اگر category در دیتابیس فارسی ذخیره شده، همین رشته را استفاده می‌کنیم
  const categoryName = categorySlugOrName;

  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 12, 100);
  const skip = (page - 1) * limit;

  const filter = { category: categoryName, isActive: true };
  const [products, totalProducts] = await Promise.all([
    Product.find(filter).sort(req.query.sort || '-createdAt').skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    pagination: { totalProducts, totalPages: Math.ceil(totalProducts / limit), currentPage: page, limit },
    data: products,
  });
});

/**
 * ====================================
 * دریافت یک محصول با id یا slug
 * ====================================
 */
exports.getProduct = catchAsync(async (req, res) => {
  const idOrSlug = req.params.idOrSlug || req.params.id;
  let query = isObjectId(idOrSlug) ? Product.findById(idOrSlug) : Product.findOne({ slug: idOrSlug });

  if (req.query.populate === 'user') {
    query = query.populate({ path: 'user', select: 'name email avatar' });
  }

  const product = await query;
  if (!product || !product.isActive) throw new AppError('محصولی با این شناسه/اسلاگ یافت نشد یا در دسترس نیست', 404);

  res.status(200).json({ success: true, data: product });
});

// سازگاری قدیمی
exports.getProductById = exports.getProduct;

/**
 * ====================================
 * دریافت محصولات مرتبط
 * ====================================
 */
exports.getRelatedProducts = catchAsync(async (req, res) => {
  const productId = req.params.id;
  const limit = parseInt(req.query.limit, 10) || 4;

  const base = await Product.findById(productId).select('category');
  if (!base) throw new AppError('محصول اصلی یافت نشد', 404);

  const related = await Product.find({
    category: base.category,
    _id: { $ne: productId },
    isActive: true,
  })
    .limit(limit)
    .select('name price images slug category rating');

  res.status(200).json({ success: true, count: related.length, data: related });
});

/**
 * ====================================
 * ایجاد محصول (ادمین)
 * ====================================
 */
exports.createProduct = catchAsync(async (req, res) => {
  const data = { ...req.body, user: req.user.id };

  // تصاویر Cloudinary
  if (Array.isArray(req.files) && req.files.length > 0) {
    data.images = req.files.map((f, idx) => ({
      url: f.path, // Cloudinary secure URL
      public_id: f.filename, // Cloudinary public_id
      alt: data.name,
      isPrimary: idx === 0, // اولین عکس اصلی
    }));
  } else {
    data.images = [{ url: '/uploads/products/default.jpg', alt: data.name }];
  }

  // slug (اختیاری: می‌توان به pre-save سپرد)
  if (data.name && !data.slug) {
    // data.slug = slugify(data.name, { lower: true, strict: true, locale: 'fa' });
  }

  const product = await Product.create(data);
  clearProductsCache();

  res.status(201).json({ success: true, message: 'محصول با موفقیت ایجاد شد', data: product });
});

/**
 * ====================================
 * بروزرسانی محصول (ادمین)
 * ====================================
 */
exports.updateProduct = catchAsync(async (req, res) => {
  const productId = req.params.id;
  const updates = { ...req.body };

  // امنیت
  delete updates.user;
  delete updates.images;

  if (updates.name && !updates.slug) {
    // updates.slug = slugify(updates.name, { lower: true, strict: true, locale: 'fa' });
  }

  const product = await Product.findByIdAndUpdate(productId, updates, { new: true, runValidators: true });
  if (!product) throw new AppError('محصولی با این شناسه یافت نشد', 404);

  clearProductsCache();
  res.status(200).json({ success: true, message: 'محصول با موفقیت بروزرسانی شد', data: product });
});

/**
 * ====================================
 * حذف (نرم) محصول (ادمین)
 * ====================================
 */
exports.deleteProduct = catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('محصولی با این شناسه یافت نشد', 404);

  await product.softDelete();

  clearProductsCache();
  res.status(200).json({ success: true, message: 'محصول با موفقیت حذف شد', data: null });
});

/**
 * ====================================
 * بازیابی محصول حذف‌شده
 * ====================================
 */
exports.restoreProduct = catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id).setOptions({ withDeleted: true });
  if (!product) throw new AppError('محصولی با این شناسه یافت نشد', 404);

  await product.restore();
  clearProductsCache();

  res.status(200).json({ success: true, message: 'محصول با موفقیت بازیابی شد', data: product });
});

/**
 * ====================================
 * آپلود تصاویر بیشتر (Cloudinary)
 * ====================================
 */
exports.uploadImages = catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('محصولی با این شناسه یافت نشد', 404);

  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError('هیچ فایلی برای آپلود انتخاب نشده است', 400);
  }

  const newImages = req.files.map((f) => ({
    url: f.path,
    public_id: f.filename,
    alt: product.name,
  }));

  product.images.push(...newImages);
  await product.save();

  clearProductsCache();
  res.status(200).json({
    success: true,
    message: `${req.files.length} تصویر با موفقیت اضافه شد`,
    data: product.images,
  });
});

/**
 * ====================================
 * حذف یک تصویر (Cloudinary)
 * ====================================
 */
exports.deleteImage = catchAsync(async (req, res) => {
  const { id, imageId } = req.params; // imageId = public_id یا بخشی از URL
  const product = await Product.findById(id);
  if (!product) throw new AppError('محصول یافت نشد', 404);

  let index = -1;

  // تلاش برای یافتن بر اساس public_id
  index = product.images.findIndex((img) => img.public_id && img.public_id === imageId);

  // اگر پیدا نشد، تلاش بر اساس URL (در صورت نبود public_id)
  if (index === -1) {
    index = product.images.findIndex((img) => img.url && img.url.includes(imageId));
  }

  if (index === -1) throw new AppError('تصویر مورد نظر یافت نشد', 404);

  const toDelete = product.images[index];

  // حذف از Cloudinary
  if (toDelete.public_id) {
    await deleteFromCloudinary(toDelete.public_id);
  } else {
    const pubId = extractPublicId(toDelete.url);
    if (pubId) await deleteFromCloudinary(pubId);
  }

  // حذف از آرایه
  product.images.splice(index, 1);
  await product.save();

  clearProductsCache();
  res.status(200).json({ success: true, message: 'تصویر با موفقیت حذف شد', data: product.images });
});

/**
 * ====================================
 * تنظیم تصویر اصلی
 * ====================================
 */
exports.setPrimaryImage = catchAsync(async (req, res) => {
  const { id, imageId } = req.params; // imageId = public_id
  const product = await Product.findById(id);
  if (!product) throw new AppError('محصول یافت نشد', 404);

  let found = false;
  product.images = product.images.map((img) => {
    if (!found && (img.public_id === imageId || (img.url && img.url.includes(imageId)))) {
      found = true;
      return { ...img.toObject?.() || img, isPrimary: true };
    }
    return { ...img.toObject?.() || img, isPrimary: false };
  });

  if (!found) throw new AppError('تصویر مورد نظر یافت نشد', 404);

  await product.save();
  clearProductsCache();

  res.status(200).json({ success: true, message: 'تصویر اصلی با موفقیت تنظیم شد', data: product.images });
});

/**
 * ====================================
 * آمار محصولات (ادمین)
 * ====================================
 */
exports.getProductStats = catchAsync(async (req, res) => {
  const stats = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        numProducts: { $sum: 1 },
        totalStock: { $sum: '$stock' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        avgRating: { $avg: '$rating' },
      },
    },
    { $sort: { numProducts: -1 } },
  ]);

  const totalProducts = await Product.countDocuments({ isActive: true });
  const totalCategories = stats.length;

  res.status(200).json({
    success: true,
    data: { totalProducts, totalCategories, categoryStats: stats },
  });
});
