const mongoose = require('mongoose')
const Admin = require('./models/Admin')
require('dotenv').config()

// اتصال به MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/welfvita', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB متصل شد'))
  .catch(err => {
    console.error('❌ خطا در اتصال به MongoDB:', err)
    process.exit(1)
  })

// ساخت ادمین اولیه
const seedAdmin = async () => {
  try {
    // بررسی وجود ادمین
    const existingAdmin = await Admin.findOne({ email: 'admin@welfvita.com' })

    if (existingAdmin) {
      console.log('⚠️  ادمین پیش‌فرض از قبل موجود است')
      console.log('📧 Email:', existingAdmin.email)
      console.log('🔑 Password: admin123')
      process.exit(0)
    }

    // ساخت ادمین جدید
    const admin = await Admin.create({
      name: 'مدیر سیستم',
      email: 'admin@welfvita.com',
      password: 'admin123',
      role: 'superadmin'
    })

    console.log('╔════════════════════════════════════════╗')
    console.log('║     ادمین پیش‌فرض ایجاد شد            ║')
    console.log('╚════════════════════════════════════════╝')
    console.log('✅ ادمین با موفقیت ایجاد شد!')
    console.log('')
    console.log('📧 Email: admin@welfvita.com')
    console.log('🔑 Password: admin123')
    console.log('')
    console.log('⚠️  توصیه: رمز عبور را بعد از اولین ورود تغییر دهید')
    console.log('═══════════════════════════════════════════')

    process.exit(0)
  } catch (error) {
    console.error('❌ خطا در ساخت ادمین:', error)
    process.exit(1)
  }
}

// اجرا
seedAdmin()
