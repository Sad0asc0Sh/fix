const mongoose = require('mongoose');

/**
 * ====================================
 * Wishlist Schema - لیست علاقه‌مندی‌ها
 * ====================================
 */
const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'کاربر الزامی است'],
        unique: true,
        index: true
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        // یادداشت شخصی کاربر
        note: {
            type: String,
            maxlength: [200, 'یادداشت نباید بیشتر از 200 کاراکتر باشد']
        },
        // اولویت
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ======================================================
// Indexes
// ======================================================
wishlistSchema.index({ 'products.product': 1 });
wishlistSchema.index({ 'products.addedAt': -1 });

// ======================================================
// Virtual Fields
// ======================================================
// تعداد محصولات
wishlistSchema.virtual('itemsCount').get(function() {
    return this.products.length;
});

// ======================================================
// Instance Methods
// ======================================================

/**
 * اضافه کردن محصول به لیست
 */
wishlistSchema.methods.addProduct = function(productId, note = null, priority = 'medium') {
    // بررسی وجود قبلی
    const exists = this.products.some(
        item => item.product.toString() === productId.toString()
    );
    
    if (exists) {
        throw new Error('این محصول قبلاً به لیست علاقه‌مندی‌ها اضافه شده است');
    }
    
    this.products.push({
        product: productId,
        note,
        priority,
        addedAt: Date.now()
    });
    
    return this.save();
};

/**
 * حذف محصول از لیست
 */
wishlistSchema.methods.removeProduct = function(productId) {
    this.products = this.products.filter(
        item => item.product.toString() !== productId.toString()
    );
    
    return this.save();
};

/**
 * بررسی وجود محصول در لیست
 */
wishlistSchema.methods.hasProduct = function(productId) {
    return this.products.some(
        item => item.product.toString() === productId.toString()
    );
};

/**
 * پاک کردن کل لیست
 */
wishlistSchema.methods.clearAll = function() {
    this.products = [];
    return this.save();
};

/**
 * به‌روزرسانی یادداشت محصول
 */
wishlistSchema.methods.updateNote = function(productId, note) {
    const item = this.products.find(
        item => item.product.toString() === productId.toString()
    );
    
    if (!item) {
        throw new Error('محصول در لیست علاقه‌مندی‌ها یافت نشد');
    }
    
    item.note = note;
    return this.save();
};

/**
 * به‌روزرسانی اولویت محصول
 */
wishlistSchema.methods.updatePriority = function(productId, priority) {
    const item = this.products.find(
        item => item.product.toString() === productId.toString()
    );
    
    if (!item) {
        throw new Error('محصول در لیست علاقه‌مندی‌ها یافت نشد');
    }
    
    item.priority = priority;
    return this.save();
};

// ======================================================
// Static Methods
// ======================================================

/**
 * دریافت یا ایجاد wishlist برای کاربر
 */
wishlistSchema.statics.getOrCreate = async function(userId) {
    let wishlist = await this.findOne({ user: userId })
        .populate({
            path: 'products.product',
            select: 'name slug price discount images stock isActive',
            populate: {
                path: 'category',
                select: 'name slug'
            }
        });
    
    if (!wishlist) {
        wishlist = await this.create({ user: userId, products: [] });
    }
    
    return wishlist;
};

/**
 * Toggle محصول (اضافه/حذف)
 */
wishlistSchema.statics.toggleProduct = async function(userId, productId) {
    const wishlist = await this.getOrCreate(userId);
    
    const exists = wishlist.hasProduct(productId);
    
    if (exists) {
        await wishlist.removeProduct(productId);
        return { action: 'removed', wishlist };
    } else {
        await wishlist.addProduct(productId);
        return { action: 'added', wishlist };
    }
};

module.exports = mongoose.model('Wishlist', wishlistSchema);