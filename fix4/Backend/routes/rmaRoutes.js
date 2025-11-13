const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');
const {
  requestRMA,
  getMyRMAs,
  getAllRMAs,
  getRMAById,
  updateRMAStatus,
} = require('../controllers/rmaController');

// All require authentication
router.use(protect);

// Create RMA request (user)
router.post('/', requestRMA);

// Current user's RMAs
router.get('/', getMyRMAs);

// Admin: list all RMAs
router.get('/admin/all', isAdmin, getAllRMAs);

// RMA detail (owner or admin)
router.get('/:id', getRMAById);

// Admin: update status
router.put('/:id/status', isAdmin, updateRMAStatus);

module.exports = router;

