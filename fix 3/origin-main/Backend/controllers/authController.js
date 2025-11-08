const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken'); // ← اضافه شد
const asyncHandler = require('express-async-handler');

/**
 * ====================================
 * تابع کمکی برای ارسال توکن و کوکی
 * ====================================
 */
const sendTokenResponse = (user, statusCode, res, message) => {
    // Add validation for environment variables
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
        console.error('FATAL ERROR: JWT_SECRET or JWT_REFRESH_SECRET is not defined in the environment variables.');
        return res.status(500).json({
            success: false,
            message: 'خطای پیکربندی سرور: کلیدهای JWT تعریف نشده‌اند.'
        });
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS || '7') * 24 * 60 * 60 * 1000
    };

    const userOutput = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
    };

    res
        .status(statusCode)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .json({
            success: true,
            message: message,
            data: { user: userOutput },
            accessToken,
            expiresIn: process.env.JWT_EXPIRE || '15m'
        });
};

/**
 * ====================================
 * @desc    ثبت‌نام کاربر
 * @route   POST /api/auth/register
 * @access  Public
 * ====================================
 */
exports.registerUser = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;

    // Add validation to prevent crash if fields are missing
    if (!name || !email || !password) {
        res.status(400);
        throw new Error('لطفا تمام فیلدهای لازم را ارسال کنید');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('کاربری با این ایمیل قبلاً ثبت‌نام کرده است');
    }

    const user = await User.create({
        name: String(name).trim(), // Safely trim the name
        email,
        password
    });

    sendTokenResponse(user, 201, res, 'ثبت‌نام با موفقیت انجام شد');
});

/**
 * ====================================
 * @desc    ورود کاربر
 * @route   POST /api/auth/login
 * @access  Public
 * ====================================
 */
exports.loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        res.status(401);
        throw new Error('ایمیل یا رمز عبور وارد شده معتبر نمی‌باشد');
    }

    if (user.isLocked) {
        res.status(423);
        throw new Error('حساب شما به دلیل تلاش‌های ناموفق مکرر قفل شده است. لطفاً ۱۵ دقیقه دیگر تلاش کنید');
    }

    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
        await user.incLoginAttempts();
        res.status(401);
        throw new Error('ایمیل یا رمز عبور وارد شده معتبر نمی‌باشد');
    }

    if (!user.isActive) {
        res.status(403);
        throw new Error('حساب کاربری شما توسط مدیر غیرفعال شده است');
    }

    await user.resetLoginAttempts();

    sendTokenResponse(user, 200, res, 'با موفقیت وارد شدید');
});

/**
 * ====================================
 * @desc    ورود ادمین
 * @route   POST /api/auth/admin/login
 * @access  Public
 * ====================================
 */
exports.adminLogin = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        res.status(401);
        throw new Error('ایمیل یا رمز عبور وارد شده معتبر نمی‌باشد');
    }

    // Check for admin/manager role
    if (!['admin', 'manager'].includes(user.role)) {
        res.status(403);
        throw new Error('شما اجازه دسترسی به این بخش را ندارید');
    }

    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
        res.status(401);
        throw new Error('ایمیل یا رمز عبور وارد شده معتبر نمی‌باشد');
    }

    if (!user.isActive) {
        res.status(403);
        throw new Error('حساب کاربری شما توسط مدیر غیرفعال شده است');
    }

    sendTokenResponse(user, 200, res, `ادمین ${user.name} با موفقیت وارد شد`);
});

/**
 * ====================================
 * @desc    دریافت پروفایل کاربر
 * @route   GET /api/auth/me
 * @access  Private
 * ====================================
 */
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        res.status(404);
        throw new Error('کاربر یافت نشد');
    }

    res.status(200).json({
        success: true,
        message: 'اطلاعات پروفایل شما',
        data: { user }
    });
});

