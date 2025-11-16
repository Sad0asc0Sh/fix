/**
 * اسکریپت تست برای بررسی متغیرهای محیطی
 * نحوه اجرا: node testEnv.js
 */

require('dotenv').config()

console.log('========================================')
console.log('📧 Email Configuration Test')
console.log('========================================\n')

console.log('EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NOT SET')
console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NOT SET')
console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET')
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET (hidden)' : '❌ NOT SET')
console.log('EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME || '❌ NOT SET')
console.log('\n========================================')
console.log('📱 SMS Configuration Test')
console.log('========================================\n')

console.log('KAVENEGAR_API_KEY:', process.env.KAVENEGAR_API_KEY ? '✅ SET (hidden)' : '❌ NOT SET')
console.log('KAVENEGAR_SENDER:', process.env.KAVENEGAR_SENDER || '❌ NOT SET (will use default: 10004346)')

console.log('\n========================================')
console.log('🌐 Other Settings')
console.log('========================================\n')

console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ NOT SET (will use: http://localhost:3000)')

console.log('\n========================================')

// Check if all required fields are set
const allSet = process.env.EMAIL_HOST &&
               process.env.EMAIL_PORT &&
               process.env.EMAIL_USER &&
               process.env.EMAIL_PASS

if (allSet) {
  console.log('✅ All required email settings are configured!')
} else {
  console.log('❌ Some email settings are missing!')
  console.log('\n💡 Please add these to your .env file:')
  console.log('EMAIL_HOST=smtp.gmail.com')
  console.log('EMAIL_PORT=587')
  console.log('EMAIL_USER=your-email@gmail.com')
  console.log('EMAIL_PASS=your-app-password')
  console.log('EMAIL_FROM_NAME=ویلف ویتا')
}

console.log('========================================\n')
