const mongoose = require('mongoose');

/**
 * ====================================
 * Payment Schema - پرداخت‌ها
 * ====================================
 */
const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'پرداخت باید به سفارش مرتبط باشد']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'پرداخت باید به کاربر مرتبط باشد']
    },
    // مبلغ پرداخت (تومان)
    amount: {
        type: Number,
        required: [true, 'مبلغ پرداخت الزامی است'],
        min: [0, 'مبلغ نمی‌تواند منفی باشد']
    },
    // وضعیت پرداخت
    status: {
        type: String,
        enum: {
            values: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
            message: 'وضعیت {VALUE} معتبر نیست'
        },
        default: 'pending'
    },
    // روش پرداخت
    method: {
        type: String,
        enum: {
            values: ['online', 'card', 'wallet', 'cash'],
            message: 'روش پرداخت {VALUE} معتبر نیست'
        },
        default: 'online'
    },
    // درگاه پرداخت
    gateway: {
        type: String,
        enum: ['zarinpal', 'mellat', 'saman', 'parsian', 'melli', 'saderat', 'other'],
        default: 'zarinpal'
    },
    // شماره پیگیری بانک
    transactionId: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    // کد رهگیری درگاه
    authority: {
        type: String,
        trim: true
    },
    // شماره کارت پرداخت‌کننده (4 رقم آخر)
    cardNumber: {
        type: String,
        trim: true,
        match: [/^\d{4}$/, 'شماره کارت باید 4 رقم باشد']
    },
    // اطلاعات پاسخ درگاه (JSON)
    gatewayResponse: {
        type: mongoose.Schema.Types.Mixed,
        select: false
    },
    // IP پرداخت‌کننده
    ipAddress: {
        type: String,
        trim: true
    },
    // تاریخ پرداخت موفق
    paidAt: {
        type: Date
    },
    // تاریخ بازگشت وجه
    refundedAt: {
        type: Date
    },
    // دلیل بازگشت وجه
    refundReason: {
        type: String,
        maxlength: [500, 'دلیل بازگشت وجه نباید بیشتر از ۵۰۰ کاراکتر باشد']
    },
    // یادداشت (برای ادمین)
    notes: {
        type: String,
        maxlength: [1000, 'یادداشت نباید بیشتر از ۱۰۰۰ کاراکتر باشد']
    }
}, {
    timestamps: true
});

// ======================================================
// Indexes
// ======================================================
paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ authority: 1 });

// ======================================================
// Virtual Fields
// ======================================================
// آیا پرداخت موفق بوده؟
paymentSchema.virtual('isSuccessful').get(function() {
    return this.status === 'completed';
});

// آیا پرداخت ناموفق بوده؟
paymentSchema.virtual('isFailed').get(function() {
    return this.status === 'failed';
});

// آیا در انتظار پرداخت است؟
paymentSchema.virtual('isPending').get(function() {
    return this.status === 'pending';
});

// ======================================================
// Instance Methods
// ======================================================
// تایید پرداخت
paymentSchema.methods.verify = function(transactionId, cardNumber = null) {
    this.status = 'completed';
    this.transactionId = transactionId;
    this.paidAt = Date.now();
    
    if (cardNumber) {
        // فقط 4 رقم آخر را ذخیره کن
        this.cardNumber = cardNumber.slice(-4);
    }
    
    return this;
};

// رد پرداخت
paymentSchema.methods.fail = function(reason = null) {
    this.status = 'failed';
    
    if (reason) {
        this.notes = reason;
    }
    
    return this;
};

// بازگشت وجه
paymentSchema.methods.refund = function(reason) {
    if (this.status !== 'completed') {
        throw new Error('فقط پرداخت‌های موفق قابل بازگشت هستند');
    }
    
    this.status = 'refunded';
    this.refundedAt = Date.now();
    this.refundReason = reason;
    
    return this;
};

// لغو پرداخت
paymentSchema.methods.cancel = function() {
    if (this.status === 'completed') {
        throw new Error('نمی‌توانید پرداخت موفق را لغو کنید. از بازگشت وجه استفاده کنید');
    }
    
    this.status = 'cancelled';
    
    return this;
};

// ======================================================
// Static Methods
// ======================================================
// دریافت آمار پرداخت‌ها
paymentSchema.statics.getStats = async function(startDate, endDate) {
    const match = {};
    
    if (startDate && endDate) {
        match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const stats = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);
    
    return stats;
};

// دریافت پرداخت‌های موفق کاربر
paymentSchema.statics.getUserSuccessfulPayments = function(userId) {
    return this.find({ 
        user: userId, 
        status: 'completed' 
    }).sort('-paidAt');
};

module.exports = mongoose.model('Payment', paymentSchema);