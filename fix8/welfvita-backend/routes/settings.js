const express = require('express')
const router = express.Router()
const { getSettings, updateSettings } = require('../controllers/settingsController')
const { protect, authorize } = require('../middleware/auth')

// Get current settings
router.get('/', protect, authorize('admin', 'manager', 'superadmin'), getSettings)

// Update settings
router.put('/', protect, authorize('admin', 'manager', 'superadmin'), updateSettings)

module.exports = router

