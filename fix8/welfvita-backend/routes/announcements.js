const express = require('express')
const router = express.Router()
const {
  getActiveAnnouncement,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController')
const { protect, admin } = require('../middleware/auth')

// ============================================
// روت عمومی (برای فرانت‌اند سایت مشتری)
// ============================================
router.get('/active', getActiveAnnouncement)

// ============================================
// روت‌های ادمین (محافظت شده)
// ============================================
router.get('/admin', protect, admin, getAllAnnouncements)
router.post('/admin', protect, admin, createAnnouncement)
router.put('/admin/:id', protect, admin, updateAnnouncement)
router.delete('/admin/:id', protect, admin, deleteAnnouncement)

module.exports = router
