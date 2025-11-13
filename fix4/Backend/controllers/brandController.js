const asyncHandler = require('express-async-handler');
const Brand = require('../models/Brand');
const ApiResponse = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');

exports.createBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.create(req.body);
  return ApiResponse.success(res, brand, 'برند با موفقیت ایجاد شد', 201);
});

exports.getAllBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find({}).sort({ createdAt: -1 });
  return ApiResponse.success(res, brands, 'فهرست برندها');
});

exports.getBrandById = asyncHandler(async (req, res, next) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return next(new AppError('برند یافت نشد', 404));
  }
  return ApiResponse.success(res, brand, 'برند یافت شد');
});

exports.updateBrand = asyncHandler(async (req, res, next) => {
  const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!brand) {
    return next(new AppError('برند یافت نشد', 404));
  }
  return ApiResponse.success(res, brand, 'برند با موفقیت به‌روزرسانی شد');
});

exports.deleteBrand = asyncHandler(async (req, res, next) => {
  const brand = await Brand.findByIdAndDelete(req.params.id);
  if (!brand) {
    return next(new AppError('برند یافت نشد', 404));
  }
  return ApiResponse.success(res, { _id: brand._id }, 'برند حذف شد');
});

