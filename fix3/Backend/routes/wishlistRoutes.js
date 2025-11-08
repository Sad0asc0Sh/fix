const express = require('express');
const router = express.Router();
const {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    checkInWishlist,
    updateNote,
    updatePriority,
    clearWishlist,
    moveToCart
} = require('../controllers/wishlistController');

const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { body, param } = require('express-validator');

// ======================================================
// Validation Rules
// ======================================================
const addToWishlistValidation = [
    body('productId')
        .notEmpty().withMessage('شناسه محصول الزامی است')
        .isMongoId().withMessage('شناسه محصول نامعتبر است'),
    body('note')
        .optional()
        .isLength({ max: 200 }).withMessage('یادداشت نباید بیشتر از 200 کاراکتر باشد'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high']).withMessage('اولویت نامعتبر است')
];

const updateNoteValidation = [
    body('note')
        .optional()
        .isLength({ max: 200 }).withMessage('یادداشت نباید بیشتر از 200 کاراکتر باشد')
];

const updatePriorityValidation = [
    body('priority')
        .notEmpty().withMessage('اولویت الزامی است')
        .isIn(['low', 'medium', 'high']).withMessage('اولویت نامعتبر است')
];

const productIdValidation = [
    param('productId')
        .isMongoId().withMessage('شناسه محصول نامعتبر است')
];

// ======================================================
// All routes require authentication
// ======================================================
router.use(protect);

// Get wishlist
router.get('/', getWishlist);

// Add to wishlist
router.post('/', addToWishlistValidation, validate, addToWishlist);

// Clear wishlist
router.delete('/clear', clearWishlist);

// Toggle product
router.post('/toggle/:productId', productIdValidation, validate, toggleWishlist);

// Check if in wishlist
router.get('/check/:productId', productIdValidation, validate, checkInWishlist);

// Remove from wishlist
router.delete('/:productId', productIdValidation, validate, removeFromWishlist);

// Update note
router.patch('/:productId/note', productIdValidation, updateNoteValidation, validate, updateNote);

// Update priority
router.patch('/:productId/priority', productIdValidation, updatePriorityValidation, validate, updatePriority);

// Move to cart
router.post('/:productId/move-to-cart', productIdValidation, validate, moveToCart);

module.exports = router;