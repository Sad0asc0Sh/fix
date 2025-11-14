const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')

// JWT configuration
const JWT_SECRET =
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d'

// ============================================
// Helper: generate JWT token
// ============================================
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  })
}

// ============================================
// Shared login handler with optional role check
// ============================================
const makeLoginHandler = (allowedRoles) => async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    const admin = await Admin.findOne({ email }).select('+password')

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is not active',
      })
    }

    // If allowedRoles is provided, enforce role check (for admin login)
    if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
      if (!allowedRoles.includes(admin.role)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have admin access',
        })
      }
    }

    const isPasswordMatch = await admin.comparePassword(password)

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    admin.lastLogin = new Date()
    await admin.save()

    const token = generateToken(admin._id)
    const adminData = admin.toJSON()

    console.log('Admin login successful:', admin.email)

    // Keep original data.token for compatibility and also expose accessToken
    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: adminData,
        token,
      },
      accessToken: token,
      expiresIn: JWT_EXPIRE,
    })
  } catch (error) {
    console.error('Error in admin login:', error)
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    })
  }
}

// ============================================
// POST /api/auth/admin/login  (admin panel)
// ============================================
router.post(
  '/admin/login',
  makeLoginHandler(['admin', 'manager', 'superadmin']),
)

// ============================================
// POST /api/auth/login  (frontend store)
// ============================================
router.post('/login', makeLoginHandler(null))

// ============================================
// GET /api/auth/me
// ============================================
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    const admin = await Admin.findById(decoded.id)

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found or inactive',
      })
    }

    return res.json({
      success: true,
      data: admin,
    })
  } catch (error) {
    console.error('Error in /me endpoint:', error)

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      })
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch current user',
      error: error.message,
    })
  }
})

// ============================================
// POST /api/auth/register
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      })
    }

    const existingAdmin = await Admin.findOne({ email })

    // اگر کاربری با این ایمیل قبلاً وجود داشته باشد،
    // به‌صورت امن همان را برمی‌گردانیم (رفتار idempotent)
    if (existingAdmin) {
      const token = generateToken(existingAdmin._id)
      console.log('Account already exists, returning success:', existingAdmin.email)

      return res.status(200).json({
        success: true,
        message: 'Account already exists',
        data: {
          user: existingAdmin,
          token,
        },
        accessToken: token,
        expiresIn: JWT_EXPIRE,
      })
    }

    const admin = await Admin.create({
      name,
      email,
      password,
      // ثبت‌نام عادی از فرانت‌اند همیشه user است مگر این‌که role صراحتاً داده شود
      role: role || 'user',
    })

    const token = generateToken(admin._id)

    console.log('Admin registered:', admin.email)

    return res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        user: admin,
        token,
      },
      accessToken: token,
      expiresIn: JWT_EXPIRE,
    })
  } catch (error) {
    console.error('Error in admin registration:', error)
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    })
  }
})

module.exports = router

