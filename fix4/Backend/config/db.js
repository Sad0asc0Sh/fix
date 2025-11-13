const mongoose = require('mongoose');

/**
 * اتصال به MongoDB با قابلیت‌های پیشرفته
 * - Retry logic برای اتصال (توسط Mongoose مدیریت می‌شود)
 * - Connection pooling قابل تنظیم
 * - Event handling برای مانیتورینگ
 * - محیط‌های مختلف (dev/production)
 * - Graceful shutdown
 */

// مقادیر پیش‌فرض برای Pool (قابل override با .env)
const MIN_POOL_SIZE = parseInt(process.env.MIN_POOL_SIZE || '2');
const MAX_POOL_SIZE = parseInt(process.env.MAX_POOL_SIZE || '10');

const connectDB = async () => {
  try {
    // تنظیمات اتصال
    const options = {
      minPoolSize: MIN_POOL_SIZE,
      maxPoolSize: MAX_POOL_SIZE,
      socketTimeoutMS: 45000, // زمان انتظار برای عملیات سوکت
      serverSelectionTimeoutMS: 5000, // زمان انتظار برای انتخاب سرور
      family: 4, // استفاده از IPv4 (در صورت بروز مشکل با IPv6)
    };

    // برای سازگاری با Mongoose 7+ و جلوگیری از هشدارها
    mongoose.set('strictQuery', true);

    // اتصال به MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`✅ MongoDB متصل شد: ${conn.connection.host}`);
    console.log(`📊 دیتابیس: ${conn.connection.name}`);
    console.log(`🏊‍♂️ Connection Pool: [${options.minPoolSize}-${options.maxPoolSize}]`);

    // فعال کردن لاگ کوئری‌ها در حالت توسعه
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', (collectionName, method, query, doc) => {
         // لاگ کردن کوئری‌ها به شکل خواناتر
         console.log(`🔍 Mongoose: ${collectionName}.${method}(${JSON.stringify(query)})`);
      });
      console.log('🔍 Mongoose Debug Mode: ON');
    }

  } catch (error) {
    console.error('❌ خطا در اتصال به MongoDB:', error.message);
    // جزئیات بیشتر خطا (فقط برای لاگ سرور، نه کاربر)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Details:', error);
    }
    process.exit(1); // خروج از برنامه در صورت عدم اتصال
  }
};

/**
 * Event listeners (شنونده‌های رویداد) برای مانیتورینگ اتصال
 */
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose دوباره به MongoDB متصل شد');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ خطای اتصال Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Mongoose از MongoDB قطع شد');
});
mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose دوباره متصل شد');
});
mongoose.connection.on('close', () => {
  console.log('🚪 اتصال Mongoose به MongoDB بسته شد');
});


// Graceful shutdown در فایل server.js مدیریت می‌شود
// نیازی به process.on('SIGINT') در اینجا نیست چون در server.js هندل می‌شود


module.exports = connectDB;