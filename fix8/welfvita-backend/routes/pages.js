const express = require('express')
const router = express.Router()

const { getAdminPages, createPage, updatePage, deletePage } = require('../controllers/pageController')
const { protect, authorize } = require('../middleware/auth')

// لیست صفحات (برای پنل ادمین)
router.get('/', protect, authorize('admin', 'manager', 'superadmin'), getAdminPages)

// ایجاد صفحه
router.post('/', protect, authorize('admin', 'manager', 'superadmin'), createPage)

// ویرایش و حذف
router.put('/:id', protect, authorize('admin', 'manager', 'superadmin'), updatePage)
router.delete('/:id', protect, authorize('admin', 'manager', 'superadmin'), deletePage)

module.exports = router

