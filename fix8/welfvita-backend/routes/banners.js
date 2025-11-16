const express = require('express')
const router = express.Router()

const {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require('../controllers/bannerController')
const { protect, authorize } = require('../middleware/auth')

// GET بنرها (برای فرانت و ادمین)
router.get('/', getBanners)

// ایجاد / ویرایش / حذف بنر (ادمین)
router.post('/', protect, authorize('admin', 'manager', 'superadmin'), createBanner)
router.put('/:id', protect, authorize('admin', 'manager', 'superadmin'), updateBanner)
router.delete('/:id', protect, authorize('admin', 'manager', 'superadmin'), deleteBanner)

module.exports = router

