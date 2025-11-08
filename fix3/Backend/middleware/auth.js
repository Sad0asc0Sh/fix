const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError, catchAsync } = require('./errorHandler');
const mongoose = require('mongoose');

/**
 * ===============================
 * میدل‌ویر محافظت از روت‌ها (protect)
 * ===============================
 * @description احراز هویت کاربر با استفاده از JWT
 * @middleware
 */
exports.protect = catchAsync(async (req, res, next) => {
  // --- 📍 خط دیباگ ---
  console.log('--- [AUTH.JS] HEADER ---:', req.headers.authorization);
  console.log('--- [AUTH.JS] COOKIE ---:', req.cookies?.accessToken);
  // ---------------------

  let token;

  // ۱. استخراج توکن (از هدر Authorization یا کوکی accessToken)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  // بررسی وجود توکن
  if (!token) {
    return next(new AppError('شما احراز هویت نشده‌اید. لطفاً وارد شوید.', 401));
  }

  // ۲. اعتبارسنجی توکن
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('توکن نامعتبر است. لطفاً دوباره وارد شوید.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('توکن منقضی شده است. لطفاً دوباره وارد شوید.', 401));
    }
    return next(new AppError('خطا در اعتبارسنجی توکن.', 401));
  }

  // ۳. یافتن کاربر
  const currentUser = await User.findById(decoded.id).select(
    '+isActive +isLocked +passwordChangedAt +role'
  );

  if (!currentUser) {
    return next(new AppError('کاربر مربوط به این توکن دیگر وجود ندارد.', 401));
  }

  // ۴. بررسی وضعیت فعال بودن
  if (!currentUser.isActive) {
    return next(new AppError('حساب کاربری شما غیرفعال شده است.', 403));
  }

  // ۵. بررسی قفل بودن حساب
  if (currentUser.isLocked) {
    return next(new AppError('حساب شما به دلیل تلاش‌های ناموفق مکرر قفل شده است.', 423));
  }

  // ۶. بررسی تغییر رمز عبور بعد از صدور توکن
  if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('رمز عبور شما اخیراً تغییر کرده است. لطفاً دوباره وارد شوید.', 401));
  }

  // ۷. کاربر معتبر است
  req.user = currentUser;
  next();
});

/**
 * ===============================
 * میدل‌ویر مدیریت نقش‌ها (authorize)
 * ===============================
 * @description بررسی نقش کاربر برای دسترسی به منابع
 * @param {...string} roles - نقش‌های مجاز
 * @returns {Function} middleware function
 * @example authorize('admin', 'manager')
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // بررسی وجود کاربر
    if (!req.user) {
      return next(new AppError('کاربر احراز هویت نشده است.', 401));
    }

    // بررسی نقش
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`شما با نقش '${req.user.role}' مجاز به انجام این عملیات نیستید.`, 403)
      );
    }
    next();
  };
};

/**
 * ===============================
 * میدل‌ویر اختیاری (optional)
 * ===============================
 * @description احراز هویت اختیاری - بدون خطا در صورت نبودن توکن
 * @middleware
 */
exports.optional = catchAsync(async (req, res, next) => {
  let token;

  // استخراج توکن
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  // اگر توکن نبود، ادامه بده
  if (!token) {
    return next();
  }

  try {
    // اعتبارسنجی توکن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    // بررسی وضعیت کاربر
    if (
      user &&
      user.isActive &&
      !user.isLocked &&
      (!user.changedPasswordAfter || !user.changedPasswordAfter(decoded.iat))
    ) {
      req.user = user;
    }
  } catch (error) {
    // خطا در اعتبارسنجی توکن اختیاری مهم نیست
    console.warn('Optional auth token validation failed:', error.message);
  }

  next();
});

/**
 * ===============================
 * میدل‌ویر مالکیت منبع (checkOwnership)
 * ===============================
 * @description بررسی مالکیت کاربر بر یک منبع
 * @param {string} resourceModelName - نام مدل منبع
 * @param {string} userField - نام فیلد کاربر در مدل (پیش‌فرض: 'user')
 * @returns {Function} middleware function
 * @example checkOwnership('Order', 'user')
 */
