const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');
const {
  productValidator,
  mongoIdRule
} = require('../validators/productValidator');
const {
  uploadProductImages,
  handleMulterError
} = require('../middleware/upload');
const {
  getAdminProducts,
  createProduct,
  deleteProduct
} = require('../controllers/adminProductController');

// ======================================================
// Admin-only access control for every route in this file
// ======================================================
router.use(protect);
router.use(isAdmin);

router
  .route('/')
  .get(getAdminProducts)
  .post(
    uploadProductImages,
    handleMulterError,
    productValidator,
    createProduct
  );

router
  .route('/:id')
  .delete(
    mongoIdRule('id', 'Product ID'),
    deleteProduct
  );

module.exports = router;
