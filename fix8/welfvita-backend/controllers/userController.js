const User = require('../models/Admin')

// سطح دسترسی نقش‌ها برای کنترل ارتقای نقش
const ROLE_LEVELS = {
  user: 1,
  manager: 2,
  admin: 3,
  superadmin: 4,
}

// ============================================
// GET /api/users/admin/all
// لیست کاربران (با فیلتر نقش و وضعیت) برای مدیریت توسط ادمین‌ها
// ============================================
exports.getAllUsersAsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 20
    const skip = (page - 1) * limit

    const search = req.query.search || ''
    const filter = {}

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    if (req.query.role) {
      filter.role = req.query.role
    } else {
      filter.role = 'user'
    }

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true'
    }

    const totalUsers = await User.countDocuments(filter)
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست کاربران',
      error: error.message,
    })
  }
}

// ============================================
// GET /api/users/admin/:id
// دریافت مشخصات یک کاربر برای مشاهده/ویرایش توسط ادمین
// ============================================
exports.getUserByIdAsAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean()

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربری با این شناسه یافت نشد.',
      })
    }

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Error fetching user by id:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت اطلاعات کاربر',
      error: error.message,
    })
  }
}

// ============================================
// PUT /api/users/admin/:id
// به‌روزرسانی کاربر؛ هر نقش فقط می‌تواند نقش‌های پایین‌تر را تغییر دهد
// ============================================
exports.updateUserAsAdmin = async (req, res) => {
  try {
    const { name, email, phoneNumber, isActive, role } = req.body || {}

    const currentRole = req.user?.role || 'user'
    const currentLevel = ROLE_LEVELS[currentRole] || 0

    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربری با این شناسه یافت نشد.',
      })
    }

    const targetCurrentLevel = ROLE_LEVELS[user.role] || 0

    // هر نقش فقط می‌تواند تنظیمات نقش‌های پایین‌تر از خودش را تغییر دهد
    if (targetCurrentLevel >= currentLevel) {
      return res.status(403).json({
        success: false,
        message: 'شما مجاز به تغییر نقش این کاربر نیستید.',
      })
    }

    // اگر نقش جدید ارسال شده، سطح آن نباید بالاتر از نقش فعلی درخواست‌کننده باشد
    if (role !== undefined) {
      const newRoleLevel = ROLE_LEVELS[role]

      if (!newRoleLevel) {
        return res.status(400).json({
          success: false,
          message: 'نقش انتخاب‌شده نامعتبر است.',
        })
      }

      if (newRoleLevel > currentLevel) {
        return res.status(403).json({
          success: false,
          message: 'شما مجاز به انتساب این نقش نیستید.',
        })
      }

      user.role = role
    }

    if (name !== undefined) user.name = name
    if (email !== undefined) user.email = email
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber
    if (isActive !== undefined) user.isActive = isActive

    await user.save()

    const updatedUser = await User.findById(user._id).select('-password').lean()

    res.json({
      success: true,
      message: 'اطلاعات کاربر با موفقیت به‌روزرسانی شد.',
      data: updatedUser,
    })
  } catch (error) {
    console.error('Error updating user:', error)

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'ایمیل وارد شده قبلاً استفاده شده است.',
      })
    }

    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی اطلاعات کاربر',
      error: error.message,
    })
  }
}

// ============================================
// DELETE /api/users/admin/:id
// حذف کاربر (جلوگیری از حذف خود)
// ============================================
exports.deleteUserAsAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربری با این شناسه یافت نشد.',
      })
    }

    // جلوگیری از حذف حساب کاربری خودِ ادمین
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'امکان حذف حساب کاربری خودتان وجود ندارد.',
      })
    }

    await User.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: 'کاربر با موفقیت حذف شد.',
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در حذف کاربر',
      error: error.message,
    })
  }
}