exports.checkOwnership = (resourceModelName, userField = 'user') => {
  return catchAsync(async (req, res, next) => {
    // بررسی احراز هویت
    if (!req.user) {
      return next(new AppError('کاربر احراز هویت نشده است.', 401));
    }

    // گرفتن ID منبع از پارامترها
    const resourceId =
      req.params.id ||
      req.params.orderId ||
      req.params.reviewId ||
      req.params.productId;

    // اعتبارسنجی ID
    if (!resourceId) {
      return next(new AppError('شناسه منبع مورد نیاز است.', 400));
    }

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return next(new AppError(`شناسه ${resourceModelName} نامعتبر است.`, 400));
    }

    // یافتن منبع
    const Model = mongoose.model(resourceModelName);
    const resource = await Model.findById(resourceId);

    if (!resource) {
      return next(new AppError(`${resourceModelName} با شناسه ${resourceId} یافت نشد.`, 404));
    }

    // ادمین همیشه دسترسی دارد
    if (req.user.role === 'admin') {
      return next();
    }

    // بررسی مالکیت
    if (!resource[userField]) {
      console.error(
        `Error in checkOwnership: Field '${userField}' not found on '${resourceModelName}'.`
      );
      return next(new AppError('خطای داخلی در بررسی مالکیت.', 500));
    }

    const resourceUserId =
      typeof resource[userField].toString === 'function'
        ? resource[userField].toString()
        : String(resource[userField]);

    const currentUserId = req.user._id.toString();

    if (resourceUserId !== currentUserId) {
      return next(new AppError('شما مجاز به دسترسی یا تغییر این منبع نیستید.', 403));
    }

    // اضافه کردن منبع به request برای استفاده در میدل‌ویرهای بعدی
    req.resource = resource;
    next();
  });
};

/**
 * ===============================
 * میدل‌ویر تایید ایمیل (requireEmailVerified)
 * ===============================
 * @description الزام به تایید ایمیل قبل از دسترسی
 * @middleware
 */
exports.requireEmailVerified = (req, res, next) => {
  // بررسی احراز هویت
  if (!req.user) {
    return next(new AppError('کاربر احراز هویت نشده است.', 401));
  }

  // بررسی تایید ایمیل
  if (!req.user.isEmailVerified) {
    return next(new AppError('برای انجام این عملیات، لطفاً ابتدا ایمیل خود را تایید کنید.', 403));
  }

  next();
};

/**
 * ===============================
 * میدل‌ویر محدودیت حساب خودی (selfOnly)
 * ===============================
 * @description فقط دسترسی به اطلاعات خود کاربر
 * @middleware
 */
exports.selfOnly = (req, res, next) => {
  // بررسی احراز هویت
  if (!req.user) {
    return next(new AppError('کاربر احراز هویت نشده است.', 401));
  }

  // ID کاربر مورد نظر
  const requestedUserId = req.params.userId || req.params.id;
  const currentUserId = req.user._id.toString();

  // ادمین همیشه مجاز است
  if (req.user.role === 'admin') {
    return next();
  }

  // بررسی تطابق ID
  if (!requestedUserId || requestedUserId !== currentUserId) {
    return next(
      new AppError('شما فقط مجاز به دسترسی یا تغییر اطلاعات حساب کاربری خودتان هستید.', 403)
    );
  }

  next();
};

/**
 * ===============================
 * میدل‌ویر محدودیت IP (ipWhitelist) - اختیاری
 * ===============================
 * @description محدود کردن دسترسی به IP های خاص
 * @param {...string} allowedIPs - لیست IP های مجاز
 * @returns {Function} middleware function
 * @example ipWhitelist('127.0.0.1', '192.168.1.1')
 */
exports.ipWhitelist = (...allowedIPs) => {
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;

    if (!allowedIPs.includes(clientIp)) {
      return next(new AppError('دسترسی از این IP مجاز نیست.', 403));
    }

    next();
  };
};