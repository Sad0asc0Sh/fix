/**
 * ====================================
 * ویژگی‌های پیشرفته API (Filter, Sort, Paginate...)
 * ====================================
 */

class ApiFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    /**
     * فیلتر کردن
     */
    filter() {
        const queryObj = { ...this.queryString };
        
        // فیلدهایی که نباید در فیلتر باشند
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
        excludedFields.forEach(el => delete queryObj[el]);

        // تبدیل به فرمت MongoDB (gte, gt, lte, lt)
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in|nin|ne|eq)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));
        
        return this;
    }

    /**
     * جستجو
     */
    search(searchFields = ['name', 'description']) {
        if (this.queryString.search) {
            const searchQuery = {
                $or: searchFields.map(field => ({
                    [field]: { $regex: this.queryString.search, $options: 'i' }
                }))
            };
            this.query = this.query.find(searchQuery);
        }
        
        return this;
    }

    /**
     * مرتب‌سازی
     */
    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            // مرتب‌سازی پیش‌فرض (جدیدترین)
            this.query = this.query.sort('-createdAt');
        }
        
        return this;
    }

    /**
     * محدود کردن فیلدها
     */
    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            // حذف __v به صورت پیش‌فرض
            this.query = this.query.select('-__v');
        }
        
        return this;
    }

    /**
     * صفحه‌بندی
     */
    paginate() {
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = parseInt(this.queryString.limit, 10) || 10;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        
        // ذخیره اطلاعات pagination برای استفاده بعدی
        this.pagination = { page, limit, skip };
        
        return this;
    }

    /**
     * Populate (برای روابط)
     */
    populate(populateOptions) {
        if (populateOptions) {
            this.query = this.query.populate(populateOptions);
        }
        
        return this;
    }

    /**
     * محاسبه اطلاعات صفحه‌بندی کامل
     */
    async getPaginationInfo(Model) {
        const totalItems = await Model.countDocuments(this.query.getFilter());
        const { page, limit } = this.pagination || { page: 1, limit: 10 };
        
        return {
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            hasNextPage: page * limit < totalItems,
            hasPrevPage: page > 1
        };
    }

    /**
     * اجرای Query و بازگشت نتایج با pagination
     */
    async execute(Model) {
        const results = await this.query;
        const paginationInfo = await this.getPaginationInfo(Model);
        
        return {
            data: results,
            pagination: paginationInfo
        };
    }
}

module.exports = ApiFeatures;