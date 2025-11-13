const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');
const ctrl = require('../controllers/bannerController');

// All routes admin-protected
router.use(protect);
router.use(isAdmin);

router.get('/', ctrl.listBanners);
router.get('/:id', ctrl.getBanner);
router.post('/', ctrl.createBanner);
router.put('/:id', ctrl.updateBanner);
router.delete('/:id', ctrl.deleteBanner);

module.exports = router;

