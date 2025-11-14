const express = require('express')
const router = express.Router()
const Category = require('../models/Category')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// ============================================
// تنظیمات Multer برای آپلود فایل
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/categories'
    
    // ایجاد پوشه اگر وجود ندارد
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    // نام فایل: fieldname-timestamp-random.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB
  },
  fileFilter: (req, file, cb) => {
    // فقط فایل‌های تصویری
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('فقط فایل‌های تصویری (jpg, png, gif, webp) مجاز هستند'))
    }
  }
})

// ============================================
// تابع Helper برای حذف فایل
// ============================================
function deleteFileIfExists(filePath) {
  // اگر filePath وجود ندارد، return
  if (!filePath) return
  
  // اگر آرایه است، اولین المان را بگیر (برای سازگاری)
  if (Array.isArray(filePath)) {
    filePath = filePath[0]
  }
  
  // اگر string نیست، return
  if (typeof filePath !== 'string') return
  
  // اگر مسیر شامل uploads/ نیست، return (فایل خارجی نباشد)
  if (!filePath.includes('uploads/')) return
  
  try {
    // مسیر کامل فایل
    const fullPath = path.join(__dirname, '..', filePath)
    
    // اگر فایل وجود دارد، حذف کن
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      console.log('✅ فایل حذف شد:', filePath)
    }
  } catch (error) {
    console.error('❌ خطا در حذف فایل:', filePath, error.message)
  }
}

// ============================================
// GET /api/categories/tree
// دریافت درخت کامل دسته‌بندی‌ها
// ============================================
router.get('/tree', async (req, res) => {
  try {
    // تابع بازگشتی برای ساخت درخت
    const buildTree = (categories, parentId = null) => {
      return categories
        .filter(cat => {
          const catParent = cat.parent ? cat.parent.toString() : null
          const compareParent = parentId ? parentId.toString() : null
          return catParent === compareParent
        })
        .sort((a, b) => a.order - b.order)  // مرتب‌سازی بر اساس order
        .map(cat => ({
          _id: cat._id,
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          image: cat.image,
          isFeatured: cat.isFeatured,
          parent: cat.parent,
          slug: cat.slug,
          order: cat.order,
          isActive: cat.isActive,
          children: buildTree(categories, cat._id)
        }))
    }

    // دریافت تمام دسته‌بندی‌های فعال
    const allCategories = await Category.find({ isActive: true })
    
    // ساخت درخت
    const tree = buildTree(allCategories, null)

    res.json({
      success: true,
      data: tree,
      count: allCategories.length
    })
  } catch (error) {
    console.error('❌ خطا در دریافت درخت دسته‌بندی‌ها:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت دسته‌بندی‌ها',
      error: error.message
    })
  }
})

// ============================================
// GET /api/categories
// دریافت لیست تخت دسته‌بندی‌ها
// ============================================
router.get('/', async (req, res) => {
  try {
    const { 
      limit = 1000, 
      fields, 
      parent,
      isFeatured 
    } = req.query

    let query = { isActive: true }
    
    if (parent !== undefined) {
      query.parent = parent === 'null' ? null : parent
    }
    
    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true'
    }

    let categoriesQuery = Category.find(query)
      .limit(parseInt(limit))
      .sort({ order: 1, name: 1 })

    // انتخاب فیلدهای خاص (اگر درخواست شده)
    if (fields) {
      categoriesQuery = categoriesQuery.select(fields.split(',').join(' '))
    }

    const categories = await categoriesQuery

    res.json({
      success: true,
      data: categories,
      count: categories.length
    })
  } catch (error) {
    console.error('❌ خطا در دریافت دسته‌بندی‌ها:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت دسته‌بندی‌ها',
      error: error.message
    })
  }
})

// ============================================
// GET /api/categories/:id
// دریافت یک دسته‌بندی
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name')

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'دسته‌بندی یافت نشد'
      })
    }

    res.json({
      success: true,
      data: category
    })
  } catch (error) {
    console.error('❌ خطا در دریافت دسته‌بندی:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت دسته‌بندی',
      error: error.message
    })
  }
})

