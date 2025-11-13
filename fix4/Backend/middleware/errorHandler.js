const fs = require('fs');
const path = require('path');

/**
 * ====================================
 * کلاس سفارشی برای خطاهای API (Operational Errors)
 * ====================================
 */
class AppError extends Error {
    constructor(message, statusCode, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * ====================================
 * لاگ کردن جزئیات خطا در فایل (برای Production)
 * ====================================
 */
const logErrorToFile = (err, req) => {
    const logsDir = path.join(__dirname, '../logs');
    
    try {
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
    } catch (mkdirErr) {
        console.error('🔴 خطا در ایجاد پوشه لاگ:', mkdirErr);
        return;
    }

    const errorLog = {
        timestamp: new Date().toISOString(),
        name: err.name,
        message: err.message,
        statusCode: err.statusCode || 500,
        status: err.status || 'error',
        isOperational: err.isOperational || false,
        path: req?.path || 'N/A',
        method: req?.method || 'N/A',
        ip: req?.ip || 'N/A',
        user: req?.user?._id || 'Unauthorized',
        stack: err.stack
    };

    const logFile = path.join(logsDir, 'error.log');
    const logString = 
        `--- ERROR @ ${errorLog.timestamp} ---\n` +
        `Status: ${errorLog.statusCode} (${errorLog.status})\n` +
        `Operational: ${errorLog.isOperational}\n` +
        `Path: ${errorLog.method} ${errorLog.path}\n` +
        `User: ${errorLog.user} | IP: ${errorLog.ip}\n` +
        `Name: ${errorLog.name}\n` +
        `Message: ${errorLog.message}\n` +
        `Stack:\n${errorLog.stack}\n` +
        '='.repeat(80) + '\n\n';

    fs.appendFile(logFile, logString, (writeErr) => {
        if (writeErr) {
            console.error('🔴 خطا در نوشتن لاگ:', writeErr);
        }
    });
};

/**
 * ====================================
 * توابع کمکی برای تبدیل خطاهای خاص به AppError
 * ====================================
 */
const handleCastErrorDB = (err) => {
    const message = `مقدار '${err.value}' برای فیلد '${err.path}' نامعتبر است`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const field = Object.keys(err.keyValue)[0];
    const value = Object.values(err.keyValue)[0];
    const message = `مقدار '${value}' برای فیلد '${field}' قبلاً استفاده شده است`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `داده‌های ورودی نامعتبر: ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => {
    return new AppError('توکن احراز هویت نامعتبر است. لطفاً دوباره وارد شوید', 401);
};

const handleJWTExpiredError = () => {
    return new AppError('نشست شما منقضی شده است. لطفاً دوباره وارد شوید', 401);
};

/**
 * ====================================
 * ارسال خطا در حالت Development (جزئیات کامل)
 * ====================================
 */
const sendErrorDev = (err, req, res) => {
    console.error('🔴 ERROR (DEV):', {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode,
        stack: err.stack
    });

    res.status(err.statusCode || 500).json({
        success: false,
        status: err.status || 'error',
        error: {
            name: err.name,
            message: err.message,
            statusCode: err.statusCode,
            errors: err.errors
        },
        message: err.message,
        errors: err.errors,
        stack: err.stack
    });
};

/**
 * ====================================
 * ارسال خطا در حالت Production (فقط پیام‌های امن)
 * ====================================
 */
const sendErrorProd = (err, req, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            errors: err.errors
        });
    } else {
        console.error('💥 UNEXPECTED ERROR:', {
            name: err.name,
            message: err.message,
            stack: err.stack
        });
        
        logErrorToFile(err, req);
        
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'خطایی در سمت سرور رخ داده است'
        });
    }
};

/**
 * ====================================
 * میدل‌ویر اصلی Error Handler (نقطه مرکزی)
 * ====================================
 */
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else {
        let error = { ...err };
        error.message = err.message;
        error.name = err.name;
        error.stack = err.stack;

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
};

/**
 * ====================================
 * میدل‌ویر Not Found (404)
 * ====================================
 */
const notFound = (req, res, next) => {
    const message = `مسیر درخواستی '${req.originalUrl}' در این سرور یافت نشد`;
    next(new AppError(message, 404));
};

/**
 * ====================================
 * ابزار کمکی catchAsync
 * ====================================
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

/**
 * ====================================
 * هندلرهای سراسری خطاهای Unhandled
 * ====================================
 */
const handleUnhandledRejection = (server) => {
    process.on('unhandledRejection', (err) => {
        console.error('💥 UNHANDLED REJECTION! Shutting down...');
        console.error('Name:', err.name);
        console.error('Message:', err.message);
        
        if (server) {
            server.close(() => {
                console.log('✅ سرور بسته شد');
                process.exit(1);
            });
        } else {
            process.exit(1);
        }
    });
};

const handleUncaughtException = () => {
    process.on('uncaughtException', (err) => {
        console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
        console.error('Name:', err.name);
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);
        
        process.exit(1);
    });
};

/**
 * ====================================
 * Export
 * ====================================
 */
module.exports = {
    errorHandler,
    notFound,
    catchAsync,
    AppError,
    handleUnhandledRejection,
    handleUncaughtException
};