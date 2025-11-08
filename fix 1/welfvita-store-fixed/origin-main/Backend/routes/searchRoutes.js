const express = require('express');
const router = express.Router();
const SearchEngine = require('../utils/searchEngine');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Advanced product search
 * @route   GET /api/search
 * @access  Public
 */
router.get('/', async (req, res, next) => {
    try {
        const {
            keyword,
            category,
            minPrice,
            maxPrice,
            brands,
            rating,
            discount,
            inStock,
            featured,
            tags,
            sort = 'newest',
            page = 1,
            limit = 12
        } = req.query;

        const search = new SearchEngine();

        search
            .search(keyword)
            .priceFilter(minPrice, maxPrice)
            .brandFilter(brands)
            .ratingFilter(rating)
            .discountFilter(discount)
            .inStockOnly(inStock)
            .featuredFilter(featured)
            .tagFilter(tags)
            .sort(sort)
            .paginate(page, limit);

        if (category) {
            await search.categoryFilter(category);
        }

        const result = await search.execute();

        successResponse(res, result);
    } catch (error) {
        next(error);
    }
});

/**
 * @desc    Get available filters
 * @route   GET /api/search/filters
 * @access  Public
 */
router.get('/filters', async (req, res, next) => {
    try {
        const { keyword, category } = req.query;

        const search = new SearchEngine();

        if (keyword) search.search(keyword);
        if (category) await search.categoryFilter(category);

        const filters = await search.getAvailableFilters();

        successResponse(res, filters);
    } catch (error) {
        next(error);
    }
});

/**
 * @desc    Search suggestions (autocomplete)
 * @route   GET /api/search/suggestions
 * @access  Public
 */
router.get('/suggestions', async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return successResponse(res, []);
        }

        const Product = require('../models/Product');

        const suggestions = await Product.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { brand: { $regex: q, $options: 'i' } },
                { tags: { $in: [new RegExp(q, 'i')] } }
            ],
            isActive: true
        })
        .select('name slug images price')
        .limit(10);

        successResponse(res, suggestions);
    } catch (error) {
        next(error);
    }
});

module.exports = router;