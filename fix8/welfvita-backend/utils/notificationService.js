const nodemailer = require('nodemailer')
const Kavenegar = require('kavenegar')

/**
 * @desc    ارسال ایمیل یادآوری سبد خرید
 * @param   {String} userEmail - ایمیل کاربر
 * @param   {String} userName - نام کاربر
 * @param   {Array} cartItems - آیتم‌های سبد خرید
 * @returns {Promise}
 */
exports.sendReminderEmail = async (userEmail, userName, cartItems) => {
  try {
    // تنظیمات nodemailer (از متغیرهای محیطی بخوانید)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // ایمیل فرستنده
        pass: process.env.EMAIL_PASS, // رمز عبور
      },
    })

    // ساخت محتوای HTML ایمیل
    let itemsHtml = ''
    let totalPrice = 0

    cartItems.forEach((item) => {
      const price = item.price || 0
      const quantity = item.quantity || 0
      const subtotal = price * quantity
      totalPrice += subtotal

      itemsHtml += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.product?.name || 'محصول'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${price.toLocaleString('fa-IR')} تومان</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${subtotal.toLocaleString('fa-IR')} تومان</td>
        </tr>
      `
    })

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'ویلف ویتا'}" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'یادآوری سبد خرید شما در ویلف ویتا',
      html: `
        <div dir="rtl" style="font-family: Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">سلام ${userName || 'کاربر گرامی'}!</h2>
          <p style="color: #555; font-size: 14px;">
            شما محصولاتی را در سبد خرید خود داشتید که هنوز سفارش شما نهایی نشده است.
          </p>
          <p style="color: #555; font-size: 14px;">
            آیتم‌های سبد خرید شما:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">محصول</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">تعداد</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">قیمت واحد</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">جمع</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">جمع کل:</td>
                <td style="padding: 10px; font-weight: bold; color: #1890ff;">${totalPrice.toLocaleString('fa-IR')} تومان</td>
              </tr>
            </tfoot>
          </table>
          <p style="color: #555; font-size: 14px;">
            برای تکمیل خرید خود، به سایت ویلف ویتا مراجعه کنید.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart"
               style="background-color: #1890ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              مشاهده سبد خرید
            </a>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            با تشکر، تیم ویلف ویتا
          </p>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent: %s', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

/**
 * @desc    ارسال پیامک یادآوری سبد خرید
 * @param   {String} phoneNumber - شماره موبایل کاربر
 * @param   {String} userName - نام کاربر
 * @param   {Number} itemsCount - تعداد آیتم‌های سبد
 * @returns {Promise}
 */
exports.sendReminderSMS = async (phoneNumber, userName, itemsCount) => {
  try {
    // تنظیمات Kavenegar
    const apiKey = process.env.KAVENEGAR_API_KEY
    if (!apiKey) {
      throw new Error('KAVENEGAR_API_KEY is not defined in environment variables')
    }

    const api = Kavenegar.KavenegarApi({
      apikey: apiKey,
    })

    // پیام پیامک
    const message = `${userName || 'کاربر گرامی'}، شما ${itemsCount} محصول در سبد خرید ویلف ویتا دارید. برای تکمیل خرید خود به سایت مراجعه کنید.`

    // شماره فرستنده (خط خدماتی کاوه‌نگار)
    const sender = process.env.KAVENEGAR_SENDER || '10004346'

    return new Promise((resolve, reject) => {
      api.Send(
        {
          message,
          sender,
          receptor: phoneNumber,
        },
        (response, status) => {
          if (status === 200) {
            console.log('SMS sent successfully:', response)
            resolve({ success: true, response })
          } else {
            console.error('SMS sending failed:', response)
            reject(new Error('Failed to send SMS'))
          }
        }
      )
    })
  } catch (error) {
    console.error('Error sending SMS:', error)
    throw error
  }
}

/**
 * @desc    ارسال ایمیل بازنشانی رمز عبور
 * @param   {String} userEmail - ایمیل کاربر
 * @param   {String} userName - نام کاربر
 * @param   {String} resetUrl - لینک بازنشانی رمز عبور
 * @returns {Promise}
 */
exports.sendResetPasswordEmail = async (userEmail, userName, resetUrl) => {
  try {
    // تنظیمات nodemailer (از متغیرهای محیطی بخوانید)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // ایمیل فرستنده
        pass: process.env.EMAIL_PASS, // رمز عبور
      },
    })

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'ویلف ویتا'}" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'بازنشانی رمز عبور - پنل ادمین ویلف ویتا',
      html: `
        <div dir="rtl" style="font-family: Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">بازنشانی رمز عبور</h2>
          <p style="color: #555; font-size: 14px;">
            سلام ${userName || 'کاربر گرامی'}،
          </p>
          <p style="color: #555; font-size: 14px;">
            شما درخواست بازنشانی رمز عبور خود را ارسال کرده‌اید. برای ادامه، روی دکمه زیر کلیک کنید:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #1890ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              بازنشانی رمز عبور
            </a>
          </div>
          <p style="color: #999; font-size: 13px;">
            یا این لینک را کپی کنید:
          </p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
            ${resetUrl}
          </p>
          <p style="color: #d9534f; font-size: 13px; margin-top: 20px;">
            ⚠️ این لینک فقط برای <strong>10 دقیقه</strong> معتبر است.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            اگر شما درخواست بازنشانی رمز عبور نداده‌اید، این ایمیل را نادیده بگیرید.
          </p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            با تشکر، تیم ویلف ویتا
          </p>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Reset password email sent: %s', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending reset password email:', error)
    throw error
  }
}
