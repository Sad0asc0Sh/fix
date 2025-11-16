const mongoose = require('mongoose')

const settingsSchema = new mongoose.Schema(
  {
    // Ensure singleton document
    singletonKey: {
      type: String,
      default: 'main_settings',
      unique: true,
    },

    // General settings
    storeName: {
      type: String,
      default: 'فروشگاه من',
    },
    storeEmail: {
      type: String,
      default: 'info@example.com',
    },
    storePhone: {
      type: String,
      default: '',
    },
    storeAddress: {
      type: String,
      default: '',
    },

    // Payment settings (sensitive)
    paymentGatewayKeys: {
      apiKey: { type: String, select: false },
      apiSecret: { type: String, select: false },
    },

    // Notification settings
    notificationSettings: {
      smsApiKey: { type: String, select: false },
      emailFrom: { type: String, default: 'noreply@example.com' },
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Settings', settingsSchema)

