const express = require('express')
const router = express.Router()

const Product = require('../models/Product')
const Category = require('../models/Category')
const { protect, authorize } = require('../middleware/auth')
const { upload, cloudinary } = require('../middleware/upload')

// ============================================
// Helpers
// ============================================

// Normalize Cloudinary file object to { url, public_id }
const extractImageInfo = (file) => {
  if (!file) return null
  return {
    url: file.path,
    public_id: file.filename,
  }
}

// Recursively collect all descendant category IDs
const getAllDescendantCategoryIds = async (parentId) => {
  const children = await Category.find({ parent: parentId }).select('_id').lean()

  const ids = []

  for (const child of children) {
    ids.push(child._id)
    const subIds = await getAllDescendantCategoryIds(child._id)
    ids.push(...subIds)
  }

  return ids
}

// Helper to build filter object from query
const buildProductFilter = (query) => {
  const filter = {}

  // By default, only active products unless includeInactive=true
  if (!query.includeInactive) {
    filter.isActive = true
  }

  // Text search on name
  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' }
  }

  // Advanced filters like isActive[eq]=true
  Object.keys(query).forEach((key) => {
    const match = key.match(/^(.+)\[(.+)\]$/)
    if (!match) return

    const field = match[1]
    const op = match[2]
    const value = query[key]

    if (field === 'isActive') {
      const boolVal = value === 'true' || value === true
      if (op === 'eq') filter.isActive = boolVal
      return
    }

    if (op === 'eq') {
      filter[field] = value
    } else if (op === 'lt') {
      filter[field] = { $lt: Number(value) }
    } else if (op === 'gt') {
      filter[field] = { $gt: Number(value) }
    }
  })

  return filter
}

// ============================================
// GET /api/products
// Public products list with filters & pagination
// ============================================
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 20
    const skip = (page - 1) * limit

    const sort = req.query.sort || '-createdAt'
    const fields = req.query.fields ? req.query.fields.split(',').join(' ') : undefined

    let filter = buildProductFilter(req.query)

    // productType filter (simple / variable)
    if (req.query.productType === 'variable') {
      filter = {
        ...filter,
        productType: 'variable',
      }
    } else if (req.query.productType === 'simple') {
      // برای سازگاری عقب‌رو: محصولاتی که productType ندارند هم ساده محسوب می‌شوند
      filter = {
        ...filter,
        $or: [
          { productType: { $exists: false } },
          { productType: null },
          { productType: '' },
          { productType: 'simple' },
        ],
      }
    }

    // Category filter with optional descendants
    if (req.query.category) {
      if (req.query.includeChildren === 'true') {
        const ids = [req.query.category]
        const descendants = await getAllDescendantCategoryIds(req.query.category)
        ids.push(...descendants)
        filter.category = { $in: ids }
      } else {
        filter.category = req.query.category
      }
    }

    const query = Product.find(filter).sort(sort).skip(skip).limit(limit)

    if (fields) {
      query.select(fields)
    }

    const [items, total] = await Promise.all([
      query.lean(),
      Product.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: items,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    })
  }
})

// ============================================
// GET /api/products/:id
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      })
    }

    res.json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error('Error fetching product by id:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message,
    })
  }
})

// ============================================
// POST /api/products  (JSON create)
// Supports both simple and variable products
// ============================================
router.post(
  '/',
  protect,
  authorize('admin', 'manager', 'superadmin'),
  async (req, res) => {
    try {
      const {
        name,
        price,
        stock,
        category,
        brand,
        description,
        sku,
        productType,
        attributes,
        variants,
      } = req.body

      const productData = {
        name,
        category: category || null,
        brand: brand || null,
        description: description || '',
        sku: sku || undefined,
        productType: productType || 'simple',
      }

      // فیلدهای قیمت و موجودی برای محصول ساده
      if (productType === 'simple' || !productType) {
        if (price !== undefined) productData.price = price
        if (stock !== undefined) productData.stock = stock
      }

      // ویژگی‌ها و متغیرها برای محصول متغیر
      if (productType === 'variable') {
        productData.attributes = attributes || []
        productData.variants = variants || []
      }

      const product = await Product.create(productData)

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      })
    } catch (error) {
      console.error('Error creating product:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: error.message,
      })
    }
  },
)

