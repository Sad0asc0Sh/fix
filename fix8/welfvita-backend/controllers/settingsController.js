const Settings = require('../models/Settings')

// دریافت تنظیمات (سند تک‌مثالی). در صورت عدم وجود، ایجاد می‌شود.
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ singletonKey: 'main_settings' })

    if (!settings) {
      settings = await Settings.create({})
    }

    res.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تنظیمات سایت',
      error: error.message,
    })
  }
}

// به‌روزرسانی تنظیمات (سند تک‌مثالی)
exports.updateSettings = async (req, res) => {
  try {
    const updates = { ...req.body }

    // جلوگیری از تغییر singletonKey از سمت کلاینت
    if ('singletonKey' in updates) {
      delete updates.singletonKey
    }

    const settings = await Settings.findOneAndUpdate(
      { singletonKey: 'main_settings' },
      updates,
      {
        new: true,
        upsert: true,
      },
    )

    res.json({
      success: true,
      message: 'تنظیمات سایت با موفقیت به‌روزرسانی شد',
      data: settings,
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی تنظیمات سایت',
      error: error.message,
    })
  }
}
