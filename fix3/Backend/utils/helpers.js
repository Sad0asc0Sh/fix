/**
 * ====================================
 * توابع کمکی عمومی
 * ====================================
 */

const crypto = require('crypto');

class Helpers {
    /**
     * تولید کد تصادفی
     */
    static generateRandomCode(length = 6) {
        return Math.floor(Math.random() * Math.pow(10, length))
            .toString()
            .padStart(length, '0');
    }

    /**
     * تولید توکن تصادفی
     */
    static generateRandomToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Hash کردن رشته
     */
    static hashString(str) {
        return crypto.createHash('sha256').update(str).digest('hex');
    }

    /**
     * فرمت قیمت (اضافه کردن کاما)
     */
    static formatPrice(price) {
        return new Intl.NumberFormat('fa-IR').format(price);
    }

    /**
     * محاسبه درصد تخفیف
     */
    static calculateDiscount(originalPrice, discountedPrice) {
        return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
    }

    /**
     * تبدیل به Slug
     */
    static createSlug(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    }

    /**
     * بررسی اعتبار شماره موبایل ایران
     */
    static isValidIranianMobile(mobile) {
        const mobileRegex = /^09[0-9]{9}$/;
        return mobileRegex.test(mobile);
    }

    /**
     * بررسی اعتبار کد ملی ایران
     */
    static isValidNationalCode(code) {
        if (!/^\d{10}$/.test(code)) return false;
        
        const check = parseInt(code[9]);
        const sum = code
            .split('')
            .slice(0, 9)
            .reduce((acc, digit, index) => acc + parseInt(digit) * (10 - index), 0);
        
        const remainder = sum % 11;
        return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
    }

    /**
     * تبدیل تاریخ میلادی به شمسی (ساده)
     */
    static toJalali(date) {
        return new Intl.DateTimeFormat('fa-IR').format(new Date(date));
    }

    /**
     * محاسبه زمان باقیمانده
     */
    static getTimeRemaining(endDate) {
        const total = Date.parse(endDate) - Date.parse(new Date());
        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));

        return {
            total,
            days,
            hours,
            minutes,
            seconds,
            isExpired: total <= 0
        };
    }

    /**
     * Sanitize کردن ورودی
     */
    static sanitizeInput(input) {
        if (typeof input === 'string') {
            return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
        return input;
    }

    /**
     * پاک کردن فیلدهای null/undefined از آبجکت
     */
    static removeEmptyFields(obj) {
        return Object.fromEntries(
            Object.entries(obj).filter(([_, v]) => v != null && v !== '')
        );
    }

    /**
     * تاخیر (برای testing یا rate limiting)
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * محاسبه سن از تاریخ تولد
     */
    static calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    /**
     * گرفتن IP واقعی کاربر
     */
    static getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0] ||
               req.headers['x-real-ip'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               req.ip;
    }
}

module.exports = Helpers;