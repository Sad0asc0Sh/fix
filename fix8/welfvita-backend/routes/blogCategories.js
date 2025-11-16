const express = require('express')
const router = express.Router()

const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require('../controllers/blogCategoryController')
const { protect, authorize } = require('../middleware/auth')

// GET همه دسته‌بندی‌ها (عمومی)
router.get('/', getCategories)

// CRUD ادمین
router.post('/', protect, authorize('admin', 'manager', 'superadmin'), createCategory)
router.put('/:id', protect, authorize('admin', 'manager', 'superadmin'), updateCategory)
router.delete('/:id', protect, authorize('admin', 'manager', 'superadmin'), deleteCategory)

module.exports = router

