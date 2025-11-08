const mongoose = require('mongoose');
const slugify = require('slugify');

/**
 * ====================================
 * Product Schema - ویلف‌ویتا (نسخه نهایی سازگار)
 * ====================================
 */
const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: [true, 'آدرس تصویر الزامی است'] }, // Cloudinary URL
    public_id: { type: String, trim: true }, // Cloudinary Public ID (برای حذف)
    alt: { type: String, default: 'تصویر محصول ویلف‌ویتا' },
    isPrimary: { type: Boolean, default: false }
  },
  { _id: false }
);

const specificationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const variantOptionSchema = new mongoose.Schema(
  {
    value: { type: String, required: true, trim: true }, // مثال: قرمز
    priceModifier: { type: Number, default: 0 }, // تغییر قیمت
    stock: { type: Number, min: 0 }, // موجودی اختصاصی نوع
    sku: { type: String, trim: true },
    imageIndex: { type: Number, min: 0 }
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // مثال: رنگ
    options: { type: [variantOptionSchema], default: [] }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // --- اطلاعات اصلی ---
    name: {
      type: String,
      required: [true, 'نام محصول الزامی است'],
      trim: true,
      minlength: [3, 'نام محصول باید حداقل 3 کاراکتر باشد'],
      maxlength: [200, 'نام محصول نمی‌تواند بیش از 200 کاراکتر باشد']
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true
    },
    description: {
      type: String,
      required: [true, 'توضیحات محصول الزامی است'],
      minlength: [10, 'توضیحات باید حداقل 10 کاراکتر باشد'],
      maxlength: [3000, 'توضیحات نمی‌تواند بیش از 3000 کاراکتر باشد']
    },
    shortDescription: {
      type: String,
      maxlength: [500, 'توضیحات کوتاه نمی‌تواند بیش از 500 کاراکتر باشد']
    },

    // --- قیمت‌گذاری ---
    price: { type: Number, required: [true, 'قیمت الزامی است'], min: [0, 'قیمت منفی مجاز نیست'] },
    originalPrice: { type: Number, min: [0, 'قیمت اصلی منفی مجاز نیست'] },
    discount: { type: Number, default: 0, min: [0, 'تخفیف منفی مجاز نیست'], max: [100, 'تخفیف بیش از ۱۰۰٪ مجاز نیست'] },

    // --- دسته‌بندی ---
    category: {
      type: String,
      required: [true, 'دسته‌بندی الزامی است'],
      enum: { values: ['قفل', 'دوربین', 'آلارم', 'گاوصندوق', 'سایر'], message: 'دسته‌بندی {VALUE} معتبر نیست' },
      index: true
    },
    subCategory: { type: String, trim: true },
    brand: { type: String, trim: true, maxlength: [100, 'برند بیش از ۱۰۰ کاراکتر مجاز نیست'], index: true },
    tags: { type: [String], default: [], set: v => (Array.isArray(v) ? v.map(x => String(x).trim().toLowerCase()) : []) },

    // --- موجودی و فروش ---
    stock: { type: Number, required: [true, 'موجودی الزامی است'], min: [0, 'موجودی منفی مجاز نیست'], default: 0 },
    soldCount: { type: Number, default: 0, min: [0, 'تعداد فروش منفی مجاز نیست'] },
    lowStockThreshold: { type: Number, default: 5, min: [0, 'آستانه منفی مجاز نیست'] },

    // --- تصاویر ---
    images: { type: [imageSchema], default: [] },

    // --- مشخصات فنی ---
    specifications: { type: [specificationSchema], default: [] },

    // --- ویژگی‌های متغیر ---
    variants: { type: [variantSchema], default: [] },

    // --- SKU و Barcode پایه ---
    sku: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    barcode: { type: String, unique: true, sparse: true, trim: true },

    // --- وضعیت‌ها ---
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isNewArrival: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false, index: true },

    // --- رتبه‌بندی و نظرات ---
    rating: { type: Number, default: 0, min: 0, max: 5, set: val => Math.round(val * 10) / 10 },
    numReviews: { type: Number, default: 0, min: 0 },

    // --- ابعاد و وزن ---
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, enum: ['cm', 'inch'], default: 'cm' }
    },
    weight: {
      value: Number,
      unit: { type: String, enum: ['kg', 'g'], default: 'kg' }
    },

    // --- SEO ---
    seo: {
      metaTitle: { type: String, maxlength: [70, 'عنوان متا بیش از ۷۰ کاراکتر مجاز نیست'] },
      metaDescription: { type: String, maxlength: [160, 'توضیحات متا بیش از ۱۶۰ کاراکتر مجاز نیست'] },
      keywords: [{ type: String, trim: true }]
    },

    // --- محصولات مرتبط ---
    relatedProducts: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], default: [] },

    // --- کاربر ایجادکننده (ادمین) ---
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // --- تاریخ‌ها ---
    publishedAt: Date,
    deletedAt: Date // Soft Delete
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ======================================================
// Indexes
// ======================================================
productSchema.index(
  { name: 'text', description: 'text', category: 'text', brand: 'text', tags: 'text' },
  { weights: { name: 5, tags: 3, brand: 2, category: 2, description: 1 } }
);
productSchema.index({ category: 1, isActive: 1, price: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ price: 1, isActive: 1 });
productSchema.index({ rating: -1, isActive: 1 });
productSchema.index({ soldCount: -1, isActive: 1 });
productSchema.index({ createdAt: -1, isActive: 1 });
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ sku: 1 }, { unique: true, sparse: true });
productSchema.index({ barcode: 1 }, { unique: true, sparse: true });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ isOnSale: 1, isActive: 1 });
productSchema.index({ deletedAt: 1 });