// ============================================
// PUT /api/products/:id  (update basic fields)
// Supports optional removeAllImages flag
// Supports both simple and variable products
// ============================================
router.put(
  '/:id',
  protect,
  authorize('admin', 'manager', 'superadmin'),
  async (req, res) => {
    try {
      const body = req.body || {}
      const { removeAllImages, ...updates } = body

      const product = await Product.findById(req.params.id)
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        })
      }

      // Remove all images (and from Cloudinary) if requested
      if (removeAllImages) {
        if (Array.isArray(product.images)) {
          for (const img of product.images) {
            if (img && typeof img === 'object' && img.public_id) {
              try {
                await cloudinary.uploader.destroy(img.public_id)
              } catch (err) {
                console.error(
                  'Error deleting product image from Cloudinary during update:',
                  err.message,
                )
              }
            }
          }
        }
        product.images = []
      }

      // Apply other updates
      Object.keys(updates).forEach((key) => {
        product[key] = updates[key]
      })

      const updatedProduct = await product.save()

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct,
      })
    } catch (error) {
      console.error('Error updating product:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: error.message,
      })
    }
  },
)

// ============================================
// POST /api/products/:id/images  (upload images)
// ============================================
router.post(
  '/:id/images',
  protect,
  authorize('admin', 'manager', 'superadmin'),
  upload.array('images', 10),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id)
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        })
      }

      const newImages = (req.files || [])
        .map((file) => extractImageInfo(file))
        .filter(Boolean)

      product.images = [...(product.images || []), ...newImages]
      await product.save()

      res.json({
        success: true,
        message: 'Images uploaded successfully',
        data: product,
      })
    } catch (error) {
      console.error('Error uploading product images:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to upload images',
        error: error.message,
      })
    }
  },
)

// ============================================
// DELETE /api/products/:id
// ============================================
router.delete(
  '/:id',
  protect,
  authorize('admin', 'manager', 'superadmin'),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id)

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        })
      }

      // Delete any Cloudinary images associated with this product
      if (Array.isArray(product.images)) {
        for (const img of product.images) {
          if (img && typeof img === 'object' && img.public_id) {
            try {
              await cloudinary.uploader.destroy(img.public_id)
            } catch (err) {
              console.error('Error deleting product image from Cloudinary:', err.message)
            }
          }
        }
      }

      await product.deleteOne()

      res.json({
        success: true,
        message: 'Product deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting product:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: error.message,
      })
    }
  },
)

// ============================================
// PUT /api/products/:id/stock - Quick stock update
// Only for simple products
// ============================================
router.put(
  '/:id/stock',
  protect,
  authorize('admin', 'manager', 'superadmin'),
  async (req, res) => {
    try {
      const { stock } = req.body

      if (stock === undefined || stock === null || stock === '') {
        return res.status(400).json({
          success: false,
          message: 'مقدار موجودی معتبر نیست',
        })
      }

      const numericStock = Number(stock)
      if (!Number.isFinite(numericStock)) {
        return res.status(400).json({
          success: false,
          message: 'مقدار موجودی معتبر نیست',
        })
      }

      if (numericStock < 0) {
        return res.status(400).json({
          success: false,
          message: 'موجودی نمی‌تواند منفی باشد',
        })
      }

      const product = await Product.findById(req.params.id)
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'محصول یافت نشد',
        })
      }

      // Only simple products support direct stock field
      if (product.productType === 'variable') {
        return res.status(400).json({
          success: false,
          message:
            'مدیریت موجودی برای محصولات متغیر باید از طریق متغیرها انجام شود، نه فیلد stock اصلی محصول.',
        })
      }

      // Update stock only, without triggering validation on other fields
      const updated = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: { stock: numericStock } },
        { new: true, runValidators: false },
      )

      res.json({
        success: true,
        message: 'موجودی محصول با موفقیت به‌روزرسانی شد',
        data: updated,
      })
    } catch (error) {
      console.error('Error updating stock:', error)
      res.status(500).json({
        success: false,
        message: 'خطا در به‌روزرسانی موجودی',
        error: error.message,
      })
    }
  },
)

module.exports = router

