const express = require('express');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const client = require('prom-client');
require('dotenv').config();

// --- فایل‌های ما ---
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const apiRoutes = require('./routes/index');
const {
    errorHandler,
    notFound,
    handleUnhandledRejection,
    handleUncaughtException
} = require('./middleware/errorHandler');


// ===================================
// ۱. تنظیم هندلرهای خطای سراسری (باید اول باشند)
// ===================================
let serverInstance;
handleUnhandledRejection(serverInstance);
handleUncaughtException();


// ===================================
// ۲. تابع اتصال به دیتابیس (برای استفاده در startServer)
// ===================================
const initDB = async () => {
    try {
        await connectDB();
        logger.info('🗄️ اتصال به دیتابیس برقرار شد');
    } catch (err) {
        logger.error('❌ خطا در اتصال به دیتابیس:', err);
        process.exit(1);
    }
};


// ===================================
// ۳. تنظیم اپلیکیشن Express
// ===================================
const app = express();
if (process.env.NODE_ENV === 'production') { 
    app.set('trust proxy', 1); 
}


// ===================================
// ۴. میدل‌ویرهای امنیتی
// ===================================
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false
}));

// تنظیمات پیشرفته CORS
const corsOptions = {
    origin: function (origin, callback) {
        const whitelist = process.env.CLIENT_URL
            ? process.env.CLIENT_URL.split(',').map(url => url.trim())
            : ['http://localhost:3000', 'http://localhost:5173', 'https://localhost:5000'];

        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(mongoSanitize());
app.use(xss());
app.use(hpp({ 
    whitelist: [
        'price', 'rating', 'category', 'brand', 'sort', 'limit', 'page',
        'status', 'search', 'userId', 'productId', 'isFeatured', 
        'isOnSale', 'isNew', 'inStock'
    ] 
}));
app.use(cookieParser());


// ===================================
// ۵. میدل‌ویرهای عمومی
// ===================================
app.use(compression());

// Morgan (لاگر)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) { 
        fs.mkdirSync(logDir, { recursive: true }); 
    }
    const accessLogStream = fs.createWriteStream(
        path.join(logDir, 'access.log'), 
        { flags: 'a' }
    );
    app.use(morgan('combined', { stream: accessLogStream }));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// ===================================
// ۶. Rate Limiting (فقط عمومی)
// ===================================
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { 
        success: false, 
        message: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً بعداً تلاش کنید.' 
    },
    standardHeaders: true, 
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path
        });
        res.status(429).json({
            success: false,
            message: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً بعداً تلاش کنید.'
        });
    }
});
app.use('/api/', apiLimiter);


// ===================================
// ۷. Prometheus Metrics (اختیاری)
// ===================================
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', client.register.contentType);
        res.end(await client.register.metrics());
    } catch (ex) {
        res.status(500).end(ex);
    }
});


// ===================================
// ۸. Health Check Endpoint
// ===================================
app.get('/api/health', (req, res) => {
    const dbState = mongoose.connection.readyState === 1 ? 'متصل' : 'قطع';
    const memoryUsage = process.memoryUsage();
    
    res.status(200).json({
        success: true,
        message: 'سرور سالم است',
        status: 'UP',
        environment: process.env.NODE_ENV,
        database: dbState,
        uptime: Math.floor(process.uptime()),
        memory: {
            rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
            heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`
        },
        timestamp: new Date().toISOString()
    });
});


// ===================================
// ۹. اتصال روت‌ها
// ===================================
app.use('/api', apiRoutes);


// ===================================
// ۱۰. تنظیمات Production (سرو فایل‌های React)
// ===================================
if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '../frontend/build');
    
    if (fs.existsSync(buildPath)) {
        app.use(express.static(buildPath));
        app.get('*', (req, res) => {
            res.sendFile(path.resolve(buildPath, 'index.html'));
        });
    } else {
        logger.warn('⚠️ پوشه frontend/build یافت نشد! مطمئن شوید فرانت‌اند build شده است.');
        app.get('/', (req, res) => {
            res.json({
                success: true,
                message: 'API ویلف‌ویتا در حال اجراست',
                note: 'فرانت‌اند یافت نشد'
            });
        });
    }
} else {
    app.get('/', (req, res) => {
        res.json({ 
            success: true, 
            message: '🚀 API ویلف‌ویتا در حالت توسعه فعال است',
            version: '1.0.0',
            endpoints: {
                health: '/api/health',
                auth: '/api/auth',
                users: '/api/users',
                products: '/api/products',
                categories: '/api/categories',
                cart: '/api/cart',
                orders: '/api/orders',
                payments: '/api/payments',
                reviews: '/api/reviews',
                admin: '/api/admin',
                metrics: '/metrics'
            }
        });
    });
}


// ===================================
// ۱۱. مدیریت 404 (مسیرهای یافت نشده)
// ===================================
app.use(notFound);


// ===================================
// ۱۲. میدل‌ویر مدیریت خطا (آخرین)
// ===================================
app.use(errorHandler);


// ===================================
// ۱۳. تابع ایجاد و اجرای سرور
// ===================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await initDB();
    
    let server;
    
    if (process.env.NODE_ENV === 'development') {
        try {
            const keyPath = path.join(__dirname, 'config', 'localhost-key.pem');
            const certPath = path.join(__dirname, 'config', 'localhost-cert.pem');
            
            if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
                const options = { 
                    key: fs.readFileSync(keyPath), 
                    cert: fs.readFileSync(certPath) 
                };
                server = https.createServer(options, app);
                logger.info(`🔒 سرور توسعه با HTTPS روی https://localhost:${PORT}`);
            } else { 
                throw new Error('SSL certs not found'); 
            }
        } catch (err) {
            logger.warn('⚠️ فایل‌های SSL یافت نشد. سرور با HTTP اجرا می‌شود.');
            server = http.createServer(app);
            logger.info(`🌐 سرور توسعه با HTTP روی http://localhost:${PORT}`);
        }
    } else {
        server = http.createServer(app);
        logger.info(`🚀 سرور Production روی پورت ${PORT}`);
    }

    server.listen(PORT, () => {
        logger.info(`🚦 سرور در حالت ${process.env.NODE_ENV} روی پورت ${PORT} آماده است`);
        logger.info(`📍 API Base URL: http://localhost:${PORT}/api`);
    });
    
    return server;
};


// ===================================
// ۱۴. Graceful Shutdown (خاموشی ایمن)
// ===================================
const gracefulShutdown = (signal) => {
    logger.info(`\n${signal} دریافت شد. در حال بستن ایمن سرور...`);
    
    if (serverInstance) {
        serverInstance.close(() => {
            logger.info('✅ سرور HTTP بسته شد');
            
            mongoose.connection.close(false).then(() => {
                logger.info('✅ اتصال MongoDB بسته شد');
                process.exit(0);
            }).catch(err => {
                logger.error('❌ خطا در بستن اتصال MongoDB:', err);
                process.exit(1);
            });
        });
    } else {
        process.exit(0);
    }
    
    setTimeout(() => {
        logger.error('⚠️ بستن ایمن سرور زمان زیادی برد، خروج اجباری!');
        process.exit(1);
    }, 15000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));


// اجرای سرور و ذخیره نمونه آن
startServer()
    .then(server => {
        serverInstance = server;
    })
    .catch((err) => {
        logger.error('❌ خطا در شروع کلی سرور:', err);
        process.exit(1);
    });

module.exports = app;