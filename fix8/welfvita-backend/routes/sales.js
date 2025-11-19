const express = require('express')
const router = express.Router()
const {
  createSale,
  getAllSales,
  getSaleById,
  updateSale,
  deleteSale,
} = require('../controllers/saleController')
const { protect, authorize } = require('../middleware/auth')

// (در آینده روت GET /active برای فرانت‌اند سایت خواهیم داشت)

// --- روت‌های ادمین ---
router.get('/admin', protect, authorize('admin', 'manager', 'superadmin'), getAllSales)
router.post('/admin', protect, authorize('admin', 'manager', 'superadmin'), createSale)
router.get('/admin/:id', protect, authorize('admin', 'manager', 'superadmin'), getSaleById)
router.put('/admin/:id', protect, authorize('admin', 'manager', 'superadmin'), updateSale)
router.delete('/admin/:id', protect, authorize('admin', 'manager', 'superadmin'), deleteSale)

module.exports = router
