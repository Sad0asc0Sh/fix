const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

// ======================================================
// ۱. پیکربندی Cloudinary
// ======================================================
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// بررسی تنظیمات Cloudinary
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    logger.warn('⚠️ تنظیمات Cloudinary در .env یافت نشد - آپلود تصاویر غیرفعال است');
}

// ======================================================
// ۲. Storage برای انواع مختلف آپلود
// ======================================================
const createStorage = (folderName, transformations = []) => {
    return new CloudinaryStorage({
        cloudinary: cloudinary,
        params: (req, file) => {
            const fileName = path.parse(file.originalname).name
                .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '-') // حذف کاراکترهای خاص
                .substring(0, 50); // محدود کردن طول نام

            return {
                folder: folderName,
                public_id: `${fileName}-${Date.now()}`,
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                transformation: transformations
            };
        }
    });
};

// ======================================================
// ۳. Storageهای مختلف
// ======================================================
const productStorage = createStorage('welfvita/products', [
    { width: 1000, height: 1000, crop: 'limit' },
    { quality: 'auto' },
    { fetch_format: 'auto' }
]);

const avatarStorage = createStorage('welfvita/avatars', [
    { width: 400, height: 400, crop: 'fill', gravity: 'face' },
    { quality: 'auto' },
    { fetch_format: 'auto' }
]);

const categoryStorage = createStorage('welfvita/categories', [
    { width: 600, height: 400, crop: 'limit' },
    { quality: 'auto' },
    { fetch_format: 'auto' }
]);

// ======================================================
// ۴. فیلتر فایل
// ======================================================
const imageFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('فقط فایل‌های تصویری (JPG, PNG, WEBP) مجاز هستند', 400), false);
    }
};

// ======================================================
// ۵. تنظیمات Multer
// ======================================================
const createUploader = (storage, maxSize = 5, maxCount = 1) => {
    return multer({
        storage: storage,
        fileFilter: imageFilter,
        limits: {
            fileSize: maxSize * 1024 * 1024, // MB to bytes
            files: maxCount
        }
    });
};

// ======================================================
// ۶. Uploaderهای مختلف
// ======================================================
// آپلود تک تصویر محصول
const uploadProductImage = createUploader(productStorage, 5, 1).single('image');

// آپلود چند تصویر محصول (حداکثر 5 تا)
const uploadProductImages = createUploader(productStorage, 5, 5).array('images', 5);

// آپلود آواتار کاربر
const avatarUpload = createUploader(avatarStorage, 2, 1).single('avatar');

// آپلود تصویر دسته‌بندی
const uploadCategoryImage = createUploader(categoryStorage, 3, 1).single('image');

// ======================================================
// ۷. Middleware برای مدیریت خطاهای Multer
// ======================================================
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('حجم فایل بیش از حد مجاز است', 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new AppError('تعداد فایل‌ها بیش از حد مجاز است', 400));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new AppError('فیلد آپلود نامعتبر است', 400));
        }
        return next(new AppError(err.message, 400));
    }
    next(err);
};

// ======================================================
// ۸. تابع حذف تصویر از Cloudinary
// ======================================================
const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            throw new Error('شناسه تصویر موجود نیست');
        }

        const result = await cloudinary.uploader.destroy(publicId);
        
        if (result.result === 'ok') {
            logger.info(`تصویر حذف شد: ${publicId}`);
            return { success: true, result };
        } else {
            logger.warn(`تصویر یافت نشد: ${publicId}`);
            return { success: false, result };
        }
    } catch (error) {
        logger.error('خطا در حذف تصویر از Cloudinary:', error);
        throw new AppError('خطا در حذف تصویر', 500);
    }
};

// ======================================================
// ۹. تابع حذف چندین تصویر
// ======================================================
const deleteMultipleFromCloudinary = async (publicIds) => {
    try {
        if (!publicIds || publicIds.length === 0) {
            return { success: true, deleted: 0 };
        }

        const result = await cloudinary.api.delete_resources(publicIds);
        
        logger.info(`${Object.keys(result.deleted).length} تصویر حذف شد از Cloudinary`);
        
        return { 
            success: true, 
            deleted: Object.keys(result.deleted).length,
            result 
        };
    } catch (error) {
        logger.error('خطا در حذف تصاویر از Cloudinary:', error);
        throw new AppError('خطا در حذف تصاویر', 500);
    }
};

// ======================================================
// ۱۰. استخراج public_id از URL
// ======================================================
const extractPublicId = (url) => {
    if (!url) return null;
    
    // مثال URL: https://res.cloudinary.com/demo/image/upload/v1234567890/welfvita/products/image-name.jpg
    const matches = url.match(/\/([^\/]+)\.[a-z]{3,4}$/i);
    if (!matches) return null;
    
    // استخراج folder و filename
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    
    const pathParts = parts[1].split('/');
    pathParts.shift(); // حذف version (v1234567890)
    
    return pathParts.join('/').replace(/\.[^/.]+$/, ''); // حذف extension
};

// ======================================================
// Export
// ======================================================
module.exports = {
    // Uploaders
    uploadProductImage,
    uploadProductImages,
    avatarUpload,
    uploadCategoryImage,
    
    // Error handler
    handleMulterError,
    
    // Cloudinary helpers
    cloudinary,
    deleteFromCloudinary,
    deleteMultipleFromCloudinary,
    extractPublicId,
    
    // برای سازگاری با کد قدیمی
    default: uploadProductImage
};