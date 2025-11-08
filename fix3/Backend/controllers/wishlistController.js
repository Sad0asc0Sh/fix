const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get user wishlist
 * @route   GET /api/wishlist
 * @access  Private
 */
exports.getWishlist = async (req, res, next) => {
    try {
        const wishlist = await Wishlist.getOrCreate(req.user.id);

        successResponse(res, {
            wishlist,
            itemsCount: wishlist.itemsCount
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add product to wishlist
 * @route   POST /api/wishlist
 * @access  Private
 */
exports.addToWishlist = async (req, res, next) => {
    try {
        const { productId, note, priority } = req.body;

        if (!productId) {
            return errorResponse(res, 'شناسه محصول الزامی است', 400);
        }

        // بررسی وجود محصول
        const product = await Product.findById(productId);
        if (!product) {
            return errorResponse(res, 'محصول یافت نشد', 404);
        }

        if (!product.isActive) {
            return errorResponse(res, 'این محصول غیرفعال است', 400);
        }

        let wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            wishlist = await Wishlist.create({ 
                user: req.user.id, 
                products: [] 
            });
        }

        // اضافه کردن محصول
        await wishlist.addProduct(productId, note, priority);

        // دریافت مجدد با populate
        wishlist = await Wishlist.findById(wishlist._id)
            .populate({
                path: 'products.product',
                select: 'name slug price discount images stock isActive',
                populate: {
                    path: 'category',
                    select: 'name slug'
                }
            });

        successResponse(res, wishlist, 'محصول به لیست علاقه‌مندی‌ها اضافه شد', 201);
    } catch (error) {
        if (error.message.includes('قبلاً')) {
            return errorResponse(res, error.message, 400);
        }
        next(error);
    }
};

/**
 * @desc    Remove product from wishlist
 * @route   DELETE /api/wishlist/:productId
 * @access  Private
 */
exports.removeFromWishlist = async (req, res, next) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            return errorResponse(res, 'لیست علاقه‌مندی‌ها یافت نشد', 404);
        }

        await wishlist.removeProduct(req.params.productId);

        successResponse(res, wishlist, 'محصول از لیست علاقه‌مندی‌ها حذف شد');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle product in wishlist
 * @route   POST /api/wishlist/toggle/:productId
 * @access  Private
 */
exports.toggleWishlist = async (req, res, next) => {
    try {
        const { productId } = req.params;

        // بررسی وجود محصول
        const product = await Product.findById(productId);
        if (!product) {
            return errorResponse(res, 'محصول یافت نشد', 404);
        }

        const result = await Wishlist.toggleProduct(req.user.id, productId);

        const message = result.action === 'added' 
            ? 'محصول به لیست علاقه‌مندی‌ها اضافه شد'
            : 'محصول از لیست علاقه‌مندی‌ها حذف شد';

        successResponse(res, {
            action: result.action,
            wishlist: result.wishlist
        }, message);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Check if product is in wishlist
 * @route   GET /api/wishlist/check/:productId
 * @access  Private
 */
exports.checkInWishlist = async (req, res, next) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user.id });

        const inWishlist = wishlist ? wishlist.hasProduct(req.params.productId) : false;

        successResponse(res, { inWishlist });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update product note
 * @route   PATCH /api/wishlist/:productId/note
 * @access  Private
 */
exports.updateNote = async (req, res, next) => {
    try {
        const { note } = req.body;

        const wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            return errorResponse(res, 'لیست علاقه‌مندی‌ها یافت نشد', 404);
        }

        await wishlist.updateNote(req.params.productId, note);

        successResponse(res, wishlist, 'یادداشت به‌روزرسانی شد');
    } catch (error) {
        if (error.message.includes('یافت نشد')) {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

/**
 * @desc    Update product priority
 * @route   PATCH /api/wishlist/:productId/priority
 * @access  Private
 */
exports.updatePriority = async (req, res, next) => {
    try {
        const { priority } = req.body;

        const wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            return errorResponse(res, 'لیست علاقه‌مندی‌ها یافت نشد', 404);
        }

        await wishlist.updatePriority(req.params.productId, priority);

        successResponse(res, wishlist, 'اولویت به‌روزرسانی شد');
    } catch (error) {
        if (error.message.includes('یافت نشد')) {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

/**
 * @desc    Clear all wishlist
 * @route   DELETE /api/wishlist/clear
 * @access  Private
 */
exports.clearWishlist = async (req, res, next) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            return errorResponse(res, 'لیست علاقه‌مندی‌ها یافت نشد', 404);
        }

        await wishlist.clearAll();

        successResponse(res, wishlist, 'لیست علاقه‌مندی‌ها خالی شد');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Move product to cart
 * @route   POST /api/wishlist/:productId/move-to-cart
 * @access  Private
 */
exports.moveToCart = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { quantity = 1 } = req.body;

        // بررسی محصول
        const product = await Product.findById(productId);
        if (!product) {
            return errorResponse(res, 'محصول یافت نشد', 404);
        }

        if (!product.isActive) {
            return errorResponse(res, 'محصول غیرفعال است', 400);
        }

        if (product.stock < quantity) {
            return errorResponse(res, 'موجودی کافی نیست', 400);
        }

        // دریافت یا ایجاد سبد خرید
        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            cart = await Cart.create({
                user: req.user.id,
                items: []
            });
        }

        // بررسی وجود محصول در سبد
        const cartItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (cartItemIndex > -1) {
            // افزایش تعداد
            cart.items[cartItemIndex].quantity += quantity;
        } else {
            // اضافه کردن جدید
            cart.items.push({
                product: productId,
                quantity,
                price: product.price
            });
        }

        // محاسبه مجدد قیمت‌ها
        cart.calculateTotals();
        await cart.save();

        // حذف از wishlist
        const wishlist = await Wishlist.findOne({ user: req.user.id });
        if (wishlist) {
            await wishlist.removeProduct(productId);
        }

        // Populate cart
        await cart.populate('items.product', 'name slug price images stock');

        successResponse(res, {
            cart,
            message: 'محصول به سبد خرید منتقل شد'
        });
    } catch (error) {
        next(error);
    }
};