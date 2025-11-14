const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// این اسکیمای اصلی کاربر است (هم یوزر، هم ادمین)
// بر اساس مستندات، همه اکانت‌ها در کالکشن `users` ذخیره می‌شوند
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'نام الزامی است'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'ایمیل الزامی است'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'ایمیل نامعتبر است'],
    },

    password: {
      type: String,
      required: [true, 'رمز عبور الزامی است'],
      minlength: [6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'],
      select: false, // در کوئری‌ها به‌صورت پیش‌فرض برگردانده نشود
    },

    role: {
      type: String,
      enum: ['user', 'admin', 'manager', 'superadmin'],
      default: 'user',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Hash password قبل از ذخیره
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// متد مقایسه رمز عبور
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw new Error('خطا در بررسی رمز عبور')
  }
}

// حذف فیلد password در خروجی JSON
UserSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

// توجه: عمداً نام مدل را User انتخاب می‌کنیم تا از کالکشن `users` استفاده شود.
// فایل هنوز Admin.js است ولی هرجا require('../models/Admin') صدا زده شود،
// در واقع به مدل User (کالکشن users) وصل می‌شود.
module.exports = mongoose.model('User', UserSchema)

