const Page = require('../models/Page');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/apiResponse');
const slugify = require('slugify');

const toSlug = (s) => slugify(String(s || ''), { lower: true, strict: true, locale: 'fa' });
const isObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(String(v));

// Public: GET /api/pages/slug/:slug
exports.getPageBySlug = catchAsync(async (req, res) => {
  const page = await Page.findOne({ slug: req.params.slug, status: 'published' });
  if (!page) throw new AppError('صفحه یافت نشد', 404);
  return ApiResponse.success(res, page);
});

// Admin: GET /api/pages
exports.listPages = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, sort = '-createdAt', status, search } = req.query;
  const safeLimit = Math.min(parseInt(limit) || 20, 100);
  const skip = (parseInt(page) - 1) * safeLimit;

  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const q = new RegExp(String(search), 'i');
    filter.$or = [{ title: q }, { slug: q }];
  }

  const [rows, total] = await Promise.all([
    Page.find(filter).sort(String(sort).split(',').join(' ')).skip(skip).limit(safeLimit),
    Page.countDocuments(filter),
  ]);

  return ApiResponse.successWithPagination(res, rows, { page: parseInt(page), limit: safeLimit, totalItems: total });
});

// Admin: GET /api/pages/:id
exports.getPage = catchAsync(async (req, res) => {
  const p = await Page.findById(req.params.id);
  if (!p) throw new AppError('صفحه یافت نشد', 404);
  return ApiResponse.success(res, p);
});

// Admin: POST /api/pages
exports.createPage = catchAsync(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.title || !payload.content) throw new AppError('عنوان و محتوا الزامی است', 400);
  if (!payload.slug) payload.slug = toSlug(payload.title);
  const p = await Page.create(payload);
  return ApiResponse.success(res, p, 'صفحه ایجاد شد', 201);
});

// Admin: PUT /api/pages/:id
exports.updatePage = catchAsync(async (req, res) => {
  const updates = { ...req.body };
  if (updates.title && !updates.slug) updates.slug = toSlug(updates.title);
  const p = await Page.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!p) throw new AppError('صفحه یافت نشد', 404);
  return ApiResponse.success(res, p, 'صفحه به‌روزرسانی شد');
});

// Admin: DELETE /api/pages/:id
exports.deletePage = catchAsync(async (req, res) => {
  const p = await Page.findById(req.params.id);
  if (!p) throw new AppError('صفحه یافت نشد', 404);
  await p.deleteOne();
  return ApiResponse.success(res, null, 'صفحه حذف شد');
});

