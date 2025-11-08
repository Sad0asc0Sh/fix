const mcache = require('memory-cache');
const logger = require('../utils/logger');

// ====================================
// تنظیمات
// ====================================
const DEFAULT_TTL = parseInt(process.env.CACHE_TTL || '300', 10); // ثانیه
const MAX_HEAP_MB = parseInt(process.env.CACHE_MAX_HEAP_MB || '256', 10); // حد آستانه RAM

// مانیتورینگ استفاده از حافظه Heap
setInterval(() => {
  const heapUsedMB = process.memoryUsage().heapUsed / 1024 / 1024;
  if (heapUsedMB > MAX_HEAP_MB) {
    logger.warn(`⚠️ Heap usage ${heapUsedMB.toFixed(1)}MB > ${MAX_HEAP_MB}MB - Clearing cache...`);
    mcache.clear();
  }
}, 60000);

// ساخت کلید پایدار (query مرتب)
const buildCacheKey = (req, { includeUserId = false, excludeQuery = false } = {}) => {
  const userId = includeUserId && req.user?.id ? req.user.id : 'public';
  const base = req.path || req.originalUrl || req.url || '';
  if (excludeQuery) return `__cache__${userId}__${base}`;

  const entries = Object.entries(req.query || {}).sort((a, b) => a[0].localeCompare(b[0]));
  const qs = new URLSearchParams(entries).toString();
  return `__cache__${userId}__${base}${qs ? `?${qs}` : ''}`;
};

/**
 * میدل‌ویر کشینگ (فقط برای JSON)
 */
const cache = (durationInSeconds, options = {}) => {
  const { includeUserId = false, excludeQuery = false } = options;
  const ttl = Number.isFinite(durationInSeconds) && durationInSeconds > 0
    ? durationInSeconds
    : DEFAULT_TTL;

  return (req, res, next) => {
    // فقط GET و بدون bypass
    if (req.method !== 'GET') return next();
    if (req.headers['x-bypass-cache'] === '1' || req.query?.nocache === '1') return next();

    const key = buildCacheKey(req, { includeUserId, excludeQuery });
    const cached = mcache.get(key);

    if (cached) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', key);
      return res.send(cached); // cached یک string از JSON است
    }

    // فقط پاسخ‌های JSON را کش می‌کنیم
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300 && body) {
          const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
          // اعتبار سنجی JSON
          JSON.parse(bodyString);

          mcache.put(key, bodyString, ttl * 1000);
          if (process.env.NODE_ENV === 'development') {
            logger.debug(`✅ CACHED: ${key} (${ttl}s)`);
          }
          res.setHeader('X-Cache', 'MISS');
          res.setHeader('X-Cache-Key', key);
          return res.send(bodyString); // از send استفاده می‌کنیم تا دوباره stringify نشود
        }
      } catch (e) {
        logger.warn(`⚠️ Cache failed for ${key}: ${e.message}`);
      }
      // در خطاها یا بدنه نامعتبر، کش نکن
      return originalJson(body);
    };

    next();
  };
};

/**
 * پاک کردن کش با الگو
 */
const clearCache = (pattern) => {
  const keys = mcache.keys();
  let count = 0;

  keys.forEach((key) => {
    if (!pattern || key.includes(pattern)) {
      mcache.del(key);
      count++;
    }
  });

  logger.info(`Cache cleared: ${count} keys${pattern ? ` matching "${pattern}"` : ''}`);
  return count;
};

/**
 * پاک کردن کل کش
 */
const clearAllCache = () => {
  mcache.clear();
  logger.info('Cache cleared: ALL');
};

module.exports = {
  cache,
  clearCache,
  clearAllCache,
};