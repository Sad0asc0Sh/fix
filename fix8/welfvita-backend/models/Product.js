const mongoose = require('mongoose')

// Product schema based on TECHNICAL_DOCS
const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
    },

    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },

    compareAtPrice: {
      type: Number,
      min: 0,
    },

    sku: {
      type: String,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false,
    },

    brand: {
      type: String,
      trim: true,
    },

    // Images: array of objects {url, public_id} (Cloudinary)
    // but old string paths are also accepted for backward compatibility.
    images: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isOnSale: {
      type: Boolean,
      default: false,
    },

    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Simple slug generator from name if not provided
ProductSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    const base = (this.name || '').toString().trim().toLowerCase()
    let slug = base
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}\-]+/gu, '')
      .replace(/\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')

    if (!slug) {
      slug = this._id ? this._id.toString() : new mongoose.Types.ObjectId().toString()
    }

    this.slug = slug
  }
  next()
})

ProductSchema.index({ slug: 1 }, { unique: true, sparse: true })
ProductSchema.index({ name: 1 })
ProductSchema.index({ isFeatured: 1 })
ProductSchema.index({ isActive: 1 })

module.exports = mongoose.model('Product', ProductSchema)
