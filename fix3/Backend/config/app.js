// config/app.js
// پیکربندی مرکزی پروژه ویلف‌ویتا (سازگار با تمام فایل‌های فعلی)

require('dotenv').config();

// Helpers
const toInt = (v, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
};
const toFloat = (v, def) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : def;
};
const toBool = (v, def) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(s)) return false;
  }
  return def;
};
const toList = (v, def = []) =>
  v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : def;

const config = {
  // تنظیمات کلی اپ
  app: {
    name: 'فروشگاه ویلف‌ویتا',
    env: process.env.NODE_ENV || 'development',
    port: toInt(process.env.PORT, 5000),
    baseUrl: process.env.API_URL || `http://localhost:${toInt(process.env.PORT, 5000)}`,
  },

  // Frontend (CORS)
  client: {
    urls: toList(process.env.CLIENT_URL, ['http://localhost:3000']),
  },

  // دیتابیس
  db: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/welfvita-store',
    minPoolSize: toInt(process.env.MIN_POOL_SIZE, 2),
    maxPoolSize: toInt(process.env.MAX_POOL_SIZE, 10),
  },

  // احراز هویت JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'change-me-refresh',
    accessTokenExpire: process.env.JWT_EXPIRE || '15m',
    refreshTokenExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
    cookieNames: {
      access: 'accessToken', // توجه: در کد فعلی، اکسس توکن در هدر ارسال می‌شود
      refresh: 'refreshToken', // در authController روی کوکی refreshToken ست می‌شود
    },
    issuer: 'welfvita-store',
    audience: 'welfvita-users',
  },

  // تنظیمات فروشگاه
  shop: {
    freeShippingThreshold: toInt(process.env.FREE_SHIPPING_THRESHOLD, 500000), // تومان
    shippingPrice: toInt(process.env.SHIPPING_PRICE, 50000), // تومان
    taxRate: toFloat(process.env.TAX_RATE, 0.09), // 9%
    currency: 'تومان',
    currencySymbol: '﷼',
    categories: ['قفل', 'دوربین', 'آلارم', 'گاوصندوق', 'سایر'], // مطابق مدل Product
  },

  // صفحه‌بندی
  pagination: {
    defaultLimit: toInt(process.env.PAGE_LIMIT_DEFAULT, 12),
    maxLimit: toInt(process.env.PAGE_LIMIT_MAX, 100),
    defaultPage: 1,
  },

  // آپلود (Cloudinary + Multer)
  upload: {
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
      secure: true,
      folders: {
        products: 'welfvita/products',
        avatars: 'welfvita/avatars',
        categories: 'welfvita/categories',
      },
    },
    maxFileSizeMB: toInt(process.env.UPLOAD_MAX_MB, 5),
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxImagesPerProduct: toInt(process.env.MAX_PRODUCT_IMAGES, 10),
  },

  // کش
  cache: {
    defaultDuration: toInt(process.env.CACHE_TTL, 300), // ثانیه
    productsDuration: toInt(process.env.CACHE_PRODUCTS_TTL, 600),
    categoriesDuration: toInt(process.env.CACHE_CATEGORIES_TTL, 1800),
    userProfileDuration: toInt(process.env.CACHE_PROFILE_TTL, 300),
    maxHeapMB: toInt(process.env.CACHE_MAX_HEAP_MB, 256),
  },

  // Rate Limiting (عمومی + Auth در روت‌ها)
  rateLimit: {
    api: {
      windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
      max: toInt(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
    },
    auth: {
      windowMs: toInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
      max: toInt(process.env.AUTH_RATE_LIMIT_MAX, 5),
    },
  },

  // امنیت
  security: {
    helmet: {
      enableCSP: toBool(process.env.HELMET_CSP, process.env.NODE_ENV === 'production'),
    },
    bcryptSaltRounds: toInt(process.env.BCRYPT_SALT_ROUNDS, 12),
    passwordMinLength: toInt(process.env.PASSWORD_MIN_LENGTH, 6),
    passwordMaxLength: toInt(process.env.PASSWORD_MAX_LENGTH, 128),
    maxLoginAttempts: toInt(process.env.MAX_LOGIN_ATTEMPTS, 5),
    lockoutDurationMs: toInt(process.env.LOGIN_LOCK_TIME, 15 * 60 * 1000), // 15 دقیقه
  },

  // ایمیل (SMTP)
  mail: {
    host: process.env.EMAIL_HOST || '',
    port: toInt(process.env.EMAIL_PORT, 587),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    fromName: process.env.EMAIL_FROM_NAME || 'فروشگاه ویلف‌ویتا',
    fromEmail: process.env.EMAIL_FROM_EMAIL || process.env.EMAIL_USER || '',
    secure: toBool(process.env.EMAIL_SECURE, false),
  },

  // پرداخت (نمونه زرین‌پال)
  payment: {
    zarinpal: {
      merchantId: process.env.ZARINPAL_MERCHANT_ID || '',
      sandbox: toBool(process.env.ZARINPAL_SANDBOX, true),
      callbackURL:
        process.env.ZARINPAL_CALLBACK_URL ||
        `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/callback`,
    },
  },

  // لاگ
  logs: {
    level: process.env.LOG_LEVEL || 'info',
    toFile: toBool(process.env.LOG_TO_FILE, true),
  },

  // پیام‌های عمومی (برای استفاده در پاسخ‌ها)
  messages: {
    serverError: 'خطای سرور - لطفاً بعداً تلاش کنید',
    unauthorized: 'لطفاً وارد حساب کاربری خود شوید',
    forbidden: 'شما دسترسی به این بخش را ندارید',
    notFound: 'منبع مورد نظر یافت نشد',
    validationError: 'داده‌های ورودی نامعتبر است',
    success: 'عملیات با موفقیت انجام شد',
  },

  // وضعیت‌های سفارش (سازگار با مدل Order)
  orderStatuses: {
    pending: 'در انتظار پرداخت',
    processing: 'در حال پردازش',
    confirmed: 'تایید شده',
    shipped: 'ارسال شده',
    delivered: 'تحویل داده شده',
    cancelled: 'لغو شده',
    failed: 'ناموفق',
    refunded: 'مرجوع شده',
  },

  // نقش‌ها (سازگار با User Schema و authorize)
  userRoles: {
    user: 'user',
    admin: 'admin',
    manager: 'manager',
    superadmin: 'superadmin',
  },
};

module.exports = Object.freeze(config);