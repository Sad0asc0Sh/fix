/**
 * ====================================
 * مدیریت JWT Tokens
 * ====================================
 */

const jwt = require('jsonwebtoken');
const ApiResponse = require('./apiResponse');

class TokenManager {
    /**
     * تولید Access Token
     */
    static generateAccessToken(userId, role = 'user') {
        return jwt.sign(
            { 
                id: userId,
                role,
                type: 'access'
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: process.env.JWT_EXPIRE || '7d',
                issuer: 'welfvita-store',
                audience: 'welfvita-users'
            }
        );
    }

    /**
     * تولید Refresh Token
     */
    static generateRefreshToken(userId) {
        return jwt.sign(
            { 
                id: userId,
                type: 'refresh'
            },
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            { 
                expiresIn: '30d',
                issuer: 'welfvita-store',
                audience: 'welfvita-users'
            }
        );
    }

    /**
     * تولید Reset Password Token
     */
    static generateResetToken(userId) {
        return jwt.sign(
            { 
                id: userId,
                type: 'reset'
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: '1h'
            }
        );
    }

    /**
     * تولید Email Verification Token
     */
    static generateVerificationToken(userId, email) {
        return jwt.sign(
            { 
                id: userId,
                email,
                type: 'verification'
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: '24h'
            }
        );
    }

    /**
     * تایید توکن
     */
    static verifyToken(token, type = 'access') {
        try {
            const secret = type === 'refresh' 
                ? (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)
                : process.env.JWT_SECRET;

            const decoded = jwt.verify(token, secret, {
                issuer: type === 'access' || type === 'refresh' ? 'welfvita-store' : undefined,
                audience: type === 'access' || type === 'refresh' ? 'welfvita-users' : undefined
            });

            // بررسی نوع توکن
            if (decoded.type && decoded.type !== type) {
                throw new Error('نوع توکن نامعتبر است');
            }

            return {
                valid: true,
                decoded
            };
        } catch (error) {
            return {
                valid: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    /**
     * دریافت پیام خطا
     */
    static getErrorMessage(error) {
        if (error.name === 'TokenExpiredError') {
            return 'توکن منقضی شده است';
        } else if (error.name === 'JsonWebTokenError') {
            return 'توکن نامعتبر است';
        } else if (error.name === 'NotBeforeError') {
            return 'توکن هنوز فعال نشده است';
        }
        return error.message || 'خطا در بررسی توکن';
    }

    /**
     * استخراج توکن از Header
     */
    static extractTokenFromHeader(req) {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return null;
        }

        // Bearer token
        if (authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        return authHeader;
    }

    /**
     * استخراج توکن از Cookie
     */
    static extractTokenFromCookie(req, cookieName = 'token') {
        return req.cookies?.[cookieName] || null;
    }

    /**
     * دکود توکن بدون تایید (برای دیباگ)
     */
    static decodeWithoutVerify(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            return null;
        }
    }

    /**
     * بررسی انقضای توکن
     */
    static isTokenExpired(token) {
        const decoded = this.decodeWithoutVerify(token);
        if (!decoded || !decoded.exp) {
            return true;
        }
        
        return Date.now() >= decoded.exp * 1000;
    }

    /**
     * ست کردن توکن در کوکی
     */
    static setTokenCookie(res, token, options = {}) {
        const defaultOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        };

        res.cookie('token', token, { ...defaultOptions, ...options });
    }

    /**
     * پاک کردن توکن از کوکی
     */
    static clearTokenCookie(res, cookieName = 'token') {
        res.cookie(cookieName, '', {
            httpOnly: true,
            expires: new Date(0),
            path: '/'
        });
    }

    /**
     * تولید توکن‌های کامل (access + refresh)
     */
    static generateTokenPair(userId, role = 'user') {
        return {
            accessToken: this.generateAccessToken(userId, role),
            refreshToken: this.generateRefreshToken(userId)
        };
    }
}

module.exports = TokenManager;