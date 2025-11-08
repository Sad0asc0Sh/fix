const mongoose = require('mongoose');

/**
 * ====================================
 * Coupon Schema - سیستم کد تخفیف
 * ====================================
 */
const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'کد تخفیف الزامی است'],
        unique: true,
        uppercase: true,
        trim: true,
        minlength: [3, 'کد تخفیف باید حداقل 3 کاراکتر باشد'],
        maxlength: [20, 'کد تخفیف نباید بیشتر از 20 کاراکتر باشد']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'توضیحات نباید بیشتر از 200 کاراکتر باشد']
    },
    type: {
        type: String,
        enum: {
            values: ['percentage', 'fixed'],
            message: 'نوع تخفیف باید percentage یا fixed باشد'
        },
        required: [true, 'نوع تخفیف الزامی است']
    },
    value: {
        type: Number,
        required: [true, 'مقدار تخفیف الزامی است'],
        min: [0, 'مقدار تخفیف نمی‌تواند منفی باشد']
    },
    // حداکثر تخفیف (فقط برای درصدی)
    maxDiscount: {
        type: Number,
        default: null,
        min: [0, 'حداکثر تخفیف نمی‌تواند منفی باشد']
    },
    // حداقل مبلغ خرید
    minPurchase: {
        type: Number,
        default: 0,
        min: [0, 'حداقل خرید نمی‌تواند منفی باشد']
    },
    // حداکثر تعداد استفاده
    maxUses: {
        type: Number,
        default: null,
        min: [1, 'حداکثر استفاده باید حداقل 1 باشد']
    },
    // تعداد استفاده شده
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    // لیست کاربرانی که استفاده کرده‌اند
    usedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },
        usedAt: {
            type: Date,
            default: Date.now
        },
        discountAmount: {
            type: Number,
            required: true
        }
    }],
    // تاریخ شروع اعتبار
    validFrom: {
        type: Date,
        default: Date.now
    },
    // تاریخ پایان اعتبار
    validUntil: {
        type: Date,
        required: [true, 'تاریخ انقضا الزامی است'],
        validate: {
            validator: function(value) {
                return value > this.validFrom;
            },
            message: 'تاریخ انقضا باید بعد از تاریخ شروع باشد'
        }
    },
    // وضعیت فعال/غیرفعال
    isActive: {
        type: Boolean,
        default: true
    },
    // محدودیت به دسته‌بندی‌های خاص
    applicableCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    // محدودیت به محصولات خاص
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    // محدودیت به کاربران خاص (VIP)
    applicableUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // حداکثر استفاده برای هر کاربر
    maxUsesPerUser: {
        type: Number,
        default: 1,
        min: 1
    },
    // ایجادکننده
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ======================================================
// Indexes
// ======================================================
couponSchema.index({ code: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });
couponSchema.index({ isActive: 1 });

// ======================================================
// Virtual Fields
// ======================================================
// آیا منقضی شده؟
couponSchema.virtual('isExpired').get(function() {
    return Date.now() > this.validUntil;
});

// آیا ظرفیت تمام شده؟
couponSchema.virtual('isMaxUsesReached').get(function() {
    return this.maxUses && this.usedCount >= this.maxUses;
});

// درصد استفاده
couponSchema.virtual('usagePercentage').get(function() {
    if (!this.maxUses) return 0;
    return Math.round((this.usedCount / this.maxUses) * 100);
});

// ======================================================
// Instance Methods
// ======================================================

/**
 * محاسبه مقدار تخفیف
 */
couponSchema.methods.calculateDiscount = function(amount) {
    if (this.type === 'percentage') {
        let discount = (amount * this.value) / 100;
        
        // اعمال حداکثر تخفیف
        if (this.maxDiscount && discount > this.maxDiscount) {
            discount = this.maxDiscount;
        }
        
        return Math.round(discount);
    } else {
        // تخفیف ثابت
        return this.value > amount ? amount : this.value;
    }
};

