const express = require('express')
const router = express.Router()
const { protect, authorize } = require('../middleware/auth')
const { upload } = require('../middleware/upload')
const categoryController = require('../controllers/categoryController')

// تعریف فیلدهای آپلود (Cloudinary)
const categoryUpload = upload.fields([
  { name: 'icon', maxCount: 1 },
  { name: 'image', maxCount: 1 },
])

// Tree endpoint
router.get('/tree', categoryController.getCategoryTree)

// لیست و ایجاد دسته‌بندی
router
  .route('/')
  .get(categoryController.getAllCategories)
  .post(
    protect,
    authorize('admin', 'manager', 'superadmin'),
    categoryUpload,
    categoryController.createCategory,
  )

// دریافت، ویرایش و حذف دسته‌بندی
router
  .route('/:id')
  .get(categoryController.getCategoryById)
  .put(
    protect,
    authorize('admin', 'manager', 'superadmin'),
    categoryUpload,
    categoryController.updateCategory,
  )
  .delete(
    protect,
    authorize('admin', 'manager', 'superadmin'),
    categoryController.deleteCategory,
  )

module.exports = router

