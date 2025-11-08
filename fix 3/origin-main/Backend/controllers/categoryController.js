/**
 * ====================================
 * Category Controller - مدیریت دسته‌بندی‌ها
 * ====================================
 */

const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiResponse = require('../utils/apiResponse');
const ApiFeatures = require('../utils/apiFeatures');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const cacheManager = require('../utils/cacheManager');
const { deleteFromCloudinary } = require('../middleware/upload');

// ======================================================
// @desc    دریافت تمام دسته‌بندی‌ها
// @route   GET /api/categories
// @access  Public
// ======================================================
exports.getCategories = async (req, res, next) => {
    try {
        const features = new ApiFeatures(
            Category.find(),
            req.query
        )
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const { data: categories, pagination } = await features.execute(Category);

        logger.info('لیست دسته‌بندی‌ها دریافت شد', { 
            count: categories.length 
        });

        return ApiResponse.successWithPagination(
            res,
            categories,
            pagination,
            'لیست دسته‌بندی‌ها با موفقیت دریافت شد'
        );

    } catch (error) {
        logger.error('خطا در دریافت دسته‌بندی‌ها:', error);
        next(error);
    }
};

// ======================================================
// @desc    دریافت درخت دسته‌بندی‌ها
// @route   GET /api/categories/tree
// @access  Public
// ======================================================
exports.getCategoryTree = async (req, res, next) => {
    try {
        const tree = await Category.getCategoryTree();

        logger.info('درخت دسته‌بندی‌ها دریافت شد');

        return ApiResponse.success(
            res,
            tree,
            'درخت دسته‌بندی‌ها با موفقیت دریافت شد'
        );

    } catch (error) {
        logger.error('خطا در دریافت درخت دسته‌بندی:', error);
        next(error);
    }
};

// ======================================================
// @desc    دریافت دسته‌بندی‌های اصلی
// @route   GET /api/categories/root
// @access  Public
// ======================================================
exports.getRootCategories = async (req, res, next) => {
    try {
        const categories = await Category.getRootCategories();

        logger.info('دسته‌بندی‌های اصلی دریافت شد', { 
            count: categories.length 
        });

        return ApiResponse.success(
            res,
            categories,
            'دسته‌بندی‌های اصلی با موفقیت دریافت شد'
        );

    } catch (error) {
        logger.error('خطا در دریافت دسته‌بندی‌های اصلی:', error);
        next(error);
    }
};

// ======================================================
// @desc    دریافت یک دسته‌بندی با شناسه
// @route   GET /api/categories/:id
// @access  Public
// ======================================================
exports.getCategoryById = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parent', 'name slug')
            .populate('children', 'name slug image');

        if (!category) {
            return next(new AppError('دسته‌بندی یافت نشد', 404));
        }

        logger.info('دسته‌بندی دریافت شد', { categoryId: category._id });

        return ApiResponse.success(
            res,
            category,
            'دسته‌بندی با موفقیت دریافت شد'
        );

    } catch (error) {
        logger.error('خطا در دریافت دسته‌بندی:', error);
        next(error);
    }
};

// ======================================================
// @desc    دریافت دسته‌بندی با Slug
// @route   GET /api/categories/slug/:slug
// @access  Public
// ======================================================
exports.getCategoryBySlug = async (req, res, next) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug })
            .populate('parent', 'name slug')
            .populate('children', 'name slug image')
            .populate('productsCount');

        if (!category) {
            return next(new AppError('دسته‌بندی یافت نشد', 404));
        }

        logger.info('دسته‌بندی با slug دریافت شد', { slug: req.params.slug });

        return ApiResponse.success(
            res,
            category,
            'دسته‌بندی با موفقیت دریافت شد'
        );

    } catch (error) {
        logger.error('خطا در دریافت دسته‌بندی:', error);
        next(error);
    }
};

