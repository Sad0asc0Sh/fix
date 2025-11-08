/**
 * ====================================
 * Admin Routes - مسیرهای مدیریتی
 * ====================================
 */

const express = require('express');
const router = express.Router();

// Middleware
const { protect } = require('../middleware/auth');
const { isAdmin, isSuperAdmin } = require('../middleware/adminAuth');

// Controllers (فرض می‌کنم وجود دارند)
// اگه نیست، بعداً می‌نویسیم

// ======================================================
// تمام مسیرها نیاز به احراز هویت + دسترسی ادمین
// ======================================================
router.use(protect);
router.use(isAdmin);

// ======================================================
// داشبورد و آمار
// ======================================================
router.get('/dashboard', (req, res) => {
    // TODO: ساخت adminController و متد getDashboard
    res.json({
        success: true,
        message: 'داشبورد ادمین',
        data: {
            totalUsers: 0,
            totalProducts: 0,
            totalOrders: 0,
            totalRevenue: 0
        }
    });
});

// ======================================================
// مدیریت کاربران
// ======================================================
const User = require('../models/User');

// لیست کاربران
router.get('/users', async (req, res, next) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort('-createdAt')
            .limit(100);

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
});

// تغییر نقش کاربر
router.put('/users/:id/role', async (req, res, next) => {
    try {
        const { role } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'نقش کاربر با موفقیت تغییر کرد',
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// فعال/غیرفعال کردن کاربر
router.put('/users/:id/toggle', async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        user.isActive = !user.isActive;
        await user.save();

        res.json({
            success: true,
            message: `کاربر ${user.isActive ? 'فعال' : 'غیرفعال'} شد`,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// ======================================================
// مدیریت محصولات (مسیرهای اضافی)
// ======================================================
const Product = require('../models/Product');

// آمار محصولات
router.get('/products/stats', async (req, res, next) => {
    try {
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalStock: { $sum: '$stock' },
                    avgPrice: { $avg: '$price' },
                    totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
                }
            }
        ]);

        res.json({
            success: true,
            data: stats[0] || {}
        });
    } catch (error) {
        next(error);
    }
});

// ======================================================
// مدیریت سفارشات (مسیرهای اضافی)
// ======================================================
const Order = require('../models/Order');

// لیست تمام سفارشات
router.get('/orders', async (req, res, next) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .sort('-createdAt')
            .limit(100);

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        next(error);
    }
});

// تغییر وضعیت سفارش
router.put('/orders/:id/status', async (req, res, next) => {
    try {
        const { status } = req.body;

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'وضعیت سفارش به‌روزرسانی شد',
            data: order
        });
    } catch (error) {
        next(error);
    }
});

// آمار سفارشات
router.get('/orders/stats', async (req, res, next) => {
    try {
        const stats = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalPrice' }
                }
            }
        ]);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
});

// ======================================================
// تنظیمات (فقط Super Admin)
// ======================================================
router.get('/settings', isSuperAdmin, (req, res) => {
    res.json({
        success: true,
        message: 'تنظیمات سیستم',
        data: {
            siteName: 'فروشگاه ویلف‌ویتا',
            maintenance: false,
            version: '1.0.0'
        }
    });
});

module.exports = router;