/**
 * ====================================
 * @desc    به‌روزرسانی پروفایل
 * @route   PUT /api/auth/updateprofile
 * @access  Private
 * ====================================
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
    const { name, email, phone, address } = req.body;
    const fieldsToUpdate = {};

    if (name) fieldsToUpdate.name = name.trim();
    if (phone) fieldsToUpdate.phone = phone.trim();
    if (address) fieldsToUpdate.address = address;

    if (email && email.toLowerCase() !== req.user.email) {
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            res.status(400);
            throw new Error('این آدرس ایمیل قبلاً توسط کاربر دیگری استفاده شده است');
        }
        fieldsToUpdate.email = email.toLowerCase();
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        fieldsToUpdate,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        success: true,
        message: 'پروفایل شما با موفقیت به‌روزرسانی شد',
        data: { user: updatedUser }
    });
});

/**
 * ====================================
 * @desc    تغییر رمز عبور
 * @route   PUT /api/auth/changepassword
 * @access  Private
 * ====================================
 */
exports.changePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    const isPasswordCorrect = await user.matchPassword(currentPassword);
    if (!isPasswordCorrect) {
        res.status(401);
        throw new Error('رمز عبور فعلی شما صحیح نمی‌باشد');
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'رمز عبور شما با موفقیت تغییر کرد. لطفاً دوباره وارد شوید'
    });
});

/**
 * ====================================
 * @desc    فراموشی رمز عبور
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 * ====================================
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(200).json({
            success: true,
            message: 'اگر حساب کاربری با این ایمیل وجود داشته باشد، لینک بازیابی رمز عبور ارسال خواهد شد'
        });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `برای بازنشانی رمز عبور، روی لینک زیر کلیک کنید:\n\n${resetUrl}\n\nاین لینک تا ۱۵ دقیقه دیگر معتبر است.`;

    try {
        console.log('Reset URL (برای تست):', resetUrl);

        res.status(200).json({
            success: true,
            message: 'لینک بازیابی رمز عبور به ایمیل شما ارسال شد'
        });
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        console.error('Error sending password reset email:', err);
        throw new Error('خطایی در ارسال ایمیل بازیابی رخ داد. لطفاً بعداً تلاش کنید');
    }
});

/**
 * ====================================
 * @desc    ریست رمز عبور
 * @route   PUT /api/auth/resetpassword/:resettoken
 * @access  Public
 * ====================================
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('لینک بازیابی رمز عبور نامعتبر یا منقضی شده است');
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'رمز عبور شما با موفقیت تغییر یافت و وارد شدید');
});

/**
 * ====================================
 * @desc    خروج کاربر
 * @route   POST /api/auth/logout
 * @access  Private
 * ====================================
 */
exports.logout = asyncHandler(async (req, res, next) => {
    res.cookie('refreshToken', 'none', {
        expires: new Date(Date.now() + 5 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    res.status(200).json({
        success: true,
        message: 'شما با موفقیت از حساب کاربری خود خارج شدید'
    });
});

/**
 * ====================================
 * @desc    رفرش توکن
 * @route   POST /api/auth/refresh
 * @access  Public
 * ====================================
 */
exports.refreshToken = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.cookies;

    try {
        const user = await User.verifyRefreshToken(refreshToken);
        
        const decoded = jwt.decode(refreshToken);
        if (user.isLocked || user.changedPasswordAfter(decoded.iat)) {
            throw new Error('وضعیت کاربر تغییر کرده است');
        }

        const accessToken = user.generateAccessToken();

        res.status(200).json({
            success: true,
            message: 'توکن دسترسی با موفقیت تمدید شد',
            accessToken,
            expiresIn: process.env.JWT_EXPIRE || '15m'
        });

    } catch (error) {
        res.status(401);
        res.cookie('refreshToken', 'none', { expires: new Date(0) });
        throw new Error('نشست شما نامعتبر یا منقضی شده است. لطفاً دوباره وارد شوید');
    }
});
