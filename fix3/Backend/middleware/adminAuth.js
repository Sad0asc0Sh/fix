/**
 * ====================================
 * Admin Auth Middleware - احراز هویت ادمین
 * ====================================
 */

const { AppError } = require('./errorHandler');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ======================================================
// بررسی نقش ادمین
// ======================================================
exports.isAdmin = (req, res, next) => {
    try {
        // بررسی وجود کاربر (از middleware protect)
        if (!req.user) {
            return next(new AppError('لطفاً وارد حساب کاربری خود شوید', 401));
        }

        // بررسی نقش
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            logger.warn('تلاش برای دسترسی غیرمجاز به پنل ادمین', {
                userId: req.user.id,
                role: req.user.role,
                ip: req.ip
            });

            return ApiResponse.forbidden(res, 'شما مجاز به دسترسی به این بخش نیستید');
        }

        // ادامه به controller
        next();
    } catch (error) {
        logger.error('خطا در middleware ادمین:', error);
        next(error);
    }
};

// ======================================================
// بررسی نقش Super Admin (اختیاری)
// ======================================================
exports.isSuperAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return next(new AppError('لطفاً وارد حساب کاربری خود شوید', 401));
        }

        if (req.user.role !== 'admin') {
            logger.warn('تلاش برای دسترسی به بخش مدیر ارشد', {
                userId: req.user.id,
                role: req.user.role
            });

            return ApiResponse.forbidden(res, 'فقط مدیران ارشد به این بخش دسترسی دارند');
        }

        next();
    } catch (error) {
        logger.error('خطا در middleware مدیر ارشد:', error);
        next(error);
    }
};

// ======================================================
// بررسی دسترسی بر اساس نقش‌های چندگانه
// ======================================================
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return next(new AppError('لطفاً وارد حساب کاربری خود شوید', 401));
            }

            if (!roles.includes(req.user.role)) {
                logger.warn('دسترسی غیرمجاز', {
                    userId: req.user.id,
                    role: req.user.role,
                    requiredRoles: roles
                });

                return ApiResponse.forbidden(
                    res,
                    'شما مجاز به انجام این عملیات نیستید'
                );
            }

            next();
        } catch (error) {
            logger.error('خطا در بررسی نقش:', error);
            next(error);
        }
    };
};

// ======================================================
// بررسی مالکیت منبع
// ======================================================
exports.checkOwnership = (Model, paramName = 'id') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[paramName];
            const resource = await Model.findById(resourceId);

            if (!resource) {
                return next(new AppError('منبع مورد نظر یافت نشد', 404));
            }

            // ادمین‌ها به همه چیز دسترسی دارند
            if (req.user.role === 'admin' || req.user.role === 'manager') {
                req.resource = resource;
                return next();
            }

            // بررسی مالکیت
            if (resource.user && resource.user.toString() !== req.user.id) {
                logger.warn('تلاش برای دسترسی به منبع دیگران', {
                    userId: req.user.id,
                    resourceId,
                    resourceOwner: resource.user
                });

                return ApiResponse.forbidden(
                    res,
                    'شما مجاز به دسترسی به این منبع نیستید'
                );
            }

            // ذخیره منبع برای استفاده در controller
            req.resource = resource;
            next();
        } catch (error) {
            logger.error('خطا در بررسی مالکیت:', error);
            next(error);
        }
    };
};