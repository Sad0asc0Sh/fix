/**
 * ====================================
 * Payment Controller - مدیریت پرداخت‌ها
 * ====================================
 */

const Payment = require('../models/Payment');
const Order = require('../models/Order');
const ApiResponse = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const Helpers = require('../utils/helpers');

// ======================================================
// @desc    ایجاد پرداخت جدید و ارسال به درگاه
// @route   POST /api/payments/create
// @access  Private
// ======================================================
exports.createPayment = async (req, res, next) => {
    try {
        const { orderId, gateway = 'zarinpal' } = req.body;

        // بررسی سفارش
        const order = await Order.findById(orderId);

        if (!order) {
            return next(new AppError('سفارش یافت نشد', 404));
        }

        // بررسی مالکیت سفارش
        if (order.user.toString() !== req.user.id) {
            return next(new AppError('شما مجاز به پرداخت این سفارش نیستید', 403));
        }

        // بررسی وضعیت سفارش
        if (order.isPaid) {
            return next(new AppError('این سفارش قبلاً پرداخت شده است', 400));
        }

        if (order.status === 'cancelled') {
            return next(new AppError('سفارش لغو شده قابل پرداخت نیست', 400));
        }

        // ایجاد رکورد پرداخت
        const payment = await Payment.create({
            order: orderId,
            user: req.user.id,
            amount: order.totalPrice,
            method: 'online',
            gateway,
            ipAddress: Helpers.getClientIP(req)
        });

        // TODO: اتصال به درگاه پرداخت واقعی (زرین‌پال، ملت و...)
        // این بخش باید با API درگاه پرداخت انتخابی ادغام شود

        // نمونه (فرضی) - درگاه زرین‌پال
        const paymentUrl = await initiateZarinpalPayment(payment, order, req.user);

        logger.info('پرداخت جدید ایجاد شد', {
            paymentId: payment._id,
            orderId,
            userId: req.user.id,
            amount: payment.amount
        });

        return ApiResponse.success(res, {
            paymentId: payment._id,
            paymentUrl, // URL درگاه برای redirect
            authority: payment.authority
        }, 'درخواست پرداخت ایجاد شد', 201);

    } catch (error) {
        logger.error('خطا در ایجاد پرداخت:', error);
        next(error);
    }
};

// ======================================================
// @desc    تایید پرداخت (Callback از درگاه)
// @route   GET /api/payments/verify
// @access  Public
// ======================================================
exports.verifyPayment = async (req, res, next) => {
    try {
        const { Authority, Status } = req.query;

        // یافتن پرداخت با authority
        const payment = await Payment.findOne({ authority: Authority })
            .populate('order')
            .populate('user', 'name email');

        if (!payment) {
            return next(new AppError('پرداخت یافت نشد', 404));
        }

        // بررسی وضعیت از درگاه
        if (Status === 'OK') {
            // TODO: تایید نهایی از API درگاه
            const verificationResult = await verifyZarinpalPayment(payment, Authority);

            if (verificationResult.success) {
                // موفق - به‌روزرسانی پرداخت
                payment.verify(
                    verificationResult.refId,
                    verificationResult.cardNumber
                );

                await payment.save();

                // به‌روزرسانی سفارش
                const order = payment.order;
                order.isPaid = true;
                order.paidAt = Date.now();
                order.paymentMethod = payment.gateway;
                order.status = 'processing';

                await order.save();

                logger.info('پرداخت موفق', {
                    paymentId: payment._id,
                    orderId: order._id,
                    refId: verificationResult.refId
                });

                // ارسال ایمیل تایید
                // TODO: ارسال ایمیل به کاربر

                // Redirect به صفحه موفقیت در فرانت
                return res.redirect(
                    `${process.env.CLIENT_URL}/payment/success?orderId=${order._id}&refId=${verificationResult.refId}`
                );
            } else {
                // تایید ناموفق
                payment.fail('تایید پرداخت از درگاه ناموفق بود');
                await payment.save();

                logger.warn('تایید پرداخت ناموفق', {
                    paymentId: payment._id,
                    authority: Authority
                });

                return res.redirect(
                    `${process.env.CLIENT_URL}/payment/failed?reason=verification_failed`
                );
            }
        } else {
            // پرداخت توسط کاربر لغو شد
            payment.cancel();
            await payment.save();

            logger.info('پرداخت لغو شد توسط کاربر', {
                paymentId: payment._id
            });

            return res.redirect(
                `${process.env.CLIENT_URL}/payment/cancelled`
            );
        }

    } catch (error) {
        logger.error('خطا در تایید پرداخت:', error);
        return res.redirect(
            `${process.env.CLIENT_URL}/payment/error`
        );
    }
};

