const Banner = require('../models/Banner');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/apiResponse');

// Admin: GET /api/banners
exports.listBanners = catchAsync(async (req, res) => {
  const { page = 1, limit = 50, sort = '-createdAt', position, isActive } = req.query;
  const safeLimit = Math.min(parseInt(limit) || 50, 200);
  const skip = (parseInt(page) - 1) * safeLimit;

  const filter = {};
  if (position) filter.position = position;
  if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true' || isActive === true;

  const [rows, total] = await Promise.all([
    Banner.find(filter).sort(String(sort).split(',').join(' ')).skip(skip).limit(safeLimit),
    Banner.countDocuments(filter),
  ]);

  return ApiResponse.successWithPagination(res, rows, { page: parseInt(page), limit: safeLimit, totalItems: total });
});

// Admin: GET /api/banners/:id
exports.getBanner = catchAsync(async (req, res) => {
  const b = await Banner.findById(req.params.id);
  if (!b) throw new AppError('بنر یافت نشد', 404);
  return ApiResponse.success(res, b);
});

// Admin: POST /api/banners
exports.createBanner = catchAsync(async (req, res) => {
  const b = await Banner.create(req.body || {});
  return ApiResponse.success(res, b, 'بنر ایجاد شد', 201);
});

// Admin: PUT /api/banners/:id
exports.updateBanner = catchAsync(async (req, res) => {
  const b = await Banner.findByIdAndUpdate(req.params.id, req.body || {}, { new: true, runValidators: true });
  if (!b) throw new AppError('بنر یافت نشد', 404);
  return ApiResponse.success(res, b, 'بنر به‌روزرسانی شد');
});

// Admin: DELETE /api/banners/:id
exports.deleteBanner = catchAsync(async (req, res) => {
  const b = await Banner.findById(req.params.id);
  if (!b) throw new AppError('بنر یافت نشد', 404);
  await b.deleteOne();
  return ApiResponse.success(res, null, 'بنر حذف شد');
});

