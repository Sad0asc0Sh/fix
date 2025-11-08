// controllers/reviewController.js
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const mongoose = require('mongoose');

let cacheManager;
try {
  cacheManager = require('../utils/cacheManager'); // اختیاری
} catch (_) {}

/**
 * پاکسازی کش‌های مرتبط با محصول
 */
const clearRelatedProductCaches = (productId) => {
  try {
    const pid = String(productId);
    cacheManager?.clearPattern?.('/api/products');
    cacheManager?.clearPattern?.(`/api/products/${pid}`);
    cacheManager?.clearPattern?.(`/api/products/${pid}/reviews`);
  } catch (_) {}
};

/**
 * محاسبه و به‌روزرسانی میانگین امتیاز و تعداد نظرات محصول
 * فقط نظرات تایید شده لحاظ می‌شود
 */
const recalcProductRating = async (productId) => {
  try {
    const [{ avg = 0, count = 0 } = {}] = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
      { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      { $project: { _id: 0, avg: { $ifNull: ['$avg', 0] }, count: 1 } }
    ]);

    const rounded = Math.round((avg || 0) * 10) / 10;
    await Product.findByIdAndUpdate(
      productId,
      { $set: { rating: rounded, numReviews: count } },
      { new: true }
    );
  } catch (e) {
    // لاگ کردن خطا اختیاری
  }
};

// ==========================================
// کاربران
// ==========================================

// POST /api/products/:productId/reviews
exports.create = catchAsync(async (req, res, next) => {
  const { rating, comment } = req.body;
  const productId = req.params.productId;

  // بررسی محصول
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return next(new AppError('محصولی با این شناسه یافت نشد یا در دسترس نیست', 404));
  }

  // بررسی وجود نظر قبلی توسط همین کاربر
  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) {
    return next(new AppError('شما قبلاً برای این محصول نظر ثبت کرده‌اید', 400));
  }

  // بررسی خرید قبلی (تحویل شده)
  const hasBought = await Order.findOne({
    user: req.user._id,
    'orderItems.product': new mongoose.Types.ObjectId(productId),
    isDelivered: true
  }).select('_id');

  // ساخت نظر (پیش‌فرض: pending تا ادمین تایید کند)
  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating: Math.max(1, Math.min(5, Number(rating))), // اطمینان از 1..5
    comment: (comment || '').trim(),
    isVerifiedPurchase: !!hasBought,
    status: 'pending'
  });

  await review.populate('user', 'name avatar');

  clearRelatedProductCaches(productId);
  // میانگین امتیاز پس از تایید ادمین آپدیت می‌شود

  res.status(201).json({
    success: true,
    message: 'نظر شما با موفقیت ثبت شد و پس از تأیید نمایش داده خواهد شد.',
    data: review
  });
});

// GET /api/products/:productId/reviews
exports.getByProduct = catchAsync(async (req, res, next) => {
  const productId = req.params.productId;
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 5, 100);
  const skip = (page - 1) * limit;

  const queryFilter = { product: productId, status: 'approved' };

  const [reviews, total, ratingStats] = await Promise.all([
    Review.find(queryFilter)
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Review.countDocuments(queryFilter),
    Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $project: { _id: 0, rating: '$_id', count: 1 } },
      { $sort: { rating: -1 } }
    ])
  ]);

  res.status(200).json({
    success: true,
    count: reviews.length,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total
    },
    stats: ratingStats,
    data: reviews
  });
});

// GET /api/reviews/my-reviews
exports.myReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('product', 'name images slug')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// DELETE /api/reviews/:id
exports.delete = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('نظری با این شناسه یافت نشد', 404));
  }

  // فقط صاحب نظر یا ادمین
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('شما مجاز به حذف این نظر نیستید', 403));
  }

  const productId = review.product;
  await review.deleteOne();

  // به‌روزرسانی امتیاز محصول پس از حذف
  await recalcProductRating(productId);
  clearRelatedProductCaches(productId);

  res.status(200).json({
    success: true,
    message: 'نظر با موفقیت حذف شد.',
    data: {}
  });
});

