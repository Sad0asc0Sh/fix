const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');
const ctrl = require('../controllers/pageController');

// Public
router.get('/slug/:slug', ctrl.getPageBySlug);

// Admin
router.get('/', protect, isAdmin, ctrl.listPages);
router.get('/:id', protect, isAdmin, ctrl.getPage);
router.post('/', protect, isAdmin, ctrl.createPage);
router.put('/:id', protect, isAdmin, ctrl.updatePage);
router.delete('/:id', protect, isAdmin, ctrl.deletePage);

module.exports = router;

