const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

// ============================================
// Middleware برای احراز هویت
// ============================================
const protect = async (req, res, next) => {
  try {
    let token

    // دریافت token از header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    // بررسی وجود token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'دسترسی غیرمجاز - توکن یافت نشد'
      })
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET)

    // پیدا کردن کاربر
    const admin = await Admin.findById(decoded.id)

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'کاربر یافت نشد'
      })
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'حساب کاربری غیرفعال است'
      })
    }

    // اضافه کردن کاربر به request
    req.user = admin

    next()
  } catch (error) {
    console.error('❌ خطا در احراز هویت:', error)

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'توکن نامعتبر است'
      })
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'توکن منقضی شده است - لطفاً مجدداً وارد شوید'
      })
    }

    res.status(401).json({
      success: false,
      message: 'دسترسی غیرمجاز'
    })
  }
}

// ============================================
// Middleware برای بررسی نقش (role)
// ============================================
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'دسترسی غیرمجاز'
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'شما مجوز دسترسی به این بخش را ندارید'
      })
    }

    next()
  }
}

module.exports = { protect, authorize }
