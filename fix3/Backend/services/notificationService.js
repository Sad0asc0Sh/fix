const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * ====================================
 * Notification Service - Welfvita
 * سرویس مدیریت اعلان‌ها
 * ====================================
 */
class NotificationService {
  /**
   * ایجاد اعلان برای یک کاربر
   */
  async create(userId, type, title, message, options = {}) {
    try {
      const notification = await Notification.create({
        user: userId,
        type,
        title,
        message,
        data: options.data || null,
        link: options.link || null,
        icon: options.icon || 'bell',
        color: options.color || 'info',
        priority: options.priority || 'medium',
        expiresAt: options.expiresAt || null
      });

      // ارسال به Socket.io (real-time)
      if (global.io) {
        global.io.to(`user_${userId}`).emit('notification', notification);
      }

      return notification;
    } catch (error) {
      console.error('خطا در ایجاد اعلان:', error);
      throw error;
    }
  }

  /**
   * ایجاد اعلان برای چند کاربر (Bulk)
   */
  async createBulk(userIds, type, title, message, options = {}) {
    try {
      const notifications = userIds.map(userId => ({
        user: userId,
        type,
        title,
        message,
        data: options.data || null,
        link: options.link || null,
        icon: options.icon || 'bell',
        color: options.color || 'info',
        priority: options.priority || 'medium',
        expiresAt: options.expiresAt || null
      }));

      const result = await Notification.insertMany(notifications);

      // ارسال real-time به همه کاربران
      if (global.io) {
        userIds.forEach(userId => {
          const userNotification = result.find(n => n.user.toString() === userId.toString());
          if (userNotification) {
            global.io.to(`user_${userId}`).emit('notification', userNotification);
          }
        });
      }

      return result;
    } catch (error) {
      console.error('خطا در ایجاد اعلان‌های گروهی:', error);
      throw error;
    }
  }

  /**
   * اعلان به همه کاربران فعال
   */
  async createForAllUsers(type, title, message, options = {}) {
    try {
      const users = await User.find({ isActive: true }).select('_id');
      const userIds = users.map(user => user._id);

      return await this.createBulk(userIds, type, title, message, options);
    } catch (error) {
      console.error('خطا در ارسال اعلان به همه کاربران:', error);
      throw error;
    }
  }

  /**
   * دریافت اعلان‌های کاربر
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        unreadOnly = false,
        type = null,
        priority = null,
        limit = 20,
        page = 1
      } = options;

      const filter = { user: userId };
      
      if (unreadOnly) filter.isRead = false;
      if (type) filter.type = type;
      if (priority) filter.priority = priority;

      const skip = (page - 1) * limit;

      const notifications = await Notification.find(filter)
        .sort('-createdAt')
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments(filter);
      const unreadCount = await Notification.countDocuments({
        user: userId,
        isRead: false
      });

      return {
        notifications,
        total,
        unreadCount,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('خطا در دریافت اعلان‌ها:', error);
      throw error;
    }
  }

  /**
   * علامت‌گذاری به عنوان خوانده شده
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { isRead: true, readAt: Date.now() },
        { new: true }
      );

      if (!notification) {
        throw new Error('اعلان یافت نشد');
      }

      // ارسال به‌روزرسانی real-time
      if (global.io) {
        global.io.to(`user_${userId}`).emit('notification:read', {
          notificationId,
          unreadCount: await this.getUnreadCount(userId)
        });
      }

      return notification;
    } catch (error) {
      console.error('خطا در علامت‌گذاری اعلان:', error);
      throw error;
    }
  }

  /**
   * علامت‌گذاری همه به عنوان خوانده شده
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { user: userId, isRead: false },
        { isRead: true, readAt: Date.now() }
      );

      // ارسال به‌روزرسانی real-time
      if (global.io) {
        global.io.to(`user_${userId}`).emit('notification:read-all', {
          count: result.modifiedCount
        });
      }

      return result;
    } catch (error) {
      console.error('خطا در علامت‌گذاری همه اعلان‌ها:', error);
      throw error;
    }
  }

  /**
   * حذف اعلان
   */
  async delete(notificationId, userId) {
    try {
      const result = await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId
      });

      if (!result) {
        throw new Error('اعلان یافت نشد');
      }

