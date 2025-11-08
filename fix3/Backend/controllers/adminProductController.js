const Product = require('../models/Product');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const slugify = require('slugify');
const sanitizeHtml = require('sanitize-html');

let cacheManager;
try {
  cacheManager = require('../utils/cacheManager');
} catch (_) {}

const scrubHtml = (value = '') =>
  sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });

const buildImagesPayload = (files = [], alt = 'Product image') =>
  files.map((file, index) => ({
    url: file.path,
    public_id: file.filename,
    alt,
    isPrimary: index === 0
  }));

const clearProductsCache = () => {
  try {
    cacheManager?.clearPattern?.('/api/products');
    cacheManager?.clearPattern?.('/api/categories');
    cacheManager?.clearPattern?.('/api/admin/products');
  } catch (_) {}
};

exports.getAdminProducts = catchAsync(async (req, res) => {
  const includeDeleted = req.query.includeDeleted === 'true';
  const includeInactive = req.query.includeInactive === 'true';

  const query = Product.find({}, null, {
    includeInactive,
    withDeleted: includeDeleted
  });

  const products = await query.sort('-createdAt');

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

exports.createProduct = catchAsync(async (req, res) => {
  const payload = { ...req.body };

  if (payload.description) payload.description = scrubHtml(payload.description);
  if (payload.shortDescription) payload.shortDescription = scrubHtml(payload.shortDescription);

  if (!payload.slug && payload.name) {
    payload.slug = slugify(payload.name, { lower: true, strict: true, locale: 'fa' });
  }

  if (req.user?.id) {
    payload.user = req.user.id;
    payload.createdBy = req.user.id;
  }

  if (Array.isArray(req.files) && req.files.length > 0) {
    payload.images = buildImagesPayload(req.files, payload.name);
  }

  const product = await Product.create(payload);
  clearProductsCache();

  res.status(201).json({
    success: true,
    message: 'Product created via admin API.',
    data: product
  });
});

exports.deleteProduct = catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id).setOptions({
    includeInactive: true,
    withDeleted: true
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (typeof product.softDelete === 'function') {
    await product.softDelete();
  } else {
    product.isActive = false;
    product.deletedAt = Date.now();
    await product.save();
  }

  clearProductsCache();

  res.status(200).json({
    success: true,
    message: 'Product soft-deleted successfully.',
    data: null
  });
});
