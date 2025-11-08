/**
 * ====================================
 * Cart Controller - مدیریت سبد خرید
 * ====================================
 */

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiResponse = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const cacheManager = require('../utils/cacheManager');

// ======================================================
// @desc    دریافت سبد خرید کاربر
// @route   GET /api/cart
// @access  Private
// ======================================================
exports.getCart = async (req, res, next) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id })
            .populate({
                path: 'items.product',
                select: 'name slug price discount images stock isActive inStock finalPrice',
                match: { isActive: true } // فقط محصولات فعال
            });

        // اگر سبد وجود نداشت، یکی بساز
        if (!cart) {
            cart = await Cart.create({ 
                user: req.user.id, 
                items: [] 
            });
        }

        // حذف آیتم‌هایی که محصول‌شان حذف شده یا غیرفعال است
        cart.items = cart.items.filter(item => item.product !== null);
        
        // بررسی موجودی و به‌روزرسانی قیمت‌ها
        let hasChanges = false;
        for (let item of cart.items) {
            const product = item.product;

            // بررسی موجودی
            if (!product.inStock || product.stock < item.quantity) {
                logger.warn('محصول کافی موجود نیست', {
                    userId: req.user.id,
                    productId: product._id,
                    requestedQty: item.quantity,
                    availableStock: product.stock
                });

                // کاهش تعداد به موجودی فعلی
                if (product.stock > 0) {
                    item.quantity = product.stock;
                    hasChanges = true;
                } else {
                    // حذف محصول از سبد
                    cart.items = cart.items.filter(i => i.product._id.toString() !== product._id.toString());
                    hasChanges = true;
                }
            }

            // به‌روزرسانی قیمت اگر تغییر کرده باشد
            if (item.priceAtAdd !== product.finalPrice) {
                item.priceAtAdd = product.finalPrice;
                hasChanges = true;
            }
        }

        // ذخیره تغییرات
        if (hasChanges) {
            await cart.save();
        }

        const summary = cart.getSummary();

        logger.info('سبد خرید دریافت شد', { 
            userId: req.user.id,
            itemsCount: summary.items 
        });

        return ApiResponse.success(res, {
            cart,
            summary
        }, 'سبد خرید با موفقیت دریافت شد');

    } catch (error) {
        logger.error('خطا در دریافت سبد خرید:', error);
        next(error);
    }
};

// ======================================================
// @desc    افزودن محصول به سبد خرید
// @route   POST /api/cart/add
// @access  Private
// ======================================================
exports.addToCart = async (req, res, next) => {
    try {
        const { productId, quantity = 1, variant = null } = req.body;

        // بررسی محصول
        const product = await Product.findById(productId).select('name price finalPrice stock isActive inStock variants');

        if (!product) {
            return next(new AppError('محصول یافت نشد', 404));
        }

        if (!product.isActive) {
            return next(new AppError('این محصول در حال حاضر قابل خرید نیست', 400));
        }

        if (!product.inStock) {
            return next(new AppError('این محصول موجود نیست', 400));
        }

        // بررسی موجودی
        let availableStock = product.stock;
        let finalPrice = product.finalPrice;

        // بررسی variant (اگر وجود داشت)
        if (variant) {
            const productVariant = product.variants
                ?.find(v => v.name === variant.name)
                ?.options?.find(o => o.value === variant.value);

            if (!productVariant) {
                return next(new AppError('نوع محصول انتخابی یافت نشد', 400));
            }

            availableStock = productVariant.stock !== undefined ? productVariant.stock : product.stock;
            
            if (productVariant.priceModifier) {
                finalPrice += productVariant.priceModifier;
            }
        }

        if (availableStock < quantity) {
            return next(new AppError(`موجودی کافی نیست. تنها ${availableStock} عدد موجود است`, 400));
        }

        // یافتن یا ساخت سبد خرید
        let cart = await Cart.findOrCreate(req.user.id);

        // افزودن محصول
        cart.addItem(productId, quantity, finalPrice, variant);

        await cart.save();

        // پاک کردن کش سبد خرید
        cacheManager.clearPattern(`cart:${req.user.id}`);

        // Populate کردن محصولات برای پاسخ
        await cart.populate({
            path: 'items.product',
            select: 'name slug images price finalPrice'
        });

        const summary = cart.getSummary();

        logger.info('محصول به سبد اضافه شد', {
            userId: req.user.id,
            productId,
            quantity
        });

        return ApiResponse.success(res, {
            cart,
            summary
        }, 'محصول با موفقیت به سبد خرید اضافه شد', 201);

    } catch (error) {
        logger.error('خطا در افزودن به سبد خرید:', error);
        next(error);
    }
};

