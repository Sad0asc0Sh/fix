const express = require('express')
const router = express.Router()

const {
  createMethod,
  getAllMethods,
  getMethodById,
  updateMethod,
  deleteMethod,
} = require('../controllers/shippingController')
const { protect, authorize } = require('../middleware/auth')

// روت عمومی برای نمایش روش‌های فعال به مشتری
router.get('/', getAllMethods)

// روت‌های ادمین (محافظت شده)
router.post('/', protect, authorize('manager', 'superadmin'), createMethod)
router.get('/admin', protect, authorize('manager', 'superadmin'), getAllMethods)
router.get('/:id', protect, authorize('manager', 'superadmin'), getMethodById)
router.put('/:id', protect, authorize('manager', 'superadmin'), updateMethod)
router.delete('/:id', protect, authorize('manager', 'superadmin'), deleteMethod)

module.exports = router