// ======================================================
// @desc    دریافت اطلاعات یک پرداخت
// @route   GET /api/payments/:id
// @access  Private
// ======================================================
exports.getPaymentById = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('order', 'orderNumber totalPrice status')
            .populate('user', 'name email');

        if (!payment) {
            return next(new AppError('پرداخت یافت نشد', 404));
        }

        // بررسی دسترسی
        if (payment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('شما مجاز به مشاهده این پرداخت نیستید', 403));
        }

        logger.info('اطلاعات پرداخت دریافت شد', {
            paymentId: payment._id,
            userId: req.user.id
        });

        return ApiResponse.success(res, payment, 'اطلاعات پرداخت با موفقیت دریافت شد');

    } catch (error) {
        logger.error('خطا در دریافت اطلاعات پرداخت:', error);
        next(error);
    }
};

// ======================================================
// @desc    دریافت لیست پرداخت‌های کاربر
// @route   GET /api/payments/my-payments
// @access  Private
// ======================================================
exports.getMyPayments = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const payments = await Payment.find({ user: req.user.id })
            .populate('order', 'orderNumber totalPrice status')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        const total = await Payment.countDocuments({ user: req.user.id });

        const pagination = {
            page,
            limit,
            totalItems: total,
            totalPages: Math.ceil(total / limit)
        };

        logger.info('لیست پرداخت‌های کاربر دریافت شد', {
            userId: req.user.id,
            count: payments.length
        });

        return ApiResponse.successWithPagination(
            res,
            payments,
            pagination,
            'لیست پرداخت‌ها با موفقیت دریافت شد'
        );

    } catch (error) {
        logger.error('خطا در دریافت لیست پرداخت‌ها:', error);
        next(error);
    }
};

// ======================================================
// @desc    بازگشت وجه (فقط ادمین)
// @route   POST /api/payments/:id/refund
// @access  Private/Admin
// ======================================================
exports.refundPayment = async (req, res, next) => {
    try {
        const { reason } = req.body;

        const payment = await Payment.findById(req.params.id)
            .populate('order');

        if (!payment) {
            return next(new AppError('پرداخت یافت نشد', 404));
        }

        if (!payment.isSuccessful) {
            return next(new AppError('فقط پرداخت‌های موفق قابل بازگشت هستند', 400));
        }

        if (payment.status === 'refunded') {
            return next(new AppError('این پرداخت قبلاً بازگشت داده شده است', 400));
        }

        // TODO: درخواست بازگشت وجه از API درگاه
        const refundResult = await processRefund(payment);

        if (refundResult.success) {
            payment.refund(reason);
            await payment.save();

            // به‌روزرسانی سفارش
            const order = payment.order;
            order.isPaid = false;
            order.status = 'refunded';
            await order.save();

            logger.info('بازگشت وجه انجام شد', {
                paymentId: payment._id,
                orderId: order._id,
                adminId: req.user.id,
                reason
            });

            return ApiResponse.success(res, payment, 'بازگشت وجه با موفقیت انجام شد');
        } else {
            return next(new AppError('خطا در بازگشت وجه از درگاه', 500));
        }

    } catch (error) {
        logger.error('خطا در بازگشت وجه:', error);
        next(error);
    }
};