// ============================================
// POST /api/categories
// ایجاد دسته‌بندی جدید
// ============================================
router.post('/',
  upload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { name, parent, description, isFeatured } = req.body

      // بررسی وجود نام
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'نام دسته‌بندی الزامی است'
        })
      }

      // ساخت object دسته‌بندی
      const categoryData = {
        name,
        parent: parent && parent !== 'null' ? parent : null,
        description: description || '',
        isFeatured: isFeatured === 'true' || isFeatured === true
      }

      // افزودن مسیر icon (اگر آپلود شده)
      if (req.files?.icon && req.files.icon[0]) {
        categoryData.icon = req.files.icon[0].path
      }

      // افزودن مسیر image (اگر آپلود شده)
      if (req.files?.image && req.files.image[0]) {
        categoryData.image = req.files.image[0].path
      }

      // ذخیره در دیتابیس
      const category = await Category.create(categoryData)

      console.log('✅ دسته‌بندی جدید ایجاد شد:', category.name)

      res.status(201).json({
        success: true,
        data: category,
        message: 'دسته‌بندی با موفقیت ایجاد شد'
      })
    } catch (error) {
      console.error('❌ خطا در ایجاد دسته‌بندی:', error)

      // حذف فایل‌های آپلود شده در صورت خطا
      if (req.files?.icon) {
        deleteFileIfExists(req.files.icon[0].path)
      }
      if (req.files?.image) {
        deleteFileIfExists(req.files.image[0].path)
      }

      res.status(500).json({
        success: false,
        message: 'خطا در ایجاد دسته‌بندی',
        error: error.message
      })
    }
  }
)

// ============================================
// PUT /api/categories/:id
// ویرایش دسته‌بندی
// ============================================
router.put('/:id',
  upload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { name, parent, description, isFeatured } = req.body

      // پیدا کردن دسته‌بندی
      const category = await Category.findById(req.params.id)

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'دسته‌بندی یافت نشد'
        })
      }

      // آپدیت فیلدهای متنی
      if (name !== undefined) category.name = name
      if (parent !== undefined) {
        category.parent = parent && parent !== 'null' ? parent : null
      }
      if (description !== undefined) category.description = description
      if (isFeatured !== undefined) {
        category.isFeatured = isFeatured === 'true' || isFeatured === true
      }

      // آپدیت icon (اگر فایل جدید آپلود شده)
      if (req.files?.icon && req.files.icon[0]) {
        // حذف فایل قدیمی
        deleteFileIfExists(category.icon)
        // ذخیره مسیر جدید
        category.icon = req.files.icon[0].path
      }

      // آپدیت image (اگر فایل جدید آپلود شده)
      if (req.files?.image && req.files.image[0]) {
        // حذف فایل قدیمی
        deleteFileIfExists(category.image)
        // ذخیره مسیر جدید
        category.image = req.files.image[0].path
      }

      // ذخیره تغییرات
      await category.save()

      console.log('✅ دسته‌بندی ویرایش شد:', category.name)

      res.json({
        success: true,
        data: category,
        message: 'دسته‌بندی با موفقیت ویرایش شد'
      })
    } catch (error) {
      console.error('❌ خطا در ویرایش دسته‌بندی:', error)
      res.status(500).json({
        success: false,
        message: 'خطا در ویرایش دسته‌بندی',
        error: error.message
      })
    }
  }
)

// ============================================
// DELETE /api/categories/:id
// حذف دسته‌بندی
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    // پیدا کردن دسته‌بندی
    const category = await Category.findById(req.params.id)

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'دسته‌بندی یافت نشد'
      })
    }

    // بررسی وجود زیرمجموعه
    const hasChildren = await Category.countDocuments({ parent: req.params.id })
    
    if (hasChildren > 0) {
      return res.status(400).json({
        success: false,
        message: `این دسته‌بندی دارای ${hasChildren} زیرمجموعه است. ابتدا زیرمجموعه‌ها را حذف کنید.`
      })
    }

    // حذف فایل‌ها (اگر وجود داشته باشند)
    deleteFileIfExists(category.icon)
    deleteFileIfExists(category.image)

    // حذف از دیتابیس
    await Category.findByIdAndDelete(req.params.id)

    console.log('✅ دسته‌بندی حذف شد:', category.name)

    res.json({
      success: true,
      message: 'دسته‌بندی با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('❌ خطا در حذف دسته‌بندی:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در حذف دسته‌بندی',
      error: error.message
    })
  }
})

module.exports = router
