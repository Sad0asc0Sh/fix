const express = require('express');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');
const {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} = require('../controllers/brandController');

const router = express.Router();

// All routes protected for admin
router.use(protect, isAdmin);

router.route('/')
  .get(getAllBrands)
  .post(createBrand);

router.route('/:id')
  .get(getBrandById)
  .put(updateBrand)
  .delete(deleteBrand);

module.exports = router;

