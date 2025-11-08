const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * ====================================
 * User Schema - Welfvita Store (Final Version)
 * ====================================
 */
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'لطفاً نام خود را وارد کنید'],
        trim: true,
        minlength: [2, 'نام باید حداقل ۲ کاراکتر باشد'],
        maxlength: [50, 'نام نباید بیشتر از ۵۰ کاراکتر باشد']
    },
    email: {
        type: String,
        required: [true, 'لطفاً ایمیل خود را وارد کنید'],
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: [100, 'ایمیل خیلی طولانی است'],
        match: [ /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'لطفاً یک ایمیل معتبر وارد کنید' ]
    },
    password: {
        type: String,
        required: [true, 'لطفاً رمز عبور را وارد کنید'],
        minlength: [6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'],
        maxlength: [128, 'رمز عبور خیلی طولانی است'],
        select: false // به صورت پیش‌فرض در query ها نمایش داده نمیشه
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'admin', 'manager'],
            message: 'نقش {VALUE} معتبر نیست'
        },
        default: 'user'
    },
    // --- وضعیت حساب ---
    isActive: {
        type: Boolean,
        default: true,
        select: true // مهم: در کوئری‌ها همیشه باشد تا چک شود
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    // --- اطلاعات تکمیلی ---
    phone: {
        type: String,
        trim: true,
        // match: [/^09\d{9}$/, 'شماره تلفن باید با 09 شروع شود و ۱۱ رقم باشد'] // ولیدیشن دقیق‌تر
    },
    address: { // آدرس پیش‌فرض کاربر
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: { type: String, default: 'ایران' }
    },
    avatar: {
        type: String,
        default: '/uploads/avatars/default.png' // آدرس پیش‌فرض آواتار
    },
    // --- تاریخچه و فعالیت ---
    lastLogin: { type: Date },
    passwordChangedAt: { type: Date },
    loginAttempts: { type: Number, default: 0, select: false }, // تعداد تلاش ناموفق
    lockUntil: { type: Date, select: false }, // زمان پایان قفل شدن حساب
    // --- توکن‌های بازنشانی و تایید ---
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpire: { type: Date, select: false },
    // --- ترجیحات کاربر ---
    preferences: {
        newsletter: { type: Boolean, default: true },
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false }
        },
        language: { type: String, enum: ['fa', 'en'], default: 'fa' }
    }
}, {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ======================================================
// Indexes - برای بهبود Performance
// ======================================================
userSchema.index({ email: 1 }); // برای جستجوی سریع ایمیل (unique خودش ایندکس می‌سازد)
userSchema.index({ role: 1, isActive: 1 }); // برای فیلتر ادمین
userSchema.index({ createdAt: -1 }); // برای یافتن کاربران جدید

// ======================================================
// Virtual Fields
// ======================================================
userSchema.virtual('isLocked').get(function() {
    // !! مهم: باید `lockUntil` را در کوئری select کنید تا این کار کند
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ======================================================
// Hooks (Middleware)
// ======================================================
// هش کردن پسورد و مدیریت passwordChangedAt قبل از ذخیره
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(12); // افزایش قدرت هش
        this.password = await bcrypt.hash(this.password, salt);
        if (!this.isNew) { // فقط برای آپدیت پسورد، نه کاربر جدید
            this.passwordChangedAt = Date.now() - 1000; // ۱ ثانیه قبل
        }
        // ریست کردن تلاش‌های ناموفق لاگین هنگام تغییر پسورد
        this.loginAttempts = 0;
        this.lockUntil = undefined;
        next();
    } catch (error) {
        next(error);
    }
});

// تبدیل ایمیل به حروف کوچک قبل از ذخیره
userSchema.pre('save', function(next) {
    if (this.isModified('email')) {
        this.email = this.email.toLowerCase();
    }
    next();
});

// ======================================================
// Instance Methods - متدهای نمونه
// ======================================================
// مقایسه رمز عبور
userSchema.methods.matchPassword = async function(enteredPassword) {
    // !! مهم: باید `password` را در کوئری select کنید تا این کار کند
    if (!this.password) return false; // اگر پسورد select نشده بود
    return await bcrypt.compare(enteredPassword, this.password);
};

