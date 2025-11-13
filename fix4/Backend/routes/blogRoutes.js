const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');
const ctrl = require('../controllers/blogController');

// Public blog post routes
router.get('/', ctrl.listPosts);
router.get('/:idOrSlug', ctrl.getPost);

// Admin blog post routes
router.post('/', protect, isAdmin, ctrl.createPost);
router.put('/:id', protect, isAdmin, ctrl.updatePost);
router.delete('/:id', protect, isAdmin, ctrl.deletePost);

module.exports = router;