/**
 * بررسی اعتبار کوپن
 */
couponSchema.methods.isValid = function(userId, amount, cartItems = []) {
    const now = Date.now();
    
    // بررسی فعال بودن
    if (!this.isActive) {
        return { valid: false, message: 'کد تخفیف غیرفعال است' };
    }
    
    // بررسی تاریخ شروع
    if (now < this.validFrom) {
        return { valid: false, message: 'کد تخفیف هنوز فعال نشده است' };
    }
    
    // بررسی تاریخ انقضا
    if (now > this.validUntil) {
        return { valid: false, message: 'کد تخفیف منقضی شده است' };
    }
    
    // بررسی حداکثر استفاده کلی
    if (this.maxUses && this.usedCount >= this.maxUses) {
        return { valid: false, message: 'ظرفیت استفاده از این کد تمام شده است' };
    }
    
    // بررسی حداقل خرید
    if (amount < this.minPurchase) {
        return { 
            valid: false, 
            message: `حداقل مبلغ خرید برای این کد ${this.minPurchase.toLocaleString()} تومان است` 
        };
    }
    
    // بررسی محدودیت کاربر خاص
    if (this.applicableUsers.length > 0) {
        const isApplicable = this.applicableUsers.some(
            u => u.toString() === userId.toString()
        );
        if (!isApplicable) {
            return { valid: false, message: 'این کد تخفیف برای شما قابل استفاده نیست' };
        }
    }
    
    // بررسی تعداد استفاده کاربر
    const userUsageCount = this.usedBy.filter(
        u => u.user.toString() === userId.toString()
    ).length;
    
    if (userUsageCount >= this.maxUsesPerUser) {
        return { 
            valid: false, 
            message: `شما حداکثر ${this.maxUsesPerUser} بار می‌توانید از این کد استفاده کنید` 
        };
    }
    
    // بررسی محدودیت دسته‌بندی و محصول
    if (cartItems.length > 0 && (this.applicableCategories.length > 0 || this.applicableProducts.length > 0)) {
        const hasApplicableItem = cartItems.some(item => {
            // بررسی محصول مستقیم
            if (this.applicableProducts.length > 0) {
                const isProductApplicable = this.applicableProducts.some(
                    p => p.toString() === item.product._id.toString()
                );
                if (isProductApplicable) return true;
            }
            
            // بررسی دسته‌بندی
            if (this.applicableCategories.length > 0 && item.product.category) {
                const isCategoryApplicable = this.applicableCategories.some(
                    c => c.toString() === item.product.category.toString()
                );
                if (isCategoryApplicable) return true;
            }
            
            return false;
        });
        
        if (!hasApplicableItem) {
            return { valid: false, message: 'این کد تخفیف برای محصولات سبد خرید شما قابل استفاده نیست' };
        }
    }
    
    return { valid: true };
};

/**
 * ثبت استفاده از کوپن
 */
couponSchema.methods.recordUsage = async function(userId, orderId, discountAmount) {
    this.usedBy.push({
        user: userId,
        order: orderId,
        discountAmount,
        usedAt: Date.now()
    });
    
    this.usedCount += 1;
    
    await this.save();
};

// ======================================================
// Static Methods
// ======================================================

/**
 * پیدا کردن کوپن فعال با کد
 */
couponSchema.statics.findActiveByCode = function(code) {
    return this.findOne({
        code: code.toUpperCase(),
        isActive: true,
        validFrom: { $lte: Date.now() },
        validUntil: { $gte: Date.now() }
    });
};

/**
 * دریافت کوپن‌های فعال برای کاربر
 */
couponSchema.statics.getAvailableForUser = function(userId) {
    return this.find({
        isActive: true,
        validFrom: { $lte: Date.now() },
        validUntil: { $gte: Date.now() },
        $or: [
            { applicableUsers: { $size: 0 } },
            { applicableUsers: userId }
        ]
    }).sort('-createdAt');
};

module.exports = mongoose.model('Coupon', couponSchema);