// ======================================================
// Virtuals
// ======================================================
productSchema.virtual('isLowStock').get(function () {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});
productSchema.virtual('finalPrice').get(function () {
  const price = this.price || 0;
  const discount = this.discount || 0;
  return discount > 0 ? Math.round(price * (1 - discount / 100)) : price;
});
productSchema.virtual('discountAmount').get(function () {
  const price = this.price || 0;
  return price - this.finalPrice;
});
productSchema.virtual('url').get(function () {
  return `/products/${this.slug}`;
});
productSchema.virtual('primaryImage').get(function () {
  const primary = Array.isArray(this.images) ? this.images.find(img => img.isPrimary) : null;
  return primary || this.images?.[0] || { url: '/uploads/products/default.jpg', alt: this.name || 'تصویر پیش‌فرض' };
});

// ======================================================
// Hooks
// ======================================================
// ساخت/آپدیت Slug
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true, locale: 'fa', remove: /[*+~.()'"!:@]/g });
  }
  next();
});

// تنظیم تصویر اصلی
productSchema.pre('save', function (next) {
  if (this.isModified('images') && Array.isArray(this.images) && this.images.length > 0) {
    const hasPrimary = this.images.some(img => img.isPrimary);
    if (!hasPrimary) {
      this.images[0].isPrimary = true;
    } else {
      let primaryFound = false;
      this.images = this.images.map(img => {
        img.isPrimary = img.isPrimary && !primaryFound ? (primaryFound = true) : false;
        return img;
      });
    }
  }
  next();
});

// تنظیم isOnSale
productSchema.pre('save', function (next) {
  if (this.isModified('discount') || this.isModified('price')) {
    this.isOnSale = (this.discount || 0) > 0 && (this.price || 0) > 0;
  }
  next();
});

// تنظیم publishedAt
productSchema.pre('save', function (next) {
  if (this.isModified('isActive') && this.isActive && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  next();
});

// ======================================================
// Instance Methods
// ======================================================
productSchema.methods.decreaseStock = function (quantity) {
  if (this.stock < quantity) throw new Error(`موجودی '${this.name}' کافی نیست.`);
  this.stock -= quantity;
  this.soldCount += quantity;
};

productSchema.methods.increaseStock = function (quantity) {
  this.stock += quantity;
  this.soldCount -= quantity;
  if (this.soldCount < 0) this.soldCount = 0;
};

productSchema.methods.softDelete = async function () {
  this.isActive = false;
  this.deletedAt = Date.now();
  return await this.save();
};

productSchema.methods.restore = async function () {
  this.isActive = true;
  this.deletedAt = undefined;
  this.publishedAt = this.publishedAt || Date.now();
  return await this.save();
};

// ======================================================
// Static Methods (نمونه‌ها برای سازگاری با روت‌ها)
// ======================================================
productSchema.statics.getBestSellers = function (limit = 10) {
  return this.find({ soldCount: { $gt: 0 }, isActive: true }).sort({ soldCount: -1 }).limit(limit);
};
productSchema.statics.getNewArrivals = function (limit = 10) {
  return this.find({ isActive: true }).sort({ createdAt: -1 }).limit(limit);
};
productSchema.statics.getOnSale = function (limit = 10) {
  return this.find({ isOnSale: true, isActive: true }).sort({ discount: -1 }).limit(limit);
};
productSchema.statics.getFeatured = function (limit = 10) {
  return this.find({ isFeatured: true, isActive: true }).sort({ rating: -1 }).limit(limit);
};
productSchema.statics.getStats = async function () {
  // در صورت نیاز بعداً کامل می‌کنیم
  return [];
};

// ======================================================
// Query Middleware
// ======================================================
productSchema.pre(/^find/, function (next) {
  const opts = this.getOptions?.() || {};
  if (opts.includeDeleted === true) {
    // فقط حذف‌شده‌ها
    this.where({ deletedAt: { $exists: true } });
  } else if (opts.withDeleted === true || opts.includeInactive === true) {
    // همه را نشان بده (فیلتری اعمال نکن)
  } else {
    // فقط فعال‌ها و حذف‌نشده‌ها
    this.where({ isActive: true, deletedAt: { $exists: false } });
  }
  next();
});

// ======================================================
// Export Model
// ======================================================
module.exports = mongoose.model('Product', productSchema);