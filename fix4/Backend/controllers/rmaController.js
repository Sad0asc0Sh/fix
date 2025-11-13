const mongoose = require('mongoose');
const RMA = require('../models/RMA');
const Order = require('../models/Order');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/apiResponse');

const ALLOWED_STATUSES = ['pending', 'approved', 'rejected', 'processing', 'completed'];

// POST /api/rma
exports.requestRMA = catchAsync(async (req, res) => {
  const { order, reason, items, user: userOverride } = req.body || {};

  if (!order || !mongoose.Types.ObjectId.isValid(order)) {
    throw new AppError('شناسه سفارش معتبر نیست', 400);
  }
  if (!reason || !String(reason).trim()) {
    throw new AppError('علت بازگشت الزامی است', 400);
  }

  const existingOrder = await Order.findById(order).select('user orderItems');
  if (!existingOrder) throw new AppError('سفارش یافت نشد', 404);

  // Only owner can request RMA for their order unless admin
  if (req.user.role !== 'admin' && String(existingOrder.user) !== String(req.user._id)) {
    throw new AppError('عدم دسترسی', 403);
  }

  // Basic validation for items
  const preparedItems = Array.isArray(items)
    ? items
        .filter((it) => it && it.product && mongoose.Types.ObjectId.isValid(it.product) && Number(it.quantity) > 0)
        .map((it) => ({ product: it.product, quantity: Number(it.quantity) }))
    : [];

  const rma = await RMA.create({
    user: (req.user.role === 'admin' && userOverride && mongoose.Types.ObjectId.isValid(userOverride)) ? userOverride : req.user._id,
    order,
    reason: String(reason).trim(),
    status: 'pending',
    items: preparedItems,
  });

  const populated = await RMA.findById(rma._id)
    .populate('user', 'name email')
    .populate('order', 'orderNumber totalPrice')
    .populate('items.product', 'name sku');

  return ApiResponse.success(res, populated, 'درخواست RMA ثبت شد', 201);
});

// GET /api/rma (current user)
exports.getMyRMAs = catchAsync(async (req, res) => {
  const { status, orderId, page = 1, limit = 20, sort = '-createdAt' } = req.query;
  const safeLimit = Math.min(parseInt(limit) || 20, 100);
  const skip = (parseInt(page) - 1) * safeLimit;

  const filter = { user: req.user._id };
  if (status) filter.status = status;
  if (orderId && mongoose.Types.ObjectId.isValid(orderId)) filter.order = orderId;

  const [rows, total] = await Promise.all([
    RMA.find(filter)
      .populate('order', 'orderNumber totalPrice')
      .populate('items.product', 'name sku')
      .sort(String(sort).split(',').join(' '))
      .skip(skip)
      .limit(safeLimit),
    RMA.countDocuments(filter),
  ]);

  return ApiResponse.successWithPagination(res, rows, {
    page: parseInt(page),
    limit: safeLimit,
    totalItems: total,
  });
});

// GET /api/rma/admin/all (admin)
exports.getAllRMAs = catchAsync(async (req, res) => {
  const { status, userId, orderId, page = 1, limit = 20, sort = '-createdAt' } = req.query;
  const safeLimit = Math.min(parseInt(limit) || 20, 100);
  const skip = (parseInt(page) - 1) * safeLimit;

  const filter = {};
  if (status) filter.status = status;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.user = userId;
  if (orderId && mongoose.Types.ObjectId.isValid(orderId)) filter.order = orderId;

  const [rows, total] = await Promise.all([
    RMA.find(filter)
      .populate('user', 'name email')
      .populate('order', 'orderNumber totalPrice')
      .populate('items.product', 'name sku')
      .sort(String(sort).split(',').join(' '))
      .skip(skip)
      .limit(safeLimit),
    RMA.countDocuments(filter),
  ]);

  return ApiResponse.successWithPagination(res, rows, {
    page: parseInt(page),
    limit: safeLimit,
    totalItems: total,
  });
});

// GET /api/rma/:id (owner or admin)
exports.getRMAById = catchAsync(async (req, res) => {
  const rma = await RMA.findById(req.params.id)
    .populate('user', 'name email')
    .populate('order', 'orderNumber totalPrice')
    .populate('items.product', 'name sku');

  if (!rma) throw new AppError('RMA یافت نشد', 404);

  if (req.user.role !== 'admin' && String(rma.user._id || rma.user) !== String(req.user._id)) {
    throw new AppError('عدم دسترسی', 403);
  }

  return ApiResponse.success(res, rma);
});

// PUT /api/rma/:id/status (admin)
exports.updateRMAStatus = catchAsync(async (req, res) => {
  const { status, adminNotes } = req.body || {};
  if (!ALLOWED_STATUSES.includes(status)) {
    throw new AppError('وضعیت نامعتبر است', 400);
  }

  const rma = await RMA.findByIdAndUpdate(
    req.params.id,
    { status, ...(adminNotes !== undefined ? { adminNotes } : {}) },
    { new: true, runValidators: true }
  )
    .populate('user', 'name email')
    .populate('order', 'orderNumber totalPrice')
    .populate('items.product', 'name sku');

  if (!rma) throw new AppError('RMA یافت نشد', 404);
  return ApiResponse.success(res, rma, 'وضعیت RMA به‌روزرسانی شد');
});
