const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all coupons (Admin)
 * @route   GET /api/coupons
 * @access  Private/Admin
 */
exports.getAllCoupons = async (req, res, next) => {
    try {
        const {
            active,
            type,
            search,
            sort = '-createdAt',
            page = 1,
            limit = 20
        } = req.query;

        const filter = {};
        
        if (active !== undefined) filter.isActive = active === 'true';
        if (type) filter.type = type;
        if (search) {
            filter.$or = [
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const coupons = await Coupon.find(filter)
            .populate('createdBy', 'name email')
            .populate('applicableCategories', 'name slug')
            .populate('applicableProducts', 'name slug')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Coupon.countDocuments(filter);

        successResponse(res, {
            coupons,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get available coupons for user
 * @route   GET /api/coupons/available
 * @access  Private
 */
exports.getAvailableCoupons = async (req, res, next) => {
    try {
        const coupons = await Coupon.getAvailableForUser(req.user.id)
            .select('-usedBy')
            .populate('applicableCategories', 'name slug')
            .populate('applicableProducts', 'name slug');

        successResponse(res, coupons);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single coupon
 * @route   GET /api/coupons/:id
 * @access  Private/Admin
 */
exports.getCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('applicableCategories', 'name slug')
            .populate('applicableProducts', 'name slug')
            .populate('usedBy.user', 'name email');

        if (!coupon) {
            return errorResponse(res, 'کد تخفیف یافت نشد', 404);
        }

        successResponse(res, coupon);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Validate coupon code
 * @route   POST /api/coupons/validate
 * @access  Private
 */
exports.validateCoupon = async (req, res, next) => {
    try {
        const { code, amount } = req.body;

        if (!code) {
            return errorResponse(res, 'کد تخفیف الزامی است', 400);
        }

        if (!amount || amount <= 0) {
            return errorResponse(res, 'مبلغ خرید نامعتبر است', 400);
        }

        // پیدا کردن کوپن
        const coupon = await Coupon.findActiveByCode(code);
        
        if (!coupon) {
            return errorResponse(res, 'کد تخفیف نامعتبر یا منقضی شده است', 404);
        }

        // دریافت سبد خرید کاربر
        const cart = await Cart.findOne({ user: req.user.id })
            .populate('items.product', 'category');

        const cartItems = cart ? cart.items : [];

        // بررسی اعتبار کوپن
        const validation = coupon.isValid(req.user.id, amount, cartItems);
        
        if (!validation.valid) {
            return errorResponse(res, validation.message, 400);
        }

        // محاسبه تخفیف
        const discount = coupon.calculateDiscount(amount);
        const finalAmount = amount - discount;

        successResponse(res, {
            valid: true,
            coupon: {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                description: coupon.description
            },
            discount,
            originalAmount: amount,
            finalAmount,
            savings: discount,
            savingsPercentage: Math.round((discount / amount) * 100)
        }, 'کد تخفیف معتبر است');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Apply coupon to cart
 * @route   POST /api/coupons/apply
 * @access  Private
 */
exports.applyCouponToCart = async (req, res, next) => {
    try {
        const { code } = req.body;

        if (!code) {
            return errorResponse(res, 'کد تخفیف الزامی است', 400);
        }

        // دریافت سبد خرید
        const cart = await Cart.findOne({ user: req.user.id })
            .populate('items.product');

        if (!cart || cart.items.length === 0) {
            return errorResponse(res, 'سبد خرید شما خالی است', 400);
        }

        // پیدا کردن کوپن
        const coupon = await Coupon.findActiveByCode(code);
        
        if (!coupon) {
            return errorResponse(res, 'کد تخفیف نامعتبر یا منقضی شده است', 404);
        }

        // بررسی اعتبار
        const validation = coupon.isValid(req.user.id, cart.totalPrice, cart.items);
        
        if (!validation.valid) {
            return errorResponse(res, validation.message, 400);
        }

        // محاسبه تخفیف
        const discount = coupon.calculateDiscount(cart.totalPrice);

        // اعمال کوپن به سبد
        cart.coupon = {
            code: coupon.code,
            discount
        };
        cart.finalPrice = cart.totalPrice - discount;

        await cart.save();

        successResponse(res, cart, 'کد تخفیف با موفقیت اعمال شد');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove coupon from cart
 * @route   DELETE /api/coupons/remove
 * @access  Private
 */
exports.removeCouponFromCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return errorResponse(res, 'سبد خرید یافت نشد', 404);
        }

        cart.coupon = undefined;
        cart.finalPrice = cart.totalPrice;

        await cart.save();

        successResponse(res, cart, 'کد تخفیف حذف شد');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create coupon
 * @route   POST /api/coupons
 * @access  Private/Admin
 */
exports.createCoupon = async (req, res, next) => {
    try {
        const {
            code,
            description,
            type,
            value,
            maxDiscount,
            minPurchase,
            maxUses,
            maxUsesPerUser,
            validFrom,
            validUntil,
            applicableCategories,
            applicableProducts,
            applicableUsers,
            isActive
        } = req.body;

        // بررسی تکراری بودن کد
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return errorResponse(res, 'این کد تخفیف قبلاً ثبت شده است', 400);
        }

        // اعتبارسنجی تاریخ
        if (new Date(validUntil) <= new Date(validFrom || Date.now())) {
            return errorResponse(res, 'تاریخ انقضا باید بعد از تاریخ شروع باشد', 400);
        }

        // اعتبارسنجی مقدار تخفیف
        if (type === 'percentage' && (value < 1 || value > 100)) {
            return errorResponse(res, 'درصد تخفیف باید بین 1 تا 100 باشد', 400);
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            description,
            type,
            value,
            maxDiscount,
            minPurchase: minPurchase || 0,
            maxUses,
            maxUsesPerUser: maxUsesPerUser || 1,
            validFrom: validFrom || Date.now(),
            validUntil,
            applicableCategories,
            applicableProducts,
            applicableUsers,
            isActive: isActive !== undefined ? isActive : true,
            createdBy: req.user.id
        });

        successResponse(res, coupon, 'کد تخفیف با موفقیت ایجاد شد', 201);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update coupon
 * @route   PUT /api/coupons/:id
 * @access  Private/Admin
 */
exports.updateCoupon = async (req, res, next) => {
    try {
        let coupon = await Coupon.findById(req.params.id);

        if (!coupon) {
            return errorResponse(res, 'کد تخفیف یافت نشد', 404);
        }

        // بررسی تغییر کد
        if (req.body.code && req.body.code !== coupon.code) {
            const existingCoupon = await Coupon.findOne({ code: req.body.code.toUpperCase() });
            if (existingCoupon) {
                return errorResponse(res, 'این کد تخفیف قبلاً ثبت شده است', 400);
            }
            req.body.code = req.body.code.toUpperCase();
        }

        // اعتبارسنجی تاریخ
        if (req.body.validUntil && req.body.validFrom) {
            if (new Date(req.body.validUntil) <= new Date(req.body.validFrom)) {
                return errorResponse(res, 'تاریخ انقضا باید بعد از تاریخ شروع باشد', 400);
            }
        }

        coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        successResponse(res, coupon, 'کد تخفیف با موفقیت به‌روزرسانی شد');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete coupon
 * @route   DELETE /api/coupons/:id
 * @access  Private/Admin
 */
exports.deleteCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (!coupon) {
            return errorResponse(res, 'کد تخفیف یافت نشد', 404);
        }

        // بررسی استفاده شده یا نه
        if (coupon.usedCount > 0) {
            return errorResponse(res, 'نمی‌توانید کد تخفیفی که استفاده شده را حذف کنید. آن را غیرفعال کنید', 400);
        }

        await coupon.deleteOne();

        successResponse(res, null, 'کد تخفیف با موفقیت حذف شد');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle coupon status
 * @route   PATCH /api/coupons/:id/toggle
 * @access  Private/Admin
 */
exports.toggleCouponStatus = async (req, res, next) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (!coupon) {
            return errorResponse(res, 'کد تخفیف یافت نشد', 404);
        }

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        successResponse(res, coupon, `کد تخفیف ${coupon.isActive ? 'فعال' : 'غیرفعال'} شد`);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get coupon statistics
 * @route   GET /api/coupons/:id/stats
 * @access  Private/Admin
 */
exports.getCouponStats = async (req, res, next) => {
    try {
        const coupon = await Coupon.findById(req.params.id)
            .populate('usedBy.user', 'name email')
            .populate('usedBy.order', 'orderNumber totalAmount');

        if (!coupon) {
            return errorResponse(res, 'کد تخفیف یافت نشد', 404);
        }

        const stats = {
            code: coupon.code,
            totalUses: coupon.usedCount,
            maxUses: coupon.maxUses || 'نامحدود',
            usagePercentage: coupon.usagePercentage,
            totalDiscount: coupon.usedBy.reduce((sum, usage) => sum + usage.discountAmount, 0),
            averageDiscount: coupon.usedCount > 0 
                ? coupon.usedBy.reduce((sum, usage) => sum + usage.discountAmount, 0) / coupon.usedCount 
                : 0,
            usageHistory: coupon.usedBy.map(usage => ({
                user: usage.user,
                order: usage.order,
                discountAmount: usage.discountAmount,
                usedAt: usage.usedAt
            })),
            isActive: coupon.isActive,
            isExpired: coupon.isExpired,
            daysRemaining: Math.ceil((coupon.validUntil - Date.now()) / (1000 * 60 * 60 * 24))
        };

        successResponse(res, stats);
    } catch (error) {
        next(error);
    }
};