const mongoose = require('mongoose');

/**
 * ====================================
 * Cart Schema - سبد خرید
 * ====================================
 */
const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'سبد خرید باید به کاربر مرتبط باشد'],
        unique: true // هر کاربر فقط یک سبد خرید دارد
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'تعداد باید حداقل ۱ باشد'],
            default: 1
        },
        // برای محصولات با variant
        variant: {
            name: String, // مثلاً 'رنگ'
            value: String // مثلاً 'قرمز'
        },
        // قیمت در زمان اضافه کردن (برای محاسبه صحیح)
        priceAtAdd: {
            type: Number,
            required: true
        },
        // تاریخ اضافه شدن
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // کد تخفیف اعمال شده
    couponCode: {
        type: String,
        trim: true,
        uppercase: true
    },
    // مقدار تخفیف کوپن
    couponDiscount: {
        type: Number,
        default: 0,
        min: 0
    },
    // یادداشت کاربر
    notes: {
        type: String,
        maxlength: [500, 'یادداشت نباید بیشتر از ۵۰۰ کاراکتر باشد']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ======================================================
// Indexes
// ======================================================
cartSchema.index({ user: 1 });
cartSchema.index({ 'items.product': 1 });
cartSchema.index({ updatedAt: -1 });

// ======================================================
// Virtual Fields
// ======================================================
// تعداد کل محصولات
cartSchema.virtual('totalItems').get(function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// مجموع قیمت (بدون تخفیف)
cartSchema.virtual('subtotal').get(function() {
    return this.items.reduce((total, item) => {
        return total + (item.priceAtAdd * item.quantity);
    }, 0);
});

// مجموع با احتساب تخفیف کوپن
cartSchema.virtual('total').get(function() {
    const subtotal = this.subtotal;
    return Math.max(0, subtotal - (this.couponDiscount || 0));
});

// ======================================================
// Hooks
// ======================================================
// حذف آیتم‌های با تعداد صفر قبل از ذخیره
cartSchema.pre('save', function(next) {
    this.items = this.items.filter(item => item.quantity > 0);
    next();
});

// بررسی موجودی محصولات قبل از ذخیره
cartSchema.pre('save', async function(next) {
    try {
        const Product = mongoose.model('Product');
        
        for (let item of this.items) {
            const product = await Product.findById(item.product).select('stock name');
            
            if (!product) {
                return next(new Error(`محصول ${item.product} یافت نشد`));
            }
            
            if (product.stock < item.quantity) {
                return next(new Error(`موجودی ${product.name} کافی نیست. موجودی فعلی: ${product.stock}`));
            }
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// ======================================================
// Instance Methods
// ======================================================
// اضافه کردن محصول به سبد
cartSchema.methods.addItem = function(productId, quantity = 1, priceAtAdd, variant = null) {
    const existingItemIndex = this.items.findIndex(item => {
        const productMatch = item.product.toString() === productId.toString();
        
        // اگر variant داریم، باید variant هم یکسان باشد
        if (variant) {
            const variantMatch = item.variant?.name === variant.name && 
                                item.variant?.value === variant.value;
            return productMatch && variantMatch;
        }
        
        return productMatch && !item.variant;
    });

    if (existingItemIndex > -1) {
        // محصول از قبل وجود دارد - افزایش تعداد
        this.items[existingItemIndex].quantity += quantity;
    } else {
        // محصول جدید
        this.items.push({
            product: productId,
            quantity,
            priceAtAdd,
            variant,
            addedAt: Date.now()
        });
    }

    return this;
};

// حذف محصول از سبد
cartSchema.methods.removeItem = function(productId, variant = null) {
    this.items = this.items.filter(item => {
        const productMatch = item.product.toString() === productId.toString();
        
        if (variant) {
            const variantMatch = item.variant?.name === variant.name && 
                                item.variant?.value === variant.value;
            return !(productMatch && variantMatch);
        }
        
        return !productMatch;
    });

    return this;
};

// به‌روزرسانی تعداد محصول
cartSchema.methods.updateItemQuantity = function(productId, quantity, variant = null) {
    const item = this.items.find(item => {
        const productMatch = item.product.toString() === productId.toString();
        
        if (variant) {
            const variantMatch = item.variant?.name === variant.name && 
                                item.variant?.value === variant.value;
            return productMatch && variantMatch;
        }
        
        return productMatch && !item.variant;
    });

    if (item) {
        item.quantity = quantity;
    }

    return this;
};

// خالی کردن سبد
cartSchema.methods.clear = function() {
    this.items = [];
    this.couponCode = undefined;
    this.couponDiscount = 0;
    this.notes = undefined;
    return this;
};

// اعمال کد تخفیف
cartSchema.methods.applyCoupon = function(code, discountAmount) {
    this.couponCode = code;
    this.couponDiscount = discountAmount;
    return this;
};

// حذف کد تخفیف
cartSchema.methods.removeCoupon = function() {
    this.couponCode = undefined;
    this.couponDiscount = 0;
    return this;
};

// دریافت خلاصه سبد
cartSchema.methods.getSummary = function() {
    return {
        totalItems: this.totalItems,
        subtotal: this.subtotal,
        couponDiscount: this.couponDiscount,
        total: this.total,
        items: this.items.length
    };
};

// ======================================================
// Static Methods
// ======================================================
// یافتن یا ساخت سبد خرید کاربر
cartSchema.statics.findOrCreate = async function(userId) {
    let cart = await this.findOne({ user: userId });
    
    if (!cart) {
        cart = await this.create({ user: userId, items: [] });
    }
    
    return cart;
};

// پاک‌سازی سبدهای قدیمی (سبدهایی که بیش از 30 روز آپدیت نشده‌اند)
cartSchema.statics.cleanOldCarts = async function(days = 30) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    const result = await this.deleteMany({
        updatedAt: { $lt: date },
        items: { $size: 0 } // فقط سبدهای خالی
    });
    
    return result.deletedCount;
};

module.exports = mongoose.model('Cart', cartSchema);