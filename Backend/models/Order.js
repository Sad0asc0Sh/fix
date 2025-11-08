const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * ====================================
 * Order Schema - ویلف‌ویتا
 * ====================================
 */
const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'نام محصول الزامی است'], trim: true },
    qty: { type: Number, required: [true, 'تعداد الزامی است'], min: [1, 'تعداد باید حداقل 1 باشد'] },
    image: { type: String, required: [true, 'تصویر محصول الزامی است'] },
    price: { type: Number, required: [true, 'قیمت الزامی است'], min: [0, 'قیمت نمی‌تواند منفی باشد'] }, // قیمت واحد در لحظه سفارش
    discount: { type: Number, default: 0, min: [0, 'تخفیف نمی‌تواند منفی باشد'] }, // برای سازگاری قدیمی
    discountPercent: { type: Number, default: 0, min: [0, 'درصد تخفیف نمی‌تواند منفی باشد'], max: 100 }, // برای سازگاری جدید
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: [true, 'شناسه محصول الزامی است'] },
    // برای سازگاری با هر دو ساختار (name/value) و (color/size/sku)
    variant: {
      name: String,
      value: String,
      color: String,
      size: String,
      sku: String,
      priceModifier: Number
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // --- شناسه‌ها و اطلاعات اصلی ---
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'شناسه کاربر الزامی است'],
      index: true
    },
    orderNumber: { type: String, required: true, unique: true, uppercase: true, index: true },

    // --- محصولات سفارش ---
    orderItems: {
      type: [orderItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'لیست آیتم‌های سفارش نمی‌تواند خالی باشد'
      }
    },

    // --- آدرس و اطلاعات تحویل ---
    shippingAddress: {
      fullName: { type: String, required: [true, 'نام گیرنده الزامی است'], trim: true },
      address: { type: String, required: [true, 'آدرس الزامی است'], minlength: [10, 'آدرس باید حداقل 10 کاراکتر باشد'] },
      city: { type: String, required: [true, 'شهر الزامی است'], trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, required: [true, 'کد پستی الزامی است'], match: [/^\d{10}$/, 'کد پستی باید 10 رقم باشد'] },
      country: { type: String, required: [true, 'کشور الزامی است'], default: 'ایران' },
      phone: { type: String, required: [true, 'شماره تلفن الزامی است'], match: [/^09\d{9}$/, 'شماره تلفن معتبر نیست'] },
      email: { type: String, lowercase: true, trim: true },
      notes: { type: String, maxlength: [500, 'یادداشت تحویل خیلی طولانی است'] }
    },

    // --- هزینه‌ها و قیمت‌ها ---
    itemsPrice: { type: Number, required: true, default: 0, min: [0, 'قیمت منفی مجاز نیست'] },
    shippingPrice: { type: Number, required: true, default: 0, min: [0, 'قیمت منفی مجاز نیست'] },
    taxPrice: { type: Number, required: true, default: 0, min: [0, 'قیمت منفی مجاز نیست'] },
    discountAmount: { type: Number, default: 0, min: [0, 'قیمت منفی مجاز نیست'] },
    totalPrice: { type: Number, required: true, default: 0, min: [0, 'قیمت منفی مجاز نیست'] },

    // --- کد تخفیف (سازگار با رشته یا آبجکت) ---
    couponCode: { type: mongoose.Schema.Types.Mixed, default: null },

    // --- اطلاعات پرداخت ---
    paymentMethod: {
      type: String,
      required: [true, 'روش پرداخت الزامی است'],
      enum: { values: ['online', 'cod', 'wallet'], message: 'روش پرداخت نامعتبر است' }
    },
    paymentResult: {
      id: String,
      authority: String,
      status: String,
      refId: String,
      cardPan: String,
      update_time: String,
      gatewayResponse: mongoose.Schema.Types.Mixed
    },
    isPaid: { type: Boolean, default: false, index: true },
    paidAt: Date,

    // --- وضعیت و تاریخچه ---
    status: {
      type: String,
      required: true,
      enum: {
        values: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded'],
        message: 'وضعیت نامعتبر: {VALUE}'
      },
      default: 'pending',
      index: true
    },
    statusHistory: [
      {
        _id: false,
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: { type: String, maxlength: 500 },
        isSystemGenerated: { type: Boolean, default: false }
      }
    ],

    // --- تحویل ---
    isDelivered: { type: Boolean, default: false, index: true },
    deliveredAt: Date,
    expectedDeliveryDate: Date,

    // --- ردیابی مرسوله ---
    trackingInfo: {
      carrier: String,
      trackingNumber: String,
      url: String,
      lastUpdate: Date,
      currentLocation: String
    },

    // --- لغو و بازگشت ---
    cancellationDetails: {
      cancelledBy: { type: String, enum: ['user', 'admin', 'system'] },
      reason: { type: String, maxlength: 500 },
      cancelledAt: Date,
      refundStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed'] },
      refundAmount: Number,
      refundedAt: Date,
      refundTransactionId: String
    },

    // --- یادداشت‌های داخلی ادمین ---
    adminNotes: [
      {
        _id: false,
        note: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
      }
    ],

    // --- اولویت و منبع ---
    priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
    source: { type: String, enum: ['web', 'mobile', 'admin'], default: 'web' }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ======================================================
