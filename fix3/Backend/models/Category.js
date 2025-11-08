const mongoose = require('mongoose');
const slugify = require('slugify');

/**
 * ====================================
 * Category Schema - دسته‌بندی محصولات
 * ====================================
 */
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'لطفاً نام دسته‌بندی را وارد کنید'],
        unique: true,
        trim: true,
        minlength: [2, 'نام دسته‌بندی باید حداقل ۲ کاراکتر باشد'],
        maxlength: [50, 'نام دسته‌بندی نباید بیشتر از ۵۰ کاراکتر باشد']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'توضیحات نباید بیشتر از ۵۰۰ کاراکتر باشد']
    },
    // دسته‌بندی والد (برای ساختار درختی)
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    // 🆕 سطح عمق دسته‌بندی (0=اصلی, 1=زیردسته, 2=زیرزیردسته)
    level: {
        type: Number,
        default: 0,
        min: 0,
        max: 3
    },
    // تصویر دسته‌بندی
    image: {
        url: {
            type: String,
            default: '/uploads/categories/default.png'
        },
        // 🆕 برای حذف از Cloudinary
        public_id: {
            type: String,
            default: null
        }
    },
    // آیکون دسته‌بندی (برای نمایش در منو)
    icon: {
        type: String,
        default: 'category'
    },
    // ترتیب نمایش
    order: {
        type: Number,
        default: 0
    },
    // وضعیت فعال/غیرفعال
    isActive: {
        type: Boolean,
        default: true
    },
    // نمایش در صفحه اصلی
    isFeatured: {
        type: Boolean,
        default: false
    },
    // متادیتا برای SEO
    meta: {
        title: String,
        description: String,
        keywords: [String]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ======================================================
// Indexes
// ======================================================
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1, order: 1 });
categorySchema.index({ isFeatured: 1 }); // 🆕

// ======================================================
// Virtual Fields
// ======================================================
// تعداد محصولات در این دسته‌بندی
categorySchema.virtual('productsCount', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category',
    count: true
});

// زیر دسته‌ها
categorySchema.virtual('children', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent'
});

// ======================================================
// Hooks
// ======================================================
// ساخت slug قبل از ذخیره
categorySchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true,
            locale: 'fa'
        });
    }
    next();
});

// 🆕 محاسبه level بر اساس parent
categorySchema.pre('save', async function(next) {
    if (this.parent) {
        const parentCategory = await this.constructor.findById(this.parent);
        if (parentCategory) {
            this.level = parentCategory.level + 1;
            
            if (this.level > 3) {
                return next(new Error('حداکثر عمق دسته‌بندی 3 سطح است'));
            }
        }
    } else {
        this.level = 0;
    }
    next();
});

// 🔧 FIX: از deleteOne به جای remove استفاده کنید (Mongoose 7+)
categorySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    const childrenCount = await this.constructor.countDocuments({ parent: this._id });
    if (childrenCount > 0) {
        return next(new Error('نمی‌توانید دسته‌بندی که زیر دسته دارد را حذف کنید'));
    }
    
    // 🆕 بررسی وجود محصول
    const Product = mongoose.model('Product');
    const productsCount = await Product.countDocuments({ category: this._id });
    if (productsCount > 0) {
        return next(new Error(`${productsCount} محصول به این دسته‌بندی متصل است`));
    }
    
    next();
});

// ======================================================
// Static Methods
// ======================================================
// دریافت دسته‌بندی‌های اصلی (بدون والد)
categorySchema.statics.getRootCategories = function() {
    return this.find({ parent: null, isActive: true }).sort('order');
};

// دریافت درخت کامل دسته‌بندی‌ها
categorySchema.statics.getCategoryTree = async function() {
    const categories = await this.find({ isActive: true })
        .sort('order')
        .lean();

    const buildTree = (parentId = null) => {
        return categories
            .filter(cat => {
                if (parentId === null) return cat.parent === null;
                return cat.parent && cat.parent.toString() === parentId.toString();
            })
            .map(cat => ({
                ...cat,
                children: buildTree(cat._id)
            }));
    };

    return buildTree();
};

// 🆕 دریافت دسته‌های ویژه
categorySchema.statics.getFeaturedCategories = function(limit = 6) {
    return this.find({ isFeatured: true, isActive: true })
        .sort('-createdAt')
        .limit(limit);
};

// ======================================================
// Instance Methods
// ======================================================
// دریافت مسیر کامل دسته‌بندی (breadcrumb)
categorySchema.methods.getFullPath = async function() {
    const path = [this];
    let current = this;

    while (current.parent) {
        current = await this.model('Category').findById(current.parent);
        if (current) path.unshift(current);
    }

    return path;
};

// 🆕 دریافت تمام زیردسته‌ها (بازگشتی)
categorySchema.methods.getAllChildren = async function() {
    const children = await this.constructor.find({ parent: this._id });
    let allChildren = [...children];

    for (const child of children) {
        const grandChildren = await child.getAllChildren();
        allChildren = [...allChildren, ...grandChildren];
    }

    return allChildren;
};

// 🆕 دریافت تمام IDهای زیردسته (برای جستجوی محصولات)
categorySchema.methods.getAllChildrenIds = async function() {
    const children = await this.getAllChildren();
    return [this._id, ...children.map(c => c._id)];
};

module.exports = mongoose.model('Category', categorySchema);