// ==========================================
// ادمین (روت‌ها در /api/admin/reviews)
// ==========================================

// GET /api/admin/reviews/dashboard
exports.adminDashboard = catchAsync(async (req, res, next) => {
  const stats = await Review.aggregate([
    {
      $facet: {
        statusCount: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        ratingAvg: [
          { $match: { status: 'approved' } },
          { $group: { _id: null, avg: { $avg: '$rating' } } }
        ],
        recent: [
          { $match: { status: 'pending' } },
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
          { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
          { $unwind: '$user' },
          { $unwind: '$product' },
          {
            $project: {
              rating: 1,
              comment: 1,
              createdAt: 1,
              'user.name': 1,
              'product.name': 1
            }
          }
        ]
      }
    }
  ]);

  const result = stats[0] || { statusCount: [], ratingAvg: [], recent: [] };
  const statusMap = {};
  (result.statusCount || []).forEach((item) => {
    statusMap[item._id] = item.count;
  });
  const avgRating = Math.round(((result.ratingAvg?.[0]?.avg) || 0) * 10) / 10;

  const recentPending = (result.recent || []).map((r) => ({
    _id: r._id,
    rating: r.rating,
    comment: (r.comment || '').substring(0, 50) + (r.comment && r.comment.length > 50 ? '...' : ''),
    createdAt: r.createdAt,
    user: r.user ? `${r.user.name}` : 'کاربر حذف شده',
    product: r.product ? r.product.name : 'محصول حذف شده'
  }));

  res.status(200).json({
    success: true,
    data: {
      pending: statusMap.pending || 0,
      approved: statusMap.approved || 0,
      rejected: statusMap.rejected || 0,
      avgRating,
      recentPending
    }
  });
});

// GET /api/admin/reviews
exports.adminList = catchAsync(async (req, res, next) => {
  const {
    status,
    rating,
    search,
    page = 1,
    limit = 20,
    sort = '-createdAt',
    productId,
    userId
  } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) filter.status = status;
  if (rating) filter.rating = parseInt(rating);
  if (productId) filter.product = productId;
  if (userId) filter.user = userId;

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.comment = searchRegex;
  }

  const sortObj = {};
  sort.split(',').forEach((s) => {
    const dir = s.startsWith('-') ? -1 : 1;
    const field = s.startsWith('-') ? s.substring(1) : s;
    sortObj[field] = dir;
  });

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name email')
      .populate('product', 'name')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit)),
    Review.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    count: reviews.length,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalReviews: total
    },
    data: reviews
  });
});

// PUT /api/admin/reviews/:id/status
exports.updateStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return next(new AppError('وضعیت نامعتبر است.', 400));
  }

  const review = await Review.findOneAndUpdate(
    { _id: id },
    { status },
    { new: true, runValidators: true }
  )
    .populate('user', 'name')
    .populate('product', 'name');

  if (!review) {
    return next(new AppError('نظری با این شناسه یافت نشد', 404));
  }

  // به‌روزرسانی میانگین امتیاز در صورت تایید/رد
  await recalcProductRating(review.product);
  clearRelatedProductCaches(review.product);

  res.status(200).json({
    success: true,
    message: `وضعیت نظر به '${status}' تغییر یافت.`,
    data: review
  });
});

// POST /api/admin/reviews/:id/reply
exports.reply = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || text.trim().length < 5) {
    return next(new AppError('متن پاسخ نمی‌تواند خالی باشد.', 400));
  }

  const review = await Review.findById(id);
  if (!review) {
    return next(new AppError('نظری با این شناسه یافت نشد', 404));
  }

  review.adminReply = {
    text: text.trim(),
    repliedAt: new Date(),
    repliedBy: req.user._id
  };
  review.status = 'approved';

  await review.save();

  await review.populate('user', 'name');
  await review.populate('product', 'name');

  // به‌روزرسانی میانگین امتیاز (الان تایید شده است)
  await recalcProductRating(review.product);
  clearRelatedProductCaches(review.product);

  res.status(200).json({
    success: true,
    message: 'پاسخ شما برای نظر ثبت و نظر تأیید شد.',
    data: review
  });
});