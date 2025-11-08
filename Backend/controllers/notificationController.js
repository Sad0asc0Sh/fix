const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res, next) => {
    try {
        const {
            unreadOnly,
            type,
            page = 1,
            limit = 20
        } = req.query;

        const filter = { user: req.user.id };
        
        if (unreadOnly === 'true') filter.isRead = false;
        if (type) filter.type = type;

        const skip = (page - 1) * limit;

        const notifications = await Notification.find(filter)
            .sort('-createdAt')
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(filter);
        const unreadCount = await Notification.countDocuments({ 
            user: req.user.id, 
            isRead: false 
        });

        successResponse(res, {
            notifications,
            unreadCount,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get unread count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
exports.getUnreadCount = async (req, res, next) => {
    try {
        const count = await Notification.countDocuments({ 
            user: req.user.id, 
            isRead: false 
        });

        successResponse(res, { count });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single notification
 * @route   GET /api/notifications/:id
 * @access  Private
 */
exports.getNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!notification) {
            return errorResponse(res, 'اعلان یافت نشد', 404);
        }

        // خوانده شده علامت‌گذاری شود
        if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = Date.now();
            await notification.save();
        }

        successResponse(res, notification);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { isRead: true, readAt: Date.now() },
            { new: true }
        );

        if (!notification) {
            return errorResponse(res, 'اعلان یافت نشد', 404);
        }

        successResponse(res, notification, 'اعلان به عنوان خوانده شده علامت‌گذاری شد');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark all as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
exports.markAllAsRead = async (req, res, next) => {
    try {
        const result = await Notification.updateMany(
            { user: req.user.id, isRead: false },
            { isRead: true, readAt: Date.now() }
        );

        successResponse(res, {
            modifiedCount: result.modifiedCount
        }, 'همه اعلان‌ها به عنوان خوانده شده علامت‌گذاری شدند');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!notification) {
            return errorResponse(res, 'اعلان یافت نشد', 404);
        }

        successResponse(res, null, 'اعلان با موفقیت حذف شد');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete all notifications
 * @route   DELETE /api/notifications
 * @access  Private
 */
exports.deleteAllNotifications = async (req, res, next) => {
    try {
        const result = await Notification.deleteMany({ user: req.user.id });

        successResponse(res, {
            deletedCount: result.deletedCount
        }, 'همه اعلان‌ها حذف شدند');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete read notifications
 * @route   DELETE /api/notifications/read
 * @access  Private
 */
exports.deleteReadNotifications = async (req, res, next) => {
    try {
        const result = await Notification.deleteMany({ 
            user: req.user.id,
            isRead: true 
        });

        successResponse(res, {
            deletedCount: result.deletedCount
        }, 'اعلان‌های خوانده شده حذف شدند');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create notification (Admin)
 * @route   POST /api/notifications
 * @access  Private/Admin
 */
exports.createNotification = async (req, res, next) => {
    try {
        const {
            users, // آرایه از user IDs یا 'all'
            type,
            title,
            message,
            data,
            link,
            icon,
            color,
            priority
        } = req.body;

        let targetUsers = [];

        if (users === 'all') {
            // ارسال به همه کاربران
            const User = require('../models/User');
            const allUsers = await User.find({ isActive: true }).select('_id');
            targetUsers = allUsers.map(u => u._id);
        } else if (Array.isArray(users)) {
            targetUsers = users;
        } else {
            return errorResponse(res, 'لیست کاربران نامعتبر است', 400);
        }

        const notifications = targetUsers.map(userId => ({
            user: userId,
            type,
            title,
            message,
            data,
            link,
            icon,
            color,
            priority
        }));

        const result = await Notification.insertMany(notifications);

        successResponse(res, {
            count: result.length,
            notifications: result
        }, `${result.length} اعلان ایجاد شد`, 201);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get notification statistics (Admin)
 * @route   GET /api/notifications/stats
 * @access  Private/Admin
 */
exports.getNotificationStats = async (req, res, next) => {
    try {
        const stats = await Notification.aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    unread: [
                        { $match: { isRead: false } },
                        { $count: 'count' }
                    ],
                    byType: [
                        {
                            $group: {
                                _id: '$type',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    byPriority: [
                        {
                            $group: {
                                _id: '$priority',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    recentActivity: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 10 },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'user'
                            }
                        },
                        { $unwind: '$user' },
                        {
                            $project: {
                                title: 1,
                                type: 1,
                                isRead: 1,
                                createdAt: 1,
                                'user.name': 1,
                                'user.email': 1
                            }
                        }
                    ]
                }
            }
        ]);

        successResponse(res, {
            total: stats[0].total[0]?.count || 0,
            unread: stats[0].unread[0]?.count || 0,
            byType: stats[0].byType,
            byPriority: stats[0].byPriority,
            recentActivity: stats[0].recentActivity
        });
    } catch (error) {
        next(error);
    }
};