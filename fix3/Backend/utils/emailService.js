/**
 * ====================================
 * سرویس ارسال ایمیل
 * ====================================
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initTransporter();
    }

    /**
     * راه‌اندازی Transporter
     */
    initTransporter() {
        try {
            // بررسی وجود تنظیمات ایمیل
            if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
                logger.warn('⚠️ تنظیمات ایمیل در .env یافت نشد - سرویس ایمیل غیرفعال است');
                return;
            }

            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT || 587,
                secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            logger.info('✅ سرویس ایمیل راه‌اندازی شد');
        } catch (error) {
            logger.error('❌ خطا در راه‌اندازی سرویس ایمیل:', error);
        }
    }

    /**
     * بررسی فعال بودن سرویس
     */
    isAvailable() {
        return this.transporter !== null;
    }

    /**
     * ارسال ایمیل عمومی
     */
    async send({ to, subject, text, html }) {
        if (!this.isAvailable()) {
            logger.warn('سرویس ایمیل غیرفعال است - ایمیل ارسال نشد');
            return { success: false, message: 'سرویس ایمیل غیرفعال است' };
        }

        try {
            const mailOptions = {
                from: `"${process.env.EMAIL_FROM_NAME || 'فروشگاه ویلف‌ویتا'}" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                text,
                html
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`📧 ایمیل ارسال شد به: ${to}`);
            
            return { 
                success: true, 
                messageId: info.messageId,
                message: 'ایمیل با موفقیت ارسال شد'
            };
        } catch (error) {
            logger.error('❌ خطا در ارسال ایمیل:', error);
            return { 
                success: false, 
                message: 'خطا در ارسال ایمیل',
                error: error.message 
            };
        }
    }

    /**
     * ارسال ایمیل خوش‌آمدگویی
     */
    async sendWelcomeEmail(user) {
        const html = `
            <!DOCTYPE html>
            <html dir="rtl" lang="fa">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Tahoma, Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { text-align: center; border-bottom: 2px solid #4CAF50; padding-bottom: 20px; margin-bottom: 20px; }
                    .header h1 { color: #4CAF50; margin: 0; }
                    .content { line-height: 1.8; color: #333; }
                    .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #888; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 خوش آمدید به فروشگاه ویلف‌ویتا</h1>
                    </div>
                    <div class="content">
                        <p>سلام <strong>${user.name}</strong> عزیز،</p>
                        <p>از اینکه به خانواده بزرگ ولف‌ویتا پیوستید بسیار خوشحالیم! 🌟</p>
                        <p>اکنون می‌توانید از تمامی امکانات فروشگاه ما استفاده کنید:</p>
                        <ul>
                            <li>✅ خرید محصولات با بهترین قیمت‌ها</li>
                            <li>✅ پیگیری سفارشات</li>
                            <li>✅ ذخیره محصولات مورد علاقه</li>
                            <li>✅ دریافت تخفیف‌های ویژه</li>
                        </ul>
                        <center>
                            <a href="${process.env.CLIENT_URL}" class="button">شروع خرید</a>
                        </center>
                        <p>اگر سوالی دارید، تیم پشتیبانی ما همیشه در خدمت شماست.</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} فروشگاه ولف‌ویتا - تمامی حقوق محفوظ است</p>
                        <p>این ایمیل به صورت خودکار ارسال شده است.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.send({
            to: user.email,
            subject: '🎉 خوش آمدید به فروشگاه ویلف‌ویتا',
            text: `سلام ${user.name} عزیز، به فروشگاه ولف‌ویتا خوش آمدید!`,
            html
        });
    }

    /**
     * ارسال ایمیل بازیابی رمز عبور
     */
    async sendPasswordResetEmail(user, resetUrl) {
        const html = `
            <!DOCTYPE html>
            <html dir="rtl" lang="fa">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Tahoma, Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
                    .header { text-align: center; color: #ff9800; }
                    .content { line-height: 1.8; color: #333; }
                    .button { display: inline-block; padding: 12px 30px; background: #ff9800; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .warning { background: #fff3cd; border-right: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #888; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 بازیابی رمز عبور</h1>
                    </div>
                    <div class="content">
                        <p>سلام <strong>${user.name}</strong> عزیز،</p>
                        <p>درخواست بازیابی رمز عبور برای حساب کاربری شما دریافت شد.</p>
                        <p>برای تنظیم رمز عبور جدید، روی دکمه زیر کلیک کنید:</p>
                        <center>
                            <a href="${resetUrl}" class="button">بازیابی رمز عبور</a>
                        </center>
                        <div class="warning">
                            <strong>⚠️ توجه:</strong> این لینک فقط برای <strong>1 ساعت</strong> معتبر است.
                        </div>
                        <p>اگر این درخواست را شما ارسال نکرده‌اید، لطفاً این ایمیل را نادیده بگیرید.</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} فروشگاه ولف‌ویتا</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.send({
            to: user.email,
            subject: '🔐 بازیابی رمز عبور - فروشگاه ویلف‌ویتا',
            text: `برای بازیابی رمز عبور روی این لینک کلیک کنید: ${resetUrl}`,
            html
        });
    }

    /**
     * ارسال ایمیل تایید سفارش
     */
    async sendOrderConfirmation(user, order) {
        const html = `
            <!DOCTYPE html>
            <html dir="rtl" lang="fa">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Tahoma, Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
                    .header { text-align: center; color: #4CAF50; }
                    .order-box { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .order-item { padding: 10px 0; border-bottom: 1px solid #ddd; }
                    .total { background: #4CAF50; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; font-size: 18px; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #888; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ سفارش شما ثبت شد!</h1>
                    </div>
                    <div class="content">
                        <p>سلام <strong>${user.name}</strong> عزیز،</p>
                        <p>سفارش شما با موفقیت ثبت شد و در حال پردازش است.</p>
                        
                        <div class="order-box">
                            <h3>📦 اطلاعات سفارش</h3>
                            <p><strong>شماره سفارش:</strong> ${order._id}</p>
                            <p><strong>تاریخ:</strong> ${new Date(order.createdAt).toLocaleDateString('fa-IR')}</p>
                            <p><strong>وضعیت:</strong> ${order.status === 'pending' ? 'در انتظار پردازش' : order.status}</p>
                        </div>

                        <div class="total">
                            💰 مبلغ کل: ${order.totalPrice?.toLocaleString('fa-IR')} تومان
                        </div>

                        <p>می‌توانید وضعیت سفارش خود را در پنل کاربری پیگیری کنید.</p>
                        <p>از خرید شما متشکریم! 🙏</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} فروشگاه ولف‌ویتا</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.send({
            to: user.email,
            subject: `✅ سفارش ${order._id} ثبت شد - فروشگاه ولف‌ویتا`,
            text: `سفارش شما با شماره ${order._id} ثبت شد.`,
            html
        });
    }
}

// Singleton
const emailService = new EmailService();

module.exports = emailService;