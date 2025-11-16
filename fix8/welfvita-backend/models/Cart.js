const mongoose = require('mongoose')

// ============================================
// Schema برای آیتم‌های سبد خرید
// ============================================
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  // برای محصولات متغیر - گزینه‌های انتخاب‌شده
  variantOptions: [
    {
      name: {
        type: String,
        trim: true,
      },
      value: {
        type: String,
        trim: true,
      },
    },
  ],
  // تصویر محصول (کپی از زمان افزودن به سبد)
  image: {
    type: String,
  },
})

// ============================================
// Schema اصلی سبد خرید (Cart)
// ============================================
const cartSchema = new mongoose.Schema(
  {
    // کاربر صاحب سبد
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // هر کاربر فقط یک سبد فعال دارد
      index: true,
    },

    // آیتم‌های سبد
    items: [cartItemSchema],

    // وضعیت سبد
    status: {
      type: String,
      enum: ['active', 'converted', 'abandoned'],
      default: 'active',
      index: true,
    },

    // کد تخفیف اعمال شده (اختیاری)
    couponCode: {
      type: String,
      trim: true,
    },

    // مجموع قیمت
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    // timestamps اهمیت حیاتی دارد
    // updatedAt به ما می‌گوید آخرین بار کاربر چه زمانی سبد را تغییر داده است
    timestamps: true,
  },
)

// Index ترکیبی برای پیدا کردن سبدهای رها شده
cartSchema.index({ status: 1, updatedAt: -1 })

// متد برای محاسبه مجموع قیمت
cartSchema.methods.calculateTotal = function () {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + item.price * item.quantity
  }, 0)
  return this.totalPrice
}

module.exports = mongoose.model('Cart', cartSchema)
