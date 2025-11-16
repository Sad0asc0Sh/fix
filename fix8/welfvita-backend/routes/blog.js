const express = require('express')
const router = express.Router()

const {
  getAdminPosts,
  createPost,
  getPostById,
  updatePost,
  deletePost,
} = require('../controllers/postController')
const { protect, authorize } = require('../middleware/auth')

// لیست پست‌ها برای پنل ادمین
router.get('/', protect, authorize('admin', 'manager', 'superadmin'), getAdminPosts)

// ایجاد پست
router.post('/', protect, authorize('admin', 'manager', 'superadmin'), createPost)

// جزئیات، ویرایش و حذف
router.get('/:id', protect, authorize('admin', 'manager', 'superadmin'), getPostById)
router.put('/:id', protect, authorize('admin', 'manager', 'superadmin'), updatePost)
router.delete('/:id', protect, authorize('admin', 'manager', 'superadmin'), deletePost)

module.exports = router

