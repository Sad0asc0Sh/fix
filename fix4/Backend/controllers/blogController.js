const mongoose = require('mongoose');
const Post = require('../models/Post');
const BlogCategory = require('../models/BlogCategory');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/apiResponse');
const slugify = require('slugify');

const toSlug = (s) => slugify(String(s || ''), { lower: true, strict: true, locale: 'fa' });
const isObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(String(v));

// Public: GET /api/blog
exports.listPosts = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sort = '-createdAt', status, category, search, tags } = req.query;
  const safeLimit = Math.min(parseInt(limit) || 10, 100);
  const skip = (parseInt(page) - 1) * safeLimit;

  const filter = {};
  if (status) filter.status = status;
  if (category && mongoose.Types.ObjectId.isValid(category)) filter.category = category;
  if (search) {
    const q = new RegExp(String(search), 'i');
    filter.$or = [{ title: q }, { content: q }, { tags: q }];
  }
  if (tags) filter.tags = { $in: String(tags).split(',') };

  const [rows, total] = await Promise.all([
    Post.find(filter)
      .populate('author', 'name email')
      .populate('category', 'name slug')
      .sort(String(sort).split(',').join(' '))
      .skip(skip)
      .limit(safeLimit),
    Post.countDocuments(filter),
  ]);

  return ApiResponse.successWithPagination(res, rows, {
    page: parseInt(page),
    limit: safeLimit,
    totalItems: total,
  });
});

// Public: GET /api/blog/:idOrSlug
exports.getPost = catchAsync(async (req, res) => {
  const key = req.params.idOrSlug;
  const post = isObjectId(key)
    ? await Post.findById(key)
        .populate('author', 'name email')
        .populate('category', 'name slug')
    : await Post.findOne({ slug: key })
        .populate('author', 'name email')
        .populate('category', 'name slug');

  if (!post) throw new AppError('پست یافت نشد', 404);
  return ApiResponse.success(res, post);
});

// Admin: POST /api/blog
exports.createPost = catchAsync(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.title || !payload.content) throw new AppError('عنوان و محتوا الزامی است', 400);
  if (!payload.slug) payload.slug = toSlug(payload.title);
  if (!payload.author && req.user) payload.author = req.user._id;

  const post = await Post.create(payload);
  return ApiResponse.success(res, post, 'پست ایجاد شد', 201);
});

// Admin: PUT /api/blog/:id
exports.updatePost = catchAsync(async (req, res) => {
  const updates = { ...req.body };
  if (updates.title && !updates.slug) updates.slug = toSlug(updates.title);

  const post = await Post.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    .populate('author', 'name email')
    .populate('category', 'name slug');
  if (!post) throw new AppError('پست یافت نشد', 404);
  return ApiResponse.success(res, post, 'پست به‌روزرسانی شد');
});

// Admin: DELETE /api/blog/:id
exports.deletePost = catchAsync(async (req, res) => {
  const found = await Post.findById(req.params.id);
  if (!found) throw new AppError('پست یافت نشد', 404);
  await found.deleteOne();
  return ApiResponse.success(res, null, 'پست حذف شد');
});

// Blog Category controllers
// Public: GET /api/blog/categories
exports.listCategories = catchAsync(async (req, res) => {
  const cats = await BlogCategory.find({}).sort('name');
  return ApiResponse.success(res, cats);
});

// Public: GET /api/blog/categories/:idOrSlug
exports.getCategory = catchAsync(async (req, res) => {
  const key = req.params.idOrSlug;
  const cat = isObjectId(key)
    ? await BlogCategory.findById(key)
    : await BlogCategory.findOne({ slug: key });
  if (!cat) throw new AppError('دسته‌بندی یافت نشد', 404);
  return ApiResponse.success(res, cat);
});

// Admin: POST /api/blog/categories
exports.createCategory = catchAsync(async (req, res) => {
  const { name, slug } = req.body || {};
  if (!name) throw new AppError('نام الزامی است', 400);
  const cat = await BlogCategory.create({ name, slug: slug || toSlug(name) });
  return ApiResponse.success(res, cat, 'دسته‌بندی ایجاد شد', 201);
});

// Admin: PUT /api/blog/categories/:id
exports.updateCategory = catchAsync(async (req, res) => {
  const updates = { ...req.body };
  if (updates.name && !updates.slug) updates.slug = toSlug(updates.name);
  const cat = await BlogCategory.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!cat) throw new AppError('دسته‌بندی یافت نشد', 404);
  return ApiResponse.success(res, cat, 'دسته‌بندی به‌روزرسانی شد');
});

// Admin: DELETE /api/blog/categories/:id
exports.deleteCategory = catchAsync(async (req, res) => {
  const cat = await BlogCategory.findById(req.params.id);
  if (!cat) throw new AppError('دسته‌بندی یافت نشد', 404);
  await cat.deleteOne();
  return ApiResponse.success(res, null, 'دسته‌بندی حذف شد');
});

