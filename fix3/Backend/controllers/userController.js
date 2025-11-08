/**
 * ====================================
 * User Controller - مدیریت پروفایل کاربر
 * ====================================
 */

const User = require('../models/User');
const Address = require('../models/Address');
const Order = require('../models/Order');
const ApiResponse = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { deleteFromCloudinary } = require('../middleware/upload');

// ======================================================
// @desc    دریافت پروفایل کاربر جاری
// @route   GET /api/users/profile
// @access  Private
// ======================================================
exports.getProfile = async (req, res, next) => {
    try {
        // کاربر از middleware auth می‌آید
        const user = await User.findById(req.user.id)
            .select('-password -loginAttempts -lockUntil -resetPasswordToken -emailVerificationToken');

        if (!user) {
            return next(new AppError('کاربر یافت نشد', 404));
        }

        logger.info(`پروفایل دریافت شد`, { userId: user._id });

        return ApiResponse.success(res, user, 'پروفایل با موفقیت دریافت شد');
    } catch (error) {
        logger.error('خطا در دریافت پروفایل:', error);
        next(error);
    }
};

// ======================================================
// @desc    به‌روزرسانی پروفایل کاربر
// @route   PUT /api/users/profile
// @access  Private
// ======================================================
exports.updateProfile = async (req, res, next) => {
    try {
        const { name, phone, preferences } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return next(new AppError('کاربر یافت نشد', 404));
        }

        // فیلدهای قابل ویرایش
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (preferences) {
            user.preferences = {
                ...user.preferences,
                ...preferences
            };
        }

        await user.save();

        logger.info('پروفایل به‌روزرسانی شد', { userId: user._id });

        return ApiResponse.success(res, user, 'پروفایل با موفقیت به‌روزرسانی شد');
    } catch (error) {
        logger.error('خطا در به‌روزرسانی پروفایل:', error);
        next(error);
    }
};

// ======================================================
// @desc    تغییر رمز عبور
// @route   PUT /api/users/change-password
// @access  Private
// ======================================================
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // دریافت کاربر با password
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return next(new AppError('کاربر یافت نشد', 404));
        }

        // بررسی رمز فعلی
        const isMatch = await user.matchPassword(currentPassword);

        if (!isMatch) {
            return next(new AppError('رمز عبور فعلی اشتباه است', 401));
        }

        // تنظیم رمز جدید
        user.password = newPassword;
        await user.save();

        logger.info('رمز عبور تغییر کرد', { userId: user._id });

        return ApiResponse.success(res, null, 'رمز عبور با موفقیت تغییر کرد');
    } catch (error) {
        logger.error('خطا در تغییر رمز عبور:', error);
        next(error);
    }
};

// ======================================================
// @desc    آپلود آواتار
// @route   PUT /api/users/avatar
// @access  Private
// ======================================================
exports.uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('لطفاً یک تصویر انتخاب کنید', 400));
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return next(new AppError('کاربر یافت نشد', 404));
        }

        // حذف آواتار قبلی از Cloudinary (اگر وجود داشت)
        if (user.avatar && user.avatar.includes('cloudinary')) {
            try {
                const publicId = user.avatar.split('/').pop().split('.')[0];
                await deleteFromCloudinary(`welfvita/avatars/${publicId}`);
            } catch (err) {
                logger.warn('خطا در حذف آواتار قبلی:', err);
            }
        }

        // ذخیره URL جدید
        user.avatar = req.file.path;
        await user.save();

        logger.info('آواتار آپلود شد', { userId: user._id });

        return ApiResponse.success(res, { avatar: user.avatar }, 'آواتار با موفقیت آپلود شد');
    } catch (error) {
        logger.error('خطا در آپلود آواتار:', error);
        next(error);
    }
};

// ======================================================
// @desc    حذف آواتار
// @route   DELETE /api/users/avatar
// @access  Private
// ======================================================
exports.deleteAvatar = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return next(new AppError('کاربر یافت نشد', 404));
        }

        // حذف از Cloudinary
        if (user.avatar && user.avatar.includes('cloudinary')) {
            try {
                const publicId = user.avatar.split('/').pop().split('.')[0];
                await deleteFromCloudinary(`welfvita/avatars/${publicId}`);
            } catch (err) {
                logger.warn('خطا در حذف آواتار:', err);
            }
        }

        // بازگردانی به تصویر پیش‌فرض
        user.avatar = '/uploads/avatars/default.png';
        await user.save();

        logger.info('آواتار حذف شد', { userId: user._id });

        return ApiResponse.success(res, null, 'آواتار با موفقیت حذف شد');
    } catch (error) {
        logger.error('خطا در حذف آواتار:', error);
        next(error);
    }
};

