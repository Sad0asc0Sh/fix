const express = require('express')
const router = express.Router()
const Product = require('../models/Product')
const { protect, authorize } = require('../middleware/auth')
const { upload, cloudinary } = require('../middleware/upload')

// Normalize Cloudinary file object to { url, public_id }
const extractImageInfo = (file) => {
  if (!file) return null
  return {
    url: file.path,
    public_id: file.filename,
  }
}

// Helper to build filter object from query
const buildProductFilter = (query) => {
  const filter = {}

  // By default, only active products unless includeInactive=true
  if (!query.includeInactive) {
    filter.isActive = true
  }

  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' }
  }

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

    const filter = buildProductFilter(req.query)

    const query = Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)

    if (fields) {
      query.select(fields)
    }

    const [items, total] = await Promise.all([
      query.exec(),
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
// ============================================
router.post(
  '/',
  protect,
  authorize('admin', 'manager', 'superadmin'),
  async (req, res) => {
    try {
      const { name, price, stock, category, description, sku } = req.body

      const product = await Product.create({
        name,
        price,
        stock,
        category: category || null,
        description: description || '',
        sku: sku || undefined,
      })

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

      Object.assign(product, updates)

      // If client requested to remove all images, delete from Cloudinary and clear array
      if (removeAllImages === 'true' || removeAllImages === true) {
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

      await product.save()

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product,
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

module.exports = router