// ======================================================
// @desc    به‌روزرسانی تعداد محصول در سبد
// @route   PUT /api/cart/update
// @access  Private
// ======================================================
exports.updateCartItem = async (req, res, next) => {
    try {
        const { productId, quantity, variant = null } = req.body;

        if (quantity < 1) {
            return next(new AppError('تعداد باید حداقل ۱ باشد', 400));
        }

        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return next(new AppError('سبد خرید یافت نشد', 404));
        }

        // بررسی محصول
        const product = await Product.findById(productId).select('stock inStock variants');

        if (!product || !product.inStock) {
            return next(new AppError('محصول موجود نیست', 400));
        }

        // بررسی موجودی
        let availableStock = product.stock;

        if (variant) {
            const productVariant = product.variants
                ?.find(v => v.name === variant.name)
                ?.options?.find(o => o.value === variant.value);

            if (productVariant && productVariant.stock !== undefined) {
                availableStock = productVariant.stock;
            }
        }

        if (availableStock < quantity) {
            return next(new AppError(`موجودی کافی نیست. حداکثر ${availableStock} عدد موجود است`, 400));
        }

        // به‌روزرسانی تعداد
        cart.updateItemQuantity(productId, quantity, variant);

        await cart.save();

        // پاک کردن کش
        cacheManager.clearPattern(`cart:${req.user.id}`);

        await cart.populate({
            path: 'items.product',
            select: 'name slug images price finalPrice'
        });

        const summary = cart.getSummary();

        logger.info('سبد خرید به‌روزرسانی شد', {
            userId: req.user.id,
            productId,
            newQuantity: quantity
        });

        return ApiResponse.success(res, {
            cart,
            summary
        }, 'سبد خرید با موفقیت به‌روزرسانی شد');

    } catch (error) {
        logger.error('خطا در به‌روزرسانی سبد خرید:', error);
        next(error);
    }
};

// ======================================================
// @desc    حذف محصول از سبد خرید
// @route   DELETE /api/cart/remove/:productId
// @access  Private
// ======================================================
exports.removeFromCart = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { variant = null } = req.body;

        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return next(new AppError('سبد خرید یافت نشد', 404));
        }

        // حذف محصول
        cart.removeItem(productId, variant);

        await cart.save();

        // پاک کردن کش
        cacheManager.clearPattern(`cart:${req.user.id}`);

        await cart.populate({
            path: 'items.product',
            select: 'name slug images price finalPrice'
        });

        const summary = cart.getSummary();

        logger.info('محصول از سبد حذف شد', {
            userId: req.user.id,
            productId
        });

        return ApiResponse.success(res, {
            cart,
            summary
        }, 'محصول با موفقیت از سبد خرید حذف شد');

    } catch (error) {
        logger.error('خطا در حذف از سبد خرید:', error);
        next(error);
    }
};

// ======================================================
// @desc    خالی کردن سبد خرید
// @route   DELETE /api/cart/clear
// @access  Private
// ======================================================
exports.clearCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return next(new AppError('سبد خرید یافت نشد', 404));
        }

        cart.clear();
        await cart.save();

        // پاک کردن کش
        cacheManager.clearPattern(`cart:${req.user.id}`);

        logger.info('سبد خرید خالی شد', { userId: req.user.id });

        return ApiResponse.success(res, {
            cart,
            summary: cart.getSummary()
        }, 'سبد خرید با موفقیت خالی شد');

    } catch (error) {
        logger.error('خطا در خالی کردن سبد خرید:', error);
        next(error);
    }
};

// ======================================================
// @desc    اعمال کد تخفیف
// @route   POST /api/cart/apply-coupon
// @access  Private
// ======================================================
exports.applyCoupon = async (req, res, next) => {
    try {
        const { code } = req.body;

        const cart = await Cart.findOne({ user: req.user.id })
            .populate('items.product', 'finalPrice');

        if (!cart || cart.items.length === 0) {
            return next(new AppError('سبد خرید خالی است', 400));
        }

        // TODO: بررسی کد تخفیف در دیتابیس (مدل Discount)
        // فعلاً یک کد نمونه
        const validCoupons = {
            'WELCOME10': 10000,  // 10 هزار تومان
            'SUMMER20': 20000,   // 20 هزار تومان
            'VIP50': 50000       // 50 هزار تومان
        };

        const couponDiscount = validCoupons[code.toUpperCase()];

        if (!couponDiscount) {
            return next(new AppError('کد تخفیف نامعتبر است', 400));
        }

        // بررسی حداقل خرید
        const subtotal = cart.subtotal;
        const minPurchase = 100000; // 100 هزار تومان

        if (subtotal < minPurchase) {
            return next(new AppError(`حداقل خرید برای استفاده از این کد ${minPurchase.toLocaleString('fa-IR')} تومان است`, 400));
        }

        // اعمال کد تخفیف
        cart.applyCoupon(code.toUpperCase(), Math.min(couponDiscount, subtotal));

        await cart.save();

        // پاک کردن کش
        cacheManager.clearPattern(`cart:${req.user.id}`);

        const summary = cart.getSummary();

        logger.info('کد تخفیف اعمال شد', {
            userId: req.user.id,
            code,
            discount: couponDiscount
        });

        return ApiResponse.success(res, {
            cart,
            summary,
            savedAmount: cart.couponDiscount
        }, 'کد تخفیف با موفقیت اعمال شد');

    } catch (error) {
        logger.error('خطا در اعمال کد تخفیف:', error);
        next(error);
    }
};