// ======================================================
// @desc    دریافت آدرس‌های کاربر
// @route   GET /api/users/addresses
// @access  Private
// ======================================================
exports.getAddresses = async (req, res, next) => {
    try {
        const addresses = await Address.find({ user: req.user.id })
            .sort('-isDefault -createdAt');

        return ApiResponse.success(res, addresses, 'آدرس‌ها با موفقیت دریافت شد');
    } catch (error) {
        logger.error('خطا در دریافت آدرس‌ها:', error);
        next(error);
    }
};

// ======================================================
// @desc    افزودن آدرس جدید
// @route   POST /api/users/addresses
// @access  Private
// ======================================================
exports.addAddress = async (req, res, next) => {
    try {
        const addressData = {
            ...req.body,
            user: req.user.id
        };

        const address = await Address.create(addressData);

        logger.info('آدرس جدید اضافه شد', { userId: req.user.id, addressId: address._id });

        return ApiResponse.success(res, address, 'آدرس با موفقیت اضافه شد', 201);
    } catch (error) {
        logger.error('خطا در افزودن آدرس:', error);
        next(error);
    }
};

// ======================================================
// @desc    به‌روزرسانی آدرس
// @route   PUT /api/users/addresses/:id
// @access  Private
// ======================================================
exports.updateAddress = async (req, res, next) => {
    try {
        let address = await Address.findById(req.params.id);

        if (!address) {
            return next(new AppError('آدرس یافت نشد', 404));
        }

        // بررسی مالکیت آدرس
        if (address.user.toString() !== req.user.id) {
            return next(new AppError('شما مجاز به ویرایش این آدرس نیستید', 403));
        }

        // به‌روزرسانی
        address = await Address.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        logger.info('آدرس به‌روزرسانی شد', { userId: req.user.id, addressId: address._id });

        return ApiResponse.success(res, address, 'آدرس با موفقیت به‌روزرسانی شد');
    } catch (error) {
        logger.error('خطا در به‌روزرسانی آدرس:', error);
        next(error);
    }
};

// ======================================================
// @desc    حذف آدرس
// @route   DELETE /api/users/addresses/:id
// @access  Private
// ======================================================
exports.deleteAddress = async (req, res, next) => {
    try {
        const address = await Address.findById(req.params.id);

        if (!address) {
            return next(new AppError('آدرس یافت نشد', 404));
        }

        // بررسی مالکیت
        if (address.user.toString() !== req.user.id) {
            return next(new AppError('شما مجاز به حذف این آدرس نیستید', 403));
        }

        await address.deleteOne();

        logger.info('آدرس حذف شد', { userId: req.user.id, addressId: address._id });

        return ApiResponse.success(res, null, 'آدرس با موفقیت حذف شد');
    } catch (error) {
        logger.error('خطا در حذف آدرس:', error);
        next(error);
    }
};

// ======================================================
// @desc    تنظیم آدرس پیش‌فرض
// @route   PUT /api/users/addresses/:id/default
// @access  Private
// ======================================================
exports.setDefaultAddress = async (req, res, next) => {
    try {
        const address = await Address.findById(req.params.id);

        if (!address) {
            return next(new AppError('آدرس یافت نشد', 404));
        }

        // بررسی مالکیت
        if (address.user.toString() !== req.user.id) {
            return next(new AppError('شما مجاز به تغییر این آدرس نیستید', 403));
        }

        // غیرفعال کردن سایر آدرس‌ها
        await Address.updateMany(
            { user: req.user.id },
            { isDefault: false }
        );

        // فعال کردن آدرس جاری
        address.isDefault = true;
        await address.save();

        logger.info('آدرس پیش‌فرض تنظیم شد', { userId: req.user.id, addressId: address._id });

        return ApiResponse.success(res, address, 'آدرس پیش‌فرض با موفقیت تنظیم شد');
    } catch (error) {
        logger.error('خطا در تنظیم آدرس پیش‌فرض:', error);
        next(error);
    }
};

