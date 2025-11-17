const Admin = require('../models/Admin')
const { cloudinary } = require('../middleware/upload')

/**
 * @desc    به‌روزرسانی اطلاعات پروفایل کاربر (نام، ایمیل، رمز عبور)
 * @route   PUT /api/auth/me/update
 * @access  Private
 */
exports.updateMyProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body

    // پیدا کردن کاربر فعلی
    const user = await Admin.findById(req.user.id).select('+password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد',
      })
    }

    // به‌روزرسانی فیلدها
    if (name) user.name = name
    if (email) user.email = email

    // اگر رمز عبور جدید ارسال شده، آن را هش کن
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'رمز عبور باید حداقل ۶ کاراکتر باشد',
        })
      }
      user.password = password
    }

    await user.save()

    // حذف password از خروجی
    const userResponse = user.toJSON()

    res.status(200).json({
      success: true,
      message: 'پروفایل با موفقیت به‌روزرسانی شد',
      data: userResponse,
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی پروفایل',
      error: error.message,
    })
  }
}

/**
 * @desc    به‌روزرسانی آواتار کاربر
 * @route   PUT /api/auth/me/avatar
 * @access  Private
 */
exports.updateMyAvatar = async (req, res) => {
  try {
    // بررسی وجود فایل آپلود شده
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'لطفاً یک تصویر آواتار آپلود کنید',
      })
    }

    // پیدا کردن کاربر فعلی
    const user = await Admin.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد',
      })
    }

    // حذف آواتار قدیمی از Cloudinary (اگر وجود داشته باشد)
    if (user.avatar && user.avatar.public_id) {
      try {
        await cloudinary.uploader.destroy(user.avatar.public_id)
        console.log('Old avatar deleted from Cloudinary:', user.avatar.public_id)
      } catch (error) {
        console.error('Error deleting old avatar from Cloudinary:', error)
        // ادامه می‌دهیم حتی اگر حذف تصویر قدیمی ناموفق باشد
      }
    }

    // ذخیره آواتار جدید
    user.avatar = {
      url: req.file.path,
      public_id: req.file.filename,
    }

    await user.save()

    res.status(200).json({
      success: true,
      message: 'آواتار با موفقیت به‌روزرسانی شد',
      data: user.toJSON(),
    })
  } catch (error) {
    console.error('Error updating avatar:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی آواتار',
      error: error.message,
    })
  }
}