// افزایش تلاش‌های ناموفق لاگین
userSchema.methods.incLoginAttempts = async function() {
    const maxAttempts = 5; // تعداد مجاز تلاش ناموفق
    const lockTime = 15 * 60 * 1000; // ۱۵ دقیقه قفل شدن (میلی‌ثانیه)

    // اگر قفل منقضی شده، ریست کن
    if (this.lockUntil && this.lockUntil < Date.now()) {
        this.loginAttempts = 1;
        this.lockUntil = undefined;
    } else {
        this.loginAttempts += 1;
    }

    // قفل کردن حساب اگر لازم بود
    if (this.loginAttempts >= maxAttempts && !this.lockUntil) {
        this.lockUntil = Date.now() + lockTime;
    }

    // ذخیره تغییرات (بدون فعال کردن هوک pre-save پسورد)
    // استفاده از updateOne به جای save برای جلوگیری از فعال شدن هوک
    await this.updateOne({
       $set: {
           loginAttempts: this.loginAttempts,
           lockUntil: this.lockUntil
       }
    });
};


// ریست کردن تلاش‌های لاگین (بعد از لاگین موفق)
userSchema.methods.resetLoginAttempts = async function() {
     // استفاده از updateOne به جای save
     await this.updateOne({
         $set: {
             loginAttempts: 0,
             lastLogin: Date.now() // آپدیت آخرین ورود
         },
         $unset: { lockUntil: 1 } // حذف فیلد قفل
     });
};


// ساخت توکن بازنشانی رمز عبور
userSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // ۱۵ دقیقه
    return resetToken; // توکن خام برای ایمیل
};

// ساخت توکن تایید ایمیل
userSchema.methods.getEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // ۲۴ ساعت
    return verificationToken; // توکن خام برای ایمیل
};

// ساخت Access Token
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        { id: this._id, role: this.role }, // Payload شامل نقش
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '15m', issuer: 'welfvita', audience: 'welfvita-users' }
    );
};

// ساخت Refresh Token
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        { id: this._id }, // Payload ساده‌تر
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d', issuer: 'welfvita', audience: 'welfvita-users' }
    );
};

// بررسی تغییر پسورد بعد از صدور توکن
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    // !! مهم: باید `passwordChangedAt` را در کوئری select کنید
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false; // پسورد هرگز تغییر نکرده
};

// ======================================================
// Static Methods - متدهای استاتیک
// ======================================================
// اعتبارسنجی و یافتن کاربر با Refresh Token
userSchema.statics.verifyRefreshToken = async function(token) {
    if (!token) throw new Error('توکن رفرش وجود ندارد');
    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        // !! مهم: باید فیلدهای لازم برای چک‌های امنیتی را select کنیم !!
        const user = await this.findById(decoded.id).select('+isActive +isLocked +passwordChangedAt');

        if (!user) throw new Error('کاربر توکن یافت نشد');
        if (!user.isActive) throw new Error('حساب غیرفعال است');
        // (isLocked و changedPasswordAfter باید در کنترلر refreshToken چک شوند)

        return user;
    } catch (error) {
        throw new Error('توکن رفرش نامعتبر یا منقضی شده است');
    }
};

// یافتن کاربران فعال
userSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};
// ... (سایر متدهای استاتیک شما عالی بودند) ...

// ======================================================
// Query Middleware
// ======================================================
// حذف فیلدهای حساس از نتایج find (به جز select صریح)
userSchema.pre(/^find/, function(next) {
    // به صورت پیش‌فرض فیلدهای select: false را حذف کن
    // مگر اینکه به صورت دستی select شده باشند
    if (this.options._recursed) return next(); // جلوگیری از loop بی‌نهایت با populate
    const selection = this.getOptions().select;
    if (selection && selection.includes && !selection.includes('+password')) {
         this.select('-password');
    }
    if (selection && selection.includes && !selection.includes('+loginAttempts')) {
         this.select('-loginAttempts -lockUntil');
    }
    // (توکن‌ها هم select: false هستند)
    next();
});

// ======================================================
// Export Model
// ======================================================
module.exports = mongoose.model('User', userSchema);