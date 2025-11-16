const express = require('express')
const router = express.Router()

const {
  getAllAdmins,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} = require('../controllers/adminManagementController')
const { protect, authorize } = require('../middleware/auth')

const superAdminOnly = authorize('superadmin')

router.get('/', protect, superAdminOnly, getAllAdmins)
router.post('/', protect, superAdminOnly, createAdminUser)
router.put('/:id', protect, superAdminOnly, updateAdminUser)
router.delete('/:id', protect, superAdminOnly, deleteAdminUser)

module.exports = router