      return result;
    } catch (error) {
      console.error('خطا در حذف اعلان:', error);
      throw error;
    }
  }

  /**
   * حذف همه اعلان‌های خوانده شده
   */
  async deleteAllRead(userId) {
    try {
      const result = await Notification.deleteMany({
        user: userId,
        isRead: true
      });

      return result;
    } catch (error) {
      console.error('خطا در حذف اعلان‌های خوانده شده:', error);
      throw error;
    }
  }

  /**
   * تعداد اعلان‌های خوانده نشده
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        user: userId,
        isRead: false
      });

      return count;
    } catch (error) {
      console.error('خطا در شمارش اعلان‌ها:', error);
      throw error;
    }
  }

  /**
   * حذف اعلان‌های منقضی شده (Cron Job)
   */
  async deleteExpired() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: Date.now(), $ne: null }
      });

      console.log(`✅ ${result.deletedCount} اعلان منقضی شده حذف شد`);
      return result;
    } catch (error) {
      console.error('خطا در حذف اعلان‌های منقضی:', error);
      throw error;
    }
  }

  /**
   * آمار اعلان‌های کاربر
   */
  async getUserStats(userId) {
    try {
      const total = await Notification.countDocuments({ user: userId });
      const unread = await Notification.countDocuments({
        user: userId,
        isRead: false
      });
      const read = total - unread;

      // آمار بر اساس نوع
      const byType = await Notification.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            unreadCount: {
              $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
            }
          }
        }
      ]);

      return {
        total,
        read,
        unread,
        byType
      };
    } catch (error) {
      console.error('خطا در دریافت آمار:', error);
      throw error;
    }
  }

  /**
   * ====================================
   * متدهای کاربردی برای انواع اعلان‌ها
   * ====================================
   */

  /**
   * اعلان سفارش جدید
   */
  async notifyNewOrder(userId, order) {
    return await this.create(
      userId,
      'order',
      'سفارش جدید ثبت شد',
      `سفارش شما با شماره ${order.orderNumber} ثبت شد`,
      {
        data: { orderId: order._id },
        link: `/orders/${order._id}`,
        icon: 'shopping-bag',
        color: 'success',
        priority: 'high'
      }
    );
  }

  /**
   * اعلان تغییر وضعیت سفارش
   */
  async notifyOrderStatusChange(userId, order, newStatus) {
    const statusMessages = {
      processing: 'در حال پردازش',
      confirmed: 'تایید شد',
      shipped: 'ارسال شد',
      delivered: 'تحویل داده شد',
      cancelled: 'لغو شد'
    };

    return await this.create(
      userId,
      'order',
      'تغییر وضعیت سفارش',
      `سفارش ${order.orderNumber} ${statusMessages[newStatus]}`,
      {
        data: { orderId: order._id, status: newStatus },
        link: `/orders/${order._id}`,
        icon: 'truck',
        color: 'info',
        priority: 'high'
      }
    );
  }

  /**
   * اعلان پرداخت موفق
   */
  async notifyPaymentSuccess(userId, order) {
    return await this.create(
      userId,
      'payment',
      'پرداخت موفق',
      `پرداخت سفارش ${order.orderNumber} با موفقیت انجام شد`,
      {
        data: { orderId: order._id },
        link: `/orders/${order._id}`,
        icon: 'check-circle',
        color: 'success',
        priority: 'high'
      }
    );
  }

  /**
   * اعلان موجودی محصول
   */
  async notifyProductInStock(userId, product) {
    return await this.create(
      userId,
      'product',
      'محصول موجود شد',
      `محصول ${product.name} اکنون موجود است`,
      {
        data: { productId: product._id },
        link: `/products/${product.slug}`,
        icon: 'package',
        color: 'success',
        priority: 'medium'
      }
    );
  }

  /**
   * اعلان تخفیف ویژه
   */
  async notifySpecialDiscount(userId, discount) {
    return await this.create(
      userId,
      'promotion',
      'تخفیف ویژه!',
      discount.message,
      {
        data: { discountId: discount._id },
        link: discount.link || '/products',
        icon: 'gift',
        color: 'warning',
        priority: 'medium',
        expiresAt: discount.expiresAt
      }
    );
  }

  /**
   * اعلان خوش‌آمدگویی
   */
  async notifyWelcome(userId) {
    return await this.create(
      userId,
      'system',
      'خوش آمدید به Welfvita!',
      'از اینکه ما را انتخاب کردید سپاسگزاریم',
      {
        link: '/profile',
        icon: 'smile',
        color: 'success',
        priority: 'low'
      }
    );
  }
}

module.exports = new NotificationService();