// ======================================================
// @desc    دریافت سفارشات کاربر
// @route   GET /api/users/orders
// @access  Private
// ======================================================
exports.getOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const orders = await Order.find({ user: req.user.id })
            .sort('-createdAt')
            .skip(skip)
            .limit(limit)
            .populate('orderItems.product', 'name images price');

        const total = await Order.countDocuments({ user: req.user.id });

        const pagination = {
            page,
            limit,
            totalItems: total,
            totalPages: Math.ceil(total / limit)
        };

        return ApiResponse.successWithPagination(res, orders, pagination, 'سفارشات با موفقیت دریافت شد');
    } catch (error) {
        logger.error('خطا در دریافت سفارشات:', error);
        next(error);
    }
};

// ======================================================
// @desc    دریافت جزئیات یک سفارش
// @route   GET /api/users/orders/:id
// @access  Private
// ======================================================
exports.getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('orderItems.product', 'name images price')
            .populate('shippingAddress');

        if (!order) {
            return next(new AppError('سفارش یافت نشد', 404));
        }

        // بررسی مالکیت
        if (order.user.toString() !== req.user.id) {
            return next(new AppError('شما مجاز به مشاهده این سفارش نیستید', 403));
        }

        return ApiResponse.success(res, order, 'جزئیات سفارش با موفقیت دریافت شد');
    } catch (error) {
        logger.error('خطا در دریافت جزئیات سفارش:', error);
        next(error);
    }
};

// ======================================================
// @desc    لغو سفارش
// @route   PUT /api/users/orders/:id/cancel
// @access  Private
// ======================================================
exports.cancelOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return next(new AppError('سفارش یافت نشد', 404));
        }

        // بررسی مالکیت
        if (order.user.toString() !== req.user.id) {
            return next(new AppError('شما مجاز به لغو این سفارش نیستید', 403));
        }

        // فقط سفارشات در حال انتظار قابل لغو هستند
        if (order.status !== 'pending' && order.status !== 'processing') {
            return next(new AppError('فقط سفارشات در حال پردازش قابل لغو هستند', 400));
        }

        order.status = 'cancelled';
        order.cancelledAt = Date.now();
        order.cancelReason = req.body.reason || 'لغو توسط کاربر';

        await order.save();

        // بازگرداندن موجودی محصولات
        const Product = require('../models/Product');
        for (let item of order.orderItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            });
        }

        logger.info('سفارش لغو شد', { userId: req.user.id, orderId: order._id });

        return ApiResponse.success(res, order, 'سفارش با موفقیت لغو شد');
    } catch (error) {
        logger.error('خطا در لغو سفارش:', error);
        next(error);
    }
};

// ======================================================
// @desc    دریافت آمار کاربر
// @route   GET /api/users/stats
// @access  Private
// ======================================================
exports.getUserStats = async (req, res, next) => {
    try {
        // تعداد سفارشات
        const totalOrders = await Order.countDocuments({ user: req.user.id });

        // مجموع خرید
        const orderStats = await Order.aggregate([
            { $match: { user: req.user.id, status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: null,
                    totalSpent: { $sum: '$totalPrice' },
                    avgOrderValue: { $avg: '$totalPrice' }
                }
            }
        ]);

        // تعداد آدرس‌ها
        const totalAddresses = await Address.countDocuments({ user: req.user.id });

        const stats = {
            totalOrders,
            totalSpent: orderStats[0]?.totalSpent || 0,
            avgOrderValue: Math.round(orderStats[0]?.avgOrderValue || 0),
            totalAddresses,
            memberSince: req.user.createdAt
        };

        return ApiResponse.success(res, stats, 'آمار کاربر با موفقیت دریافت شد');
    } catch (error) {
        logger.error('خطا در دریافت آمار کاربر:', error);
        next(error);
    }
};

// ======================================================
// @desc    غیرفعال کردن حساب کاربری
// @route   DELETE /api/users/account
// @access  Private
// ======================================================
exports.deleteAccount = async (req, res, next) => {
    try {
        const { password } = req.body;

        if (!password) {
            return next(new AppError('لطفاً رمز عبور خود را وارد کنید', 400));
        }

        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return next(new AppError('کاربر یافت نشد', 404));
        }

        // تایید رمز عبور
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return next(new AppError('رمز عبور اشتباه است', 401));
        }

        // غیرفعال کردن حساب (نه حذف کامل)
        user.isActive = false;
        user.email = `deleted_${Date.now()}_${user.email}`; // تغییر ایمیل برای امکان استفاده مجدد
        await user.save();

        logger.warn('حساب کاربری غیرفعال شد', { userId: user._id });

        return ApiResponse.success(res, null, 'حساب کاربری شما غیرفعال شد');
    } catch (error) {
        logger.error('خطا در غیرفعال‌سازی حساب:', error);
        next(error);
    }
};