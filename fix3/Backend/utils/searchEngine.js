const Product = require('../models/Product');
const Category = require('../models/Category');

/**
 * ====================================
 * Search Engine - موتور جستجوی پیشرفته
 * ====================================
 */
class SearchEngine {
    constructor() {
        this.filters = {};
        this.sortOptions = {};
        this.page = 1;
        this.limit = 12;
        this.skip = 0;
    }

    /**
     * جستجوی متنی
     */
    search(keyword) {
        if (keyword && keyword.trim()) {
            this.filters.$or = [
                { name: { $regex: keyword.trim(), $options: 'i' } },
                { description: { $regex: keyword.trim(), $options: 'i' } },
                { brand: { $regex: keyword.trim(), $options: 'i' } },
                { tags: { $in: [new RegExp(keyword.trim(), 'i')] } }
            ];
        }
        return this;
    }

    /**
     * فیلتر قیمت
     */
    priceFilter(minPrice, maxPrice) {
        if (minPrice || maxPrice) {
            this.filters.price = {};
            if (minPrice) this.filters.price.$gte = Number(minPrice);
            if (maxPrice) this.filters.price.$lte = Number(maxPrice);
        }
        return this;
    }

    /**
     * فیلتر دسته‌بندی (شامل زیردسته‌ها)
     */
    async categoryFilter(categoryId) {
        if (categoryId) {
            try {
                const category = await Category.findById(categoryId);
                if (category) {
                    const categoryIds = await category.getAllChildrenIds();
                    this.filters.category = { $in: categoryIds };
                }
            } catch (error) {
                console.error('خطا در فیلتر دسته‌بندی:', error);
            }
        }
        return this;
    }

    /**
     * فیلتر برند
     */
    brandFilter(brands) {
        if (brands) {
            const brandArray = Array.isArray(brands) 
                ? brands 
                : brands.split(',').map(b => b.trim());
            
            this.filters.brand = { $in: brandArray };
        }
        return this;
    }

    /**
     * فیلتر امتیاز
     */
    ratingFilter(minRating) {
        if (minRating) {
            this.filters.averageRating = { $gte: Number(minRating) };
        }
        return this;
    }

    /**
     * فیلتر تخفیف‌دار
     */
    discountFilter(hasDiscount) {
        if (hasDiscount === 'true' || hasDiscount === true) {
            this.filters['discount.percentage'] = { $gt: 0 };
        }
        return this;
    }

    /**
     * فقط موجودها
     */
    inStockOnly(inStock) {
        if (inStock === 'true' || inStock === true) {
            this.filters.stock = { $gt: 0 };
        }
        return this;
    }

    /**
     * فیلتر وضعیت
     */
    statusFilter(isActive) {
        if (isActive !== undefined) {
            this.filters.isActive = isActive === 'true' || isActive === true;
        }
        return this;
    }

    /**
     * فیلتر محصولات ویژه
     */
    featuredFilter(isFeatured) {
        if (isFeatured === 'true' || isFeatured === true) {
            this.filters.isFeatured = true;
        }
        return this;
    }

    /**
     * فیلتر تگ‌ها
     */
    tagFilter(tags) {
        if (tags) {
            const tagArray = Array.isArray(tags) 
                ? tags 
                : tags.split(',').map(t => t.trim());
            
            this.filters.tags = { $in: tagArray };
        }
        return this;
    }

    /**
     * مرتب‌سازی
     */
    sort(sortBy) {
        const sortOptions = {
            'newest': { createdAt: -1 },
            'oldest': { createdAt: 1 },
            'price-asc': { price: 1 },
            'price-desc': { price: -1 },
            'name-asc': { name: 1 },
            'name-desc': { name: -1 },
            'popular': { sold: -1, views: -1 },
            'rating': { averageRating: -1, reviewsCount: -1 },
            'discount': { 'discount.percentage': -1 }
        };
        
        this.sortOptions = sortOptions[sortBy] || sortOptions['newest'];
        return this;
    }

    /**
     * صفحه‌بندی
     */
    paginate(page = 1, limit = 12) {
        this.page = Number(page) || 1;
        this.limit = Number(limit) || 12;
        this.skip = (this.page - 1) * this.limit;
        return this;
    }

    /**
     * اجرای کوئری
     */
    async execute(populate = true) {
        try {
            // فیلتر پیش‌فرض: فقط محصولات فعال
            if (!this.filters.hasOwnProperty('isActive')) {
                this.filters.isActive = true;
            }

            let query = Product.find(this.filters)
                .sort(this.sortOptions)
                .skip(this.skip)
                .limit(this.limit)
                .select('-__v');

            // Populate
            if (populate) {
                query = query
                    .populate('category', 'name slug')
                    .populate('reviews', 'rating comment user', { limit: 3 });
            }

            const products = await query;
            const total = await Product.countDocuments(this.filters);

            return {
                success: true,
                products,
                pagination: {
                    page: this.page,
                    limit: this.limit,
                    total,
                    pages: Math.ceil(total / this.limit),
                    hasNext: this.page < Math.ceil(total / this.limit),
                    hasPrev: this.page > 1
                },
                filters: this.filters
            };
        } catch (error) {
            throw new Error(`خطا در جستجو: ${error.message}`);
        }
    }

    /**
     * دریافت فقط تعداد
     */
    async count() {
        return await Product.countDocuments(this.filters);
    }

    /**
     * دریافت فیلترهای موجود
     */
    async getAvailableFilters() {
        try {
            const [brands, categories, priceRange, ratings] = await Promise.all([
                // برندها
                Product.distinct('brand', { ...this.filters, isActive: true }),
                
                // دسته‌بندی‌ها
                Product.distinct('category', { ...this.filters, isActive: true }),
                
                // محدوده قیمت
                Product.aggregate([
                    { $match: { ...this.filters, isActive: true } },
                    {
                        $group: {
                            _id: null,
                            minPrice: { $min: '$price' },
                            maxPrice: { $max: '$price' }
                        }
                    }
                ]),
                
                // توزیع امتیازات
                Product.aggregate([
                    { $match: { ...this.filters, isActive: true } },
                    {
                        $group: {
                            _id: { $floor: '$averageRating' },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 } }
                ])
            ]);

            // Populate دسته‌بندی‌ها
            const populatedCategories = await Category.find({
                _id: { $in: categories }
            }).select('name slug');

            return {
                brands: brands.filter(Boolean).sort(),
                categories: populatedCategories,
                priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
                ratings: ratings.map(r => ({
                    rating: r._id,
                    count: r.count
                }))
            };
        } catch (error) {
            throw new Error(`خطا در دریافت فیلترها: ${error.message}`);
        }
    }
}

module.exports = SearchEngine;