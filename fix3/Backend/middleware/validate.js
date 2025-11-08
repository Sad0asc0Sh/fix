const { validationResult } = require('express-validator');
// اطمینان حاصل کن که مسیر این فایل درسته
const { AppError } = require('./errorHandler'); 

/**
 * ====================================
 * میدل‌ویر اعتبارسنجی ورودی‌ها (validate)
 * ====================================
 * نتایج express-validator را بررسی می‌کند و در صورت وجود خطا،
 * آن‌ها را به صورت یک آبجکت به errorHandler ارسال می‌کند.
 */

// ❗️❗️ تغییر اصلی اینجاست ❗️❗️
exports.validate = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    // تبدیل خطاها به فرمت ساده‌تر
    const extractedErrors = {};
    errors.array({ onlyFirstError: true }).forEach(err => {
        const field = err.path || err.param || 'general';
        extractedErrors[field] = err.msg;
    });

    return next(new AppError('داده‌های ورودی نامعتبر است', 400, extractedErrors));
};

// ❗️❗️ این خط رو حذف کن ❗️❗️
// module.exports = validate;