// ======================================================
// @desc    دریافت محصولات یک دسته‌بندی
// @route   GET /api/categories/:id/products
// @access  Public
// ======================================================
exports.getCategoryProducts = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return next(new AppError('دسته‌بندی یافت نشد', 404));
        }

        // دریافت محصولات این دسته‌بندی
        const features = new ApiFeatures(
            Product.find({ category: category.name, isActive: true }),
            req.query
        )
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const { data: products, pagination } = await features.execute(Product);

        logger.info('محصولات دسته‌بندی دریافت شد', {
            categoryId: category._id,
            count: products.length
        });

        return ApiResponse.successWithPagination(
            res,
            {
                category: {
                    _id: category._id,
                    name: category.name,
                    slug: category.slug,
                    image: category.image
                },
                products
            },
            pagination,
            'محصولات با موفقیت دریافت شد'
        );

    } catch (error) {
        logger.error('خطا در دریافت محصولات دسته‌بندی:', error);
        next(error);
    }
};

// ======================================================
// @desc    ایجاد دسته‌بندی جدید
// @route   POST /api/categories
// @access  Private/Admin
// ======================================================
exports.createCategory = async (req, res, next) => {
    try {
        // اضافه کردن آدرس تصویر از آپلود (اگر وجود داشت)
        if (req.file) {
            req.body.image = req.file.path;
        }

        const category = await Category.create(req.body);

        // پاک کردن کش دسته‌بندی‌ها
        cacheManager.clearPattern('categories');

        logger.info('دسته‌بندی جدید ایجاد شد', {
            categoryId: category._id,
            userId: req.user.id
        });

        return ApiResponse.success(
            res,
            category,
            'دسته‌بندی با موفقیت ایجاد شد',
            201
        );

    } catch (error) {
        // حذف تصویر آپلود شده در صورت خطا
        if (req.file && req.file.path) {
            try {
                const publicId = req.file.path.split('/').pop().split('.')[0];
                await deleteFromCloudinary(`welfvita/categories/${publicId}`);
            } catch (err) {
                logger.warn('خطا در حذف تصویر:', err);
            }
        }

        logger.error('خطا در ایجاد دسته‌بندی:', error);
        next(error);
    }
};

// ======================================================
// @desc    به‌روزرسانی دسته‌بندی
// @route   PUT /api/categories/:id
// @access  Private/Admin
// ======================================================
exports.updateCategory = async (req, res, next) => {
    try {
        let category = await Category.findById(req.params.id);

        if (!category) {
            return next(new AppError('دسته‌بندی یافت نشد', 404));
        }

        // اگر تصویر جدید آپلود شده، تصویر قدیمی را حذف کن
        if (req.file) {
            // حذف تصویر قبلی از Cloudinary
            if (category.image && category.image.includes('cloudinary')) {
                try {
                    const publicId = category.image.split('/').pop().split('.')[0];
                    await deleteFromCloudinary(`welfvita/categories/${publicId}`);
                } catch (err) {
                    logger.warn('خطا در حذف تصویر قبلی:', err);
                }
            }

            req.body.image = req.file.path;
        }

        // به‌روزرسانی
        category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        // پاک کردن کش
        cacheManager.clearPattern('categories');

        logger.info('دسته‌بندی به‌روزرسانی شد', {
            categoryId: category._id,
            userId: req.user.id
        });

        return ApiResponse.success(
            res,
            category,
            'دسته‌بندی با موفقیت به‌روزرسانی شد'
        );

    } catch (error) {
        // حذف تصویر جدید در صورت خطا
        if (req.file && req.file.path) {
            try {
                const publicId = req.file.path.split('/').pop().split('.')[0];
                await deleteFromCloudinary(`welfvita/categories/${publicId}`);
            } catch (err) {
                logger.warn('خطا در حذف تصویر:', err);
            }
        }

        logger.error('خطا در به‌روزرسانی دسته‌بندی:', error);
        next(error);
    }
};

