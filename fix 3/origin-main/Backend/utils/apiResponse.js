/**
 * ====================================
 * استاندارد کردن پاسخ‌های API
 * ====================================
 */

class ApiResponse {
    /**
     * پاسخ موفق
     */
    static success(res, data, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * پاسخ موفق با صفحه‌بندی
     */
    static successWithPagination(res, data, pagination, message = 'Success') {
        return res.status(200).json({
            success: true,
            message,
            data,
            pagination: {
                currentPage: pagination.page,
                totalPages: pagination.totalPages,
                totalItems: pagination.totalItems,
                itemsPerPage: pagination.limit,
                hasNextPage: pagination.page < pagination.totalPages,
                hasPrevPage: pagination.page > 1
            },
            timestamp: new Date().toISOString()
        });
    }

    /**
     * پاسخ خطا
     */
    static error(res, message = 'Error occurred', statusCode = 500, errors = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString()
        };

        if (errors) {
            response.errors = errors;
        }

        return res.status(statusCode).json(response);
    }

    /**
     * پاسخ خطای اعتبارسنجی
     */
    static validationError(res, errors) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: errors.map(err => ({
                field: err.path || err.param,
                message: err.msg || err.message
            })),
            timestamp: new Date().toISOString()
        });
    }

    /**
     * پاسخ خطای احراز هویت
     */
    static unauthorized(res, message = 'Unauthorized access') {
        return res.status(401).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * پاسخ خطای دسترسی
     */
    static forbidden(res, message = 'Access forbidden') {
        return res.status(403).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * پاسخ Not Found
     */
    static notFound(res, message = 'Resource not found') {
        return res.status(404).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * پاسخ خطای سرور
     */
    static serverError(res, message = 'Internal server error') {
        return res.status(500).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = ApiResponse;