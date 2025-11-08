/**
 * ====================================
 * Rate Limiter Middleware - محدودیت درخواست
 * ====================================
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// ======================================================
// محدودیت عمومی API
// ======================================================
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقیقه
    max: 100, // حداکثر 100 درخواست
    message: {
        success: false,
        message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            user: req.user?.id
        });

        res.status(429).json({
            success: false,
            message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید',
            retryAfter: req.rateLimit.resetTime
        });
    }
});

// ======================================================
// محدودیت برای ورود و ثبت‌نام
// ======================================================
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقیقه
    max: 5, // حداکثر 5 تلاش
    skipSuccessfulRequests: true, // درخواست‌های موفق را نشمار
    message: {
        success: false,
        message: 'تعداد تلاش‌های ورود شما بیش از حد مجاز است. لطفاً ۱۵ دقیقه بعد تلاش کنید'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Auth rate limit exceeded', {
            ip: req.ip,
            email: req.body.email
        });

        res.status(429).json({
            success: false,
            message: 'تعداد تلاش‌های ورود شما بیش از حد مجاز است. لطفاً ۱۵ دقیقه صبر کنید',
            retryAfter: new Date(Date.now() + 15 * 60 * 1000)
        });
    }
});

// ======================================================
// محدودیت برای بازیابی رمز عبور
// ======================================================
exports.passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 ساعت
    max: 3, // حداکثر 3 درخواست
    message: {
        success: false,
        message: 'تعداد درخواست‌های بازیابی رمز عبور بیش از حد مجاز است. لطفاً ۱ ساعت بعد تلاش کنید'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ======================================================
// محدودیت برای ثبت نظر
// ======================================================
exports.reviewLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 ساعت
    max: 10, // حداکثر 10 نظر
    message: {
        success: false,
        message: 'شما نمی‌توانید بیش از ۱۰ نظر در ساعت ثبت کنید'
    },
    skipSuccessfulRequests: false
});

// ======================================================
// محدودیت برای آپلود فایل
// ======================================================
exports.uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 ساعت
    max: 20, // حداکثر 20 آپلود
    message: {
        success: false,
        message: 'تعداد آپلود فایل شما بیش از حد مجاز است'
    },
    skipSuccessfulRequests: false
});

// ======================================================
// محدودیت برای ثبت سفارش
// ======================================================
exports.orderLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 ساعت
    max: 10, // حداکثر 10 سفارش
    message: {
        success: false,
        message: 'شما نمی‌توانید بیش از ۱۰ سفارش در ساعت ثبت کنید'
    }
});

// ======================================================
// محدودیت سفارشی
// ======================================================
exports.createLimiter = (windowMinutes, maxRequests, message) => {
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        max: maxRequests,
        message: {
            success: false,
            message: message || 'تعداد درخواست‌های شما بیش از حد مجاز است'
        },
        standardHeaders: true,
        legacyHeaders: false
    });
};