// ======================================================
// @desc    حذف دسته‌بندی
// @route   DELETE /api/categories/:id
// @access  Private/Admin
// ======================================================
exports.deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return next(new AppError('دسته‌بندی یافت نشد', 404));
        }

        // بررسی وجود زیر دسته
        const childrenCount = await Category.countDocuments({ parent: category._id });

        if (childrenCount > 0) {
            return next(new AppError(
                `این دسته‌بندی دارای ${childrenCount} زیر دسته است. ابتدا آنها را حذف کنید`,
                400
            ));
        }

        // بررسی وجود محصول
        const productsCount = await Product.countDocuments({ category: category.name });

        if (productsCount > 0) {
            return next(new AppError(
                `این دسته‌بندی دارای ${productsCount} محصول است. ابتدا آنها را حذف یا منتقل کنید`,
                400
            ));
        }

        // حذف تصویر از Cloudinary
        if (category.image && category.image.includes('cloudinary')) {
            try {
                const publicId = category.image.split('/').pop().split('.')[0];
                await deleteFromCloudinary(`welfvita/categories/${publicId}`);
            } catch (err) {
                logger.warn('خطا در حذف تصویر:', err);
            }
        }

        await category.deleteOne();

        // پاک کردن کش
        cacheManager.clearPattern('categories');

        logger.info('دسته‌بندی حذف شد', {
            categoryId: category._id,
            userId: req.user.id
        });

        return ApiResponse.success(
            res,
            null,
            'دسته‌بندی با موفقیت حذف شد'
        );

    } catch (error) {
        logger.error('خطا در حذف دسته‌بندی:', error);
        next(error);
    }
};

// ======================================================
// @desc    فعال/غیرفعال کردن دسته‌بندی
// @route   PUT /api/categories/:id/toggle
// @access  Private/Admin
// ======================================================
exports.toggleCategoryStatus = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return next(new AppError('دسته‌بندی یافت نشد', 404));
        }

        category.isActive = !category.isActive;
        await category.save();

        // پاک کردن کش
        cacheManager.clearPattern('categories');

        logger.info('وضعیت دسته‌بندی تغییر کرد', {
            categoryId: category._id,
            newStatus: category.isActive,
            userId: req.user.id
        });

        return ApiResponse.success(
            res,
            category,
            `دسته‌بندی ${category.isActive ? 'فعال' : 'غیرفعال'} شد`
        );

    } catch (error) {
        logger.error('خطا در تغییر وضعیت دسته‌بندی:', error);
        next(error);
    }
};

// ======================================================
// @desc    تنظیم دسته‌بندی ویژه
// @route   PUT /api/categories/:id/featured
// @access  Private/Admin
// ======================================================
exports.setFeaturedCategory = async (req, res, next) => {
    try {
        const { isFeatured } = req.body;

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { isFeatured },
            { new: true, runValidators: true }
        );

        if (!category) {
            return next(new AppError('دسته‌بندی یافت نشد', 404));
        }

        // پاک کردن کش
        cacheManager.clearPattern('categories');

        logger.info('دسته‌بندی ویژه تنظیم شد', {
            categoryId: category._id,
            isFeatured,
            userId: req.user.id
        });

        return ApiResponse.success(
            res,
            category,
            `دسته‌بندی ${isFeatured ? 'ویژه' : 'عادی'} شد`
        );

    } catch (error) {
        logger.error('خطا در تنظیم دسته‌بندی ویژه:', error);
        next(error);
    }
};

// ======================================================
// @desc    دریافت دسته‌بندی‌های ویژه
// @route   GET /api/categories/featured
// @access  Public
// ======================================================
exports.getFeaturedCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({ 
            isActive: true, 
            isFeatured: true 
        })
            .sort('order')
            .limit(10);

        logger.info('دسته‌بندی‌های ویژه دریافت شد', { 
            count: categories.length 
        });

        return ApiResponse.success(
            res,
            categories,
            'دسته‌بندی‌های ویژه با موفقیت دریافت شد'
        );

    } catch (error) {
        logger.error('خطا در دریافت دسته‌بندی‌های ویژه:', error);
        next(error);
    }
};

// ======================================================
// @desc    جستجو در دسته‌بندی‌ها
// @route   GET /api/categories/search
// @access  Public
// ======================================================
exports.searchCategories = async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return next(new AppError('لطفاً حداقل ۲ کاراکتر وارد کنید', 400));
        }

        const categories = await Category.find({
            isActive: true,
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ]
        })
            .select('name slug image description')
            .limit(10);

        logger.info('جستجو در دسته‌بندی‌ها', {
            query: q,
            results: categories.length
        });

        return ApiResponse.success(
            res,
            categories,
            `${categories.length} دسته‌بندی یافت شد`
        );

    } catch (error) {
        logger.error('خطا در جستجوی دسته‌بندی:', error);
        next(error);
    }
};