const express = require('express');
const router = express.Router();
const {
    getNotifications,
    getUnreadCount,
    getNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    deleteReadNotifications,
    createNotification,
    getNotificationStats
} = require('../controllers/notificationController');

const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { body, query } = require('express-validator');

// ======================================================
// Validation Rules
// ======================================================
const createNotificationValidation = [
    body('users')
        .notEmpty().withMessage('لیست کاربران الزامی است'),
    body('type')
        .notEmpty().withMessage('نوع اعلان الزامی است')
        .isIn(['order', 'payment', 'product', 'system', 'promotion', 'review', 'account'])
        .withMessage('نوع اعلان نامعتبر است'),
    body('title')
        .notEmpty().withMessage('عنوان اعلان الزامی است')
        .isLength({ max: 100 }).withMessage('عنوان نباید بیشتر از 100 کاراکتر باشد'),
    body('message')
        .notEmpty().withMessage('متن اعلان الزامی است')
        .isLength({ max: 500 }).withMessage('متن نباید بیشتر از 500 کاراکتر باشد')
];

// ======================================================
// Protected Routes (User)
// ======================================================
router.use(protect);

// Get user notifications
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark all as read
router.patch('/read-all', markAllAsRead);

// Delete all notifications
router.delete('/all', deleteAllNotifications);

// Delete read notifications
router.delete('/read', deleteReadNotifications);

// Get single notification
router.get('/:id', getNotification);

// Mark as read
router.patch('/:id/read', markAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// ======================================================
// Admin Routes
// ======================================================
router.use(authorize('admin'));

// Create notification
router.post('/', createNotificationValidation, validate, createNotification);

// Get statistics
router.get('/admin/stats', getNotificationStats);

module.exports = router;