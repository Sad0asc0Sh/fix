const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

// احراز هویت بر اساس توکن JWT
const protect = async (req, res, next) => {
  try {
    let token

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'توکن ارسال نشده است - لطفاً مجدداً وارد شوید',
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    const admin = await Admin.findById(decoded.id)

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'کاربر ادمین یافت نشد',
      })
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'حساب کاربری ادمین غیرفعال است',
      })
    }

    req.user = admin

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'توکن نامعتبر است',
      })
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'توکن منقضی شده است - لطفاً مجدداً وارد شوید',
      })
    }

    return res.status(401).json({
      success: false,
      message: 'خطای احراز هویت',
    })
  }
}

// مجوز نقش‌ها
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'احراز هویت انجام نشده است',
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'شما دسترسی لازم برای انجام این عملیات را ندارید',
      })
    }

    next()
  }
}

// میانبر برای مجوز ادمین (admin, manager, superadmin)
const admin = authorize('admin', 'manager', 'superadmin')

module.exports = { protect, authorize, admin }

