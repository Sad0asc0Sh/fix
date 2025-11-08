/**
 * ====================================
 * سیستم لاگ‌گیری حرفه‌ای
 * ====================================
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logsDir = path.join(__dirname, '../logs');
        this.ensureLogsDir();
    }

    ensureLogsDir() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    getCurrentTimestamp() {
        return new Date().toISOString();
    }

    formatMessage(level, message, meta = {}) {
        return JSON.stringify({
            timestamp: this.getCurrentTimestamp(),
            level,
            message,
            ...meta
        }) + '\n';
    }

    writeToFile(filename, content) {
        const filePath = path.join(this.logsDir, filename);
        fs.appendFileSync(filePath, content, 'utf8');
    }

    /**
     * لاگ اطلاعات عمومی
     */
    info(message, meta = {}) {
        const formattedMessage = this.formatMessage('INFO', message, meta);
        console.log(`ℹ️  ${message}`, meta);
        this.writeToFile('combined.log', formattedMessage);
    }

    /**
     * لاگ خطا
     */
    error(message, error = null, meta = {}) {
        const errorMeta = {
            ...meta,
            error: error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : null
        };

        const formattedMessage = this.formatMessage('ERROR', message, errorMeta);
        console.error(`❌ ${message}`, errorMeta);
        this.writeToFile('error.log', formattedMessage);
        this.writeToFile('combined.log', formattedMessage);
    }

    /**
     * لاگ هشدار
     */
    warn(message, meta = {}) {
        const formattedMessage = this.formatMessage('WARN', message, meta);
        console.warn(`⚠️  ${message}`, meta);
        this.writeToFile('combined.log', formattedMessage);
    }

    /**
     * لاگ دیباگ (فقط در محیط توسعه)
     */
    debug(message, meta = {}) {
        if (process.env.NODE_ENV === 'development') {
            const formattedMessage = this.formatMessage('DEBUG', message, meta);
            console.debug(`🐛 ${message}`, meta);
            this.writeToFile('combined.log', formattedMessage);
        }
    }

    /**
     * لاگ درخواست HTTP
     */
    http(req, res, duration) {
        const logData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        const formattedMessage = this.formatMessage('HTTP', 'Request', logData);
        console.log(`🌐 ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
        this.writeToFile('combined.log', formattedMessage);
    }
}

// Singleton instance
const logger = new Logger();

module.exports = logger;