/**
 * ====================================
 * Cache Manager - مدیریت Cache
 * ====================================
 */

const mcache = require('memory-cache');
const logger = require('./logger');

class CacheManager {
    constructor() {
        this.cache = mcache;
        this.MAX_SIZE = 100 * 1024 * 1024; // 100 MB
        this.startMonitoring();
    }

    startMonitoring() {
        setInterval(() => {
            const size = this.cache.size();
            if (size > this.MAX_SIZE) {
                logger.warn(`Cache overflow: ${(size / 1024 / 1024).toFixed(2)}MB - Clearing...`);
                this.clear();
            }
        }, 60000);
    }

    set(key, value, duration = 300) {
        try {
            this.cache.put(key, value, duration * 1000);
            logger.debug(`Cache SET: ${key} (${duration}s)`);
            return true;
        } catch (error) {
            logger.error('Cache SET failed:', error);
            return false;
        }
    }

    get(key) {
        try {
            const value = this.cache.get(key);
            if (value) {
                logger.debug(`Cache HIT: ${key}`);
            } else {
                logger.debug(`Cache MISS: ${key}`);
            }
            return value;
        } catch (error) {
            logger.error('Cache GET failed:', error);
            return null;
        }
    }

    del(key) {
        try {
            this.cache.del(key);
            logger.debug(`Cache DEL: ${key}`);
            return true;
        } catch (error) {
            logger.error('Cache DEL failed:', error);
            return false;
        }
    }

    clearPattern(pattern) {
        try {
            const keys = this.cache.keys();
            let count = 0;
            
            keys.forEach(key => {
                if (key.includes(pattern)) {
                    this.cache.del(key);
                    count++;
                }
            });
            
            logger.info(`Cache cleared: ${count} keys matching "${pattern}"`);
            return count;
        } catch (error) {
            logger.error('Cache clearPattern failed:', error);
            return 0;
        }
    }

    clear() {
        try {
            this.cache.clear();
            logger.info('Cache cleared: ALL');
            return true;
        } catch (error) {
            logger.error('Cache clear failed:', error);
            return false;
        }
    }

    keys() {
        return this.cache.keys();
    }

    size() {
        return this.cache.size();
    }

    stats() {
        const keys = this.keys();
        const size = this.size();
        
        return {
            totalKeys: keys.length,
            sizeBytes: size,
            sizeMB: (size / 1024 / 1024).toFixed(2),
            maxSizeMB: (this.MAX_SIZE / 1024 / 1024).toFixed(2),
            usage: ((size / this.MAX_SIZE) * 100).toFixed(2) + '%'
        };
    }
}

// Singleton
const cacheManager = new CacheManager();

module.exports = cacheManager;