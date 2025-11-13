const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');
const ctrl = require('../controllers/blogController');

// Public
router.get('/', ctrl.listCategories);
router.get('/:idOrSlug', ctrl.getCategory);

// Admin
router.post('/', protect, isAdmin, ctrl.createCategory);
router.put('/:id', protect, isAdmin, ctrl.updateCategory);
router.delete('/:id', protect, isAdmin, ctrl.deleteCategory);

module.exports = router;