// ======================================================
// @desc    دریافت آمار پرداخت‌ها (ادمین)
// @route   GET /api/payments/stats
// @access  Private/Admin
// ======================================================
exports.getPaymentStats = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const stats = await Payment.getStats(startDate, endDate);

        // محاسبات اضافی
        const totalSuccessful = stats.find(s => s._id === 'completed');
        const totalFailed = stats.find(s => s._id === 'failed');
        const totalRefunded = stats.find(s => s._id === 'refunded');

        const summary = {
            totalSuccessfulPayments: totalSuccessful?.count || 0,
            totalSuccessfulAmount: totalSuccessful?.totalAmount || 0,
            totalFailedPayments: totalFailed?.count || 0,
            totalRefundedPayments: totalRefunded?.count || 0,
            totalRefundedAmount: totalRefunded?.totalAmount || 0,
            stats
        };

        logger.info('آمار پرداخت‌ها دریافت شد', {
            adminId: req.user.id
        });

        return ApiResponse.success(res, summary, 'آمار پرداخت‌ها با موفقیت دریافت شد');

    } catch (error) {
        logger.error('خطا در دریافت آمار پرداخت‌ها:', error);
        next(error);
    }
};

// ======================================================
// توابع کمکی - اتصال به درگاه‌های پرداخت
// ======================================================

/**
 * راه‌اندازی پرداخت زرین‌پال (نمونه)
 */
async function initiateZarinpalPayment(payment, order, user) {
    try {
        // TODO: اتصال واقعی به API زرین‌پال
        // این کد نمونه است و باید با API واقعی جایگزین شود

        /*
        const ZarinpalCheckout = require('zarinpal-checkout');
        const zarinpal = ZarinpalCheckout.create(
            process.env.ZARINPAL_MERCHANT_ID,
            process.env.ZARINPAL_SANDBOX === 'true'
        );

        const response = await zarinpal.PaymentRequest({
            Amount: payment.amount,
            CallbackURL: `${process.env.API_URL}/api/payments/verify`,
            Description: `پرداخت سفارش ${order.orderNumber}`,
            Email: user.email,
            Mobile: user.phone
        });

        if (response.status === 100) {
            payment.authority = response.authority;
            await payment.save();

            return `https://www.zarinpal.com/pg/StartPay/${response.authority}`;
        } else {
            throw new Error('خطا در ایجاد درخواست پرداخت');
        }
        */

        // کد نمونه (فرضی)
        const mockAuthority = Helpers.generateRandomToken(16);
        payment.authority = mockAuthority;
        await payment.save();

        logger.warn('⚠️ از درگاه پرداخت نمونه استفاده می‌شود');

        return `${process.env.CLIENT_URL}/payment/gateway?authority=${mockAuthority}`;

    } catch (error) {
        logger.error('خطا در راه‌اندازی پرداخت زرین‌پال:', error);
        throw error;
    }
}

/**
 * تایید پرداخت زرین‌پال (نمونه)
 */
async function verifyZarinpalPayment(payment, authority) {
    try {
        // TODO: اتصال واقعی به API زرین‌پال

        /*
        const ZarinpalCheckout = require('zarinpal-checkout');
        const zarinpal = ZarinpalCheckout.create(
            process.env.ZARINPAL_MERCHANT_ID,
            process.env.ZARINPAL_SANDBOX === 'true'
        );

        const response = await zarinpal.PaymentVerification({
            Amount: payment.amount,
            Authority: authority
        });

        if (response.status === 100 || response.status === 101) {
            return {
                success: true,
                refId: response.RefID,
                cardNumber: response.CardPan || null
            };
        } else {
            return { success: false };
        }
        */

        // کد نمونه (فرضی)
        logger.warn('⚠️ از تایید نمونه استفاده می‌شود');

        return {
            success: true,
            refId: Helpers.generateRandomCode(10),
            cardNumber: '1234'
        };

    } catch (error) {
        logger.error('خطا در تایید پرداخت زرین‌پال:', error);
        return { success: false };
    }
}

/**
 * بازگشت وجه (نمونه)
 */
async function processRefund(payment) {
    try {
        // TODO: درخواست بازگشت وجه از API درگاه

        logger.warn('⚠️ از بازگشت وجه نمونه استفاده می‌شود');

        return { success: true };

    } catch (error) {
        logger.error('خطا در بازگشت وجه:', error);
        return { success: false };
    }
}