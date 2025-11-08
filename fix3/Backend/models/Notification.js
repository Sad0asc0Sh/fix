const mongoose = require('mongoose');

/**
 * ====================================
 * Notification Schema - Welfvita
 * ====================================
 */
const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: {
      values: ['order', 'payment', 'product', 'promotion', 'system', 'review'],
      message: 'نوع اعلان نامعتبر است'
    },
    index: true
  },
  title: {
    type: String,
    required: [true, 'عنوان اعلان الزامی است'],
    trim: true,
    maxlength: [100, 'عنوان نمی‌تواند بیش از 100 کاراکتر باشد']
  },
  message: {
    type: String,
    required: [true, 'متن اعلان الزامی است'],
    trim: true,
    maxlength: [500, 'متن نمی‌تواند بیش از 500 کاراکتر باشد']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  link: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    default: 'bell',
    trim: true
  },
  color: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'primary'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
});

// ======================================================
// Indexes
// ======================================================
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ======================================================
// Instance Methods
// ======================================================

/**
 * علامت‌گذاری به عنوان خوانده شده
 */
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = Date.now();
  return await this.save();
};

// ======================================================
// Static Methods
// ======================================================

/**
 * دریافت اعلان‌های خوانده نشده کاربر
 */
notificationSchema.statics.getUnread = function(userId) {
  return this.find({ user: userId, isRead: false }).sort('-createdAt');
};

/**
 * علامت‌گذاری همه به عنوان خوانده شده
 */
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: Date.now() }
  );
};

/**
 * حذف اعلان‌های قدیمی (بیش از 30 روز)
 */
notificationSchema.statics.deleteOld = async function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
};

// ======================================================
// Export Model
// ======================================================
module.exports = mongoose.model('Notification', notificationSchema);