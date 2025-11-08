const mongoose = require('mongoose');

/**
 * ====================================
 * Address Schema - آدرس‌های کاربر
 * ====================================
 */
const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'آدرس باید به کاربر مرتبط باشد']
    },
    // عنوان آدرس (منزل، محل کار، ...)
    title: {
        type: String,
        required: [true, 'لطفاً عنوان آدرس را وارد کنید'],
        trim: true,
        maxlength: [50, 'عنوان آدرس نباید بیشتر از ۵۰ کاراکتر باشد'],
        default: 'آدرس پیش‌فرض'
    },
    // نام گیرنده
    recipientName: {
        type: String,
        required: [true, 'لطفاً نام گیرنده را وارد کنید'],
        trim: true,
        minlength: [2, 'نام گیرنده باید حداقل ۲ کاراکتر باشد'],
        maxlength: [50, 'نام گیرنده نباید بیشتر از ۵۰ کاراکتر باشد']
    },
    // شماره تماس
    phone: {
        type: String,
        required: [true, 'لطفاً شماره تماس را وارد کنید'],
        trim: true,
        match: [/^09\d{9}$/, 'شماره تلفن باید با 09 شروع شود و ۱۱ رقم باشد']
    },
    // استان
    province: {
        type: String,
        required: [true, 'لطفاً استان را وارد کنید'],
        trim: true
    },
    // شهر
    city: {
        type: String,
        required: [true, 'لطفاً شهر را وارد کنید'],
        trim: true
    },
    // آدرس کامل
    address: {
        type: String,
        required: [true, 'لطفاً آدرس کامل را وارد کنید'],
        trim: true,
        minlength: [10, 'آدرس باید حداقل ۱۰ کاراکتر باشد'],
        maxlength: [300, 'آدرس نباید بیشتر از ۳۰۰ کاراکتر باشد']
    },
    // کد پستی
    postalCode: {
        type: String,
        required: [true, 'لطفاً کد پستی را وارد کنید'],
        trim: true,
        match: [/^\d{10}$/, 'کد پستی باید ۱۰ رقم باشد']
    },
    // پلاک
    plaque: {
        type: String,
        trim: true
    },
    // واحد
    unit: {
        type: String,
        trim: true
    },
    // آدرس پیش‌فرض
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// ======================================================
// Indexes
// ======================================================
addressSchema.index({ user: 1, isDefault: -1 });
addressSchema.index({ user: 1, createdAt: -1 });

// ======================================================
// Hooks
// ======================================================
// تنظیم فقط یک آدرس پیش‌فرض برای هر کاربر
addressSchema.pre('save', async function(next) {
    if (this.isDefault) {
        await this.model('Address').updateMany(
            { user: this.user, _id: { $ne: this._id } },
            { $set: { isDefault: false } }
        );
    }
    next();
});

// اگر آدرس اول کاربر است، به صورت خودکار پیش‌فرض شود
addressSchema.pre('save', async function(next) {
    if (this.isNew) {
        const count = await this.model('Address').countDocuments({ user: this.user });
        if (count === 0) {
            this.isDefault = true;
        }
    }
    next();
});

// ======================================================
// Instance Methods
// ======================================================
// دریافت آدرس کامل به صورت متنی
addressSchema.methods.getFullAddress = function() {
    let full = `${this.province}، ${this.city}، ${this.address}`;
    
    if (this.plaque) full += `، پلاک ${this.plaque}`;
    if (this.unit) full += `، واحد ${this.unit}`;
    full += `، کد پستی: ${this.postalCode}`;
    
    return full;
};

module.exports = mongoose.model('Address', addressSchema);