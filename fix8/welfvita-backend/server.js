const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()

// ============================================
// Middleware
// ============================================

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Body Parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static Files (برای دسترسی به فایل‌های آپلود شده)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Request Logger (Development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
  })
}

// ============================================
// Database Connection
// ============================================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/welfvita', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✅ MongoDB متصل شد')
    console.log('📍 Database:', mongoose.connection.name)
  })
  .catch(err => {
    console.error('❌ خطا در اتصال به MongoDB:', err.message)
    process.exit(1)
  })

// ============================================
// Routes
// ============================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  })
})

// Auth Routes
const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes)

// Categories Routes
const categoriesRoutes = require('./routes/categories')
app.use('/api/categories', categoriesRoutes)

// Products Routes
const productsRoutes = require('./routes/products')
app.use('/api/products', productsRoutes)
// Admin panel create endpoint: /api/v1/admin/products -> same router
app.use('/api/v1/admin/products', productsRoutes)

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Welfvita Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      categories: '/api/categories',
      products: '/api/products'
    }
  })
})

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.path}`
  })
})

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗')
  console.log('║     Welfvita Backend Server            ║')
  console.log('╚════════════════════════════════════════╝')
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📍 API: http://localhost:${PORT}/api`)
  console.log(`📁 Uploads: http://localhost:${PORT}/uploads`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log('═══════════════════════════════════════════')
})

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, closing server gracefully...')
  mongoose.connection.close(false, () => {
    console.log('✅ MongoDB connection closed')
    process.exit(0)
  })
})