// ======================================================
// @desc    حذف کد تخفیف
// @route   DELETE /api/cart/remove-coupon
// @access  Private
// ======================================================
exports.removeCoupon = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return next(new AppError('سبد خرید یافت نشد', 404));
        }

        cart.removeCoupon();
        await cart.save();

        // پاک کردن کش
        cacheManager.clearPattern(`cart:${req.user.id}`);

        await cart.populate({
            path: 'items.product',
            select: 'name slug images price finalPrice'
        });

        const summary = cart.getSummary();

        logger.info('کد تخفیف حذف شد', { userId: req.user.id });

        return ApiResponse.success(res, {
            cart,
            summary
        }, 'کد تخفیف حذف شد');

    } catch (error) {
        logger.error('خطا در حذف کد تخفیف:', error);
        next(error);
    }
};

// ======================================================
// @desc    دریافت تعداد آیتم‌های سبد
// @route   GET /api/cart/count
// @access  Private
// ======================================================
exports.getCartCount = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id })
            .select('items');

        const count = cart ? cart.totalItems : 0;

        return ApiResponse.success(res, { count }, 'تعداد آیتم‌های سبد دریافت شد');

    } catch (error) {
        logger.error('خطا در دریافت تعداد آیتم‌ها:', error);
        next(error);
    }
};

// ======================================================
// @desc    بررسی موجودی محصولات سبد (قبل از تسویه)
// @route   POST /api/cart/validate
// @access  Private
// ======================================================
exports.validateCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id })
            .populate('items.product', 'name stock inStock variants');

        if (!cart || cart.items.length === 0) {
            return next(new AppError('سبد خرید خالی است', 400));
        }

        const errors = [];
        let isValid = true;

        for (let item of cart.items) {
            const product = item.product;

            if (!product) {
                errors.push({
                    message: 'محصول یافت نشد و از سبد حذف شد',
                    productId: item.product
                });
                isValid = false;
                continue;
            }

            if (!product.inStock) {
                errors.push({
                    message: `${product.name} موجود نیست`,
                    productId: product._id
                });
                isValid = false;
            }

            let availableStock = product.stock;

            // بررسی variant
            if (item.variant) {
                const productVariant = product.variants
                    ?.find(v => v.name === item.variant.name)
                    ?.options?.find(o => o.value === item.variant.value);

                if (productVariant && productVariant.stock !== undefined) {
                    availableStock = productVariant.stock;
                }
            }

            if (availableStock < item.quantity) {
                errors.push({
                    message: `${product.name} - تنها ${availableStock} عدد موجود است`,
                    productId: product._id,
                    requestedQty: item.quantity,
                    availableQty: availableStock
                });
                isValid = false;
            }
        }

        if (!isValid) {
            logger.warn('سبد خرید نامعتبر است', {
                userId: req.user.id,
                errors
            });

            return ApiResponse.error(res, 'برخی محصولات سبد خرید موجود نیستند', 400, errors);
        }

        return ApiResponse.success(res, { 
            isValid: true,
            summary: cart.getSummary()
        }, 'سبد خرید معتبر است');

    } catch (error) {
        logger.error('خطا در اعتبارسنجی سبد خرید:', error);
        next(error);
    }
};

// ======================================================
// @desc    محاسبه هزینه ارسال
// @route   POST /api/cart/shipping
// @access  Private
// ======================================================
exports.calculateShipping = async (req, res, next) => {
    try {
        const { province, city } = req.body;

        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart || cart.items.length === 0) {
            return next(new AppError('سبد خرید خالی است', 400));
        }

        const subtotal = cart.total;

        // هزینه ارسال بر اساس استان (نمونه)
        const shippingRates = {
            'تهران': 30000,
            'اصفهان': 40000,
            'شیراز': 45000,
            'default': 50000
        };

        let shippingCost = shippingRates[province] || shippingRates['default'];

        // ارسال رایگان برای خریدهای بالای 500 هزار تومان
        const freeShippingThreshold = 500000;
        if (subtotal >= freeShippingThreshold) {
            shippingCost = 0;
        }

        const totalWithShipping = subtotal + shippingCost;

        return ApiResponse.success(res, {
            subtotal,
            shippingCost,
            freeShippingThreshold,
            total: totalWithShipping,
            isFreeShipping: shippingCost === 0
        }, 'هزینه ارسال محاسبه شد');

    } catch (error) {
        logger.error('خطا در محاسبه هزینه ارسال:', error);
        next(error);
    }
};