// Indexes
// ======================================================
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ paymentMethod: 1, isPaid: 1 });
orderSchema.index({ createdAt: -1 });

// ======================================================
// Virtual Fields
// ======================================================
orderSchema.virtual('canBeCancelled').get(function () {
  return ['pending', 'processing', 'confirmed'].includes(this.status) && !this.isPaid;
});
orderSchema.virtual('canBeRefunded').get(function () {
  return this.isPaid && ['delivered', 'shipped'].includes(this.status) && this.status !== 'refunded';
});
orderSchema.virtual('statusPersian').get(function () {
  const statusMap = {
    pending: 'در انتظار پرداخت',
    processing: 'در حال پردازش',
    confirmed: 'تایید شده',
    shipped: 'ارسال شده',
    delivered: 'تحویل داده شده',
    cancelled: 'لغو شده',
    failed: 'ناموفق',
    refunded: 'مرجوع شده'
  };
  return statusMap[this.status] || this.status;
});

// ======================================================
// Hooks (Middleware)
// ======================================================
// تولید شماره سفارش یکتا
orderSchema.pre('save', function (next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.orderNumber = `WF${year}${month}${day}${random}`;
  }
  next();
});

// ثبت تاریخچه وضعیت + تنظیم فیلدهای مرتبط
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: Date.now(),
      isSystemGenerated: !this._userPerformingUpdate,
      updatedBy: this._userPerformingUpdate === 'system' ? undefined : this._userPerformingUpdate,
      note: this._updateNote
    });

    if (this.status === 'delivered') {
      this.isDelivered = true;
      this.deliveredAt = this.deliveredAt || Date.now();
    }

    if (this.status === 'cancelled') {
      this.cancellationDetails = this.cancellationDetails || {};
      if (!this.cancellationDetails.cancelledAt) {
        this.cancellationDetails.cancelledAt = Date.now();
      }
    }
  }

  // پاکسازی فیلدهای موقت
  this._userPerformingUpdate = undefined;
  this._updateNote = undefined;
  next();
});

// محاسبه خودکار totalPrice
orderSchema.pre('save', function (next) {
  if (
    this.isNew ||
    this.isModified('itemsPrice') ||
    this.isModified('shippingPrice') ||
    this.isModified('taxPrice') ||
    this.isModified('discountAmount')
  ) {
    this.totalPrice = (this.itemsPrice || 0) + (this.shippingPrice || 0) + (this.taxPrice || 0) - (this.discountAmount || 0);
    if (this.totalPrice < 0) this.totalPrice = 0;
  }
  next();
});

// ======================================================
// Instance Methods
// ======================================================
orderSchema.methods.markAsPaid = async function (paymentResult) {
  this.isPaid = true;
  this.paidAt = Date.now();
  this.paymentResult = paymentResult;
  if (this.status === 'pending') {
    this.status = 'processing';
    this._userPerformingUpdate = 'system';
  }
  return await this.save();
};

orderSchema.methods.cancelOrder = async function (cancelledBy, reason, userId) {
  if (!this.canBeCancelled) throw new Error('این سفارش قابل لغو نیست');
  this.status = 'cancelled';
  this.cancellationDetails = {
    cancelledBy,
    reason: reason || 'لغو توسط کاربر',
    cancelledAt: Date.now()
  };
  this._userPerformingUpdate = userId;
  return await this.save();
};

orderSchema.methods.addAdminNote = async function (note, adminUserId) {
  this.adminNotes.push({ note, addedBy: adminUserId, addedAt: Date.now() });
  return await this.save();
};

orderSchema.methods.updateStatus = async function (newStatus, userId, note) {
  this.status = newStatus;
  this._userPerformingUpdate = userId || 'system';
  this._updateNote = note;
  return await this.save();
};

// ======================================================
// Static Methods
// ======================================================
orderSchema.statics.findByOrderNumber = function (orderNumber) {
  return this.findOne({ orderNumber: String(orderNumber).toUpperCase() });
};

orderSchema.statics.getStats = async function (startDate, endDate) {
  const match = {};
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalPrice' },
        paidCount: { $sum: { $cond: [{ $eq: ['$isPaid', true] }, 1, 0] } },
        paidAmount: { $sum: { $cond: [{ $eq: ['$isPaid', true] }, '$totalPrice', 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return stats;
};

orderSchema.statics.getTotalRevenue = async function () {
  const res = await this.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);
  return res[0]?.total || 0;
};

// ======================================================
// Export Model
// ======================================================
module.exports = mongoose.model('Order', orderSchema);