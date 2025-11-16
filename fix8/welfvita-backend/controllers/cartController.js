const Cart = require('../models/Cart')

// ============================================
// GET /api/carts/admin/abandoned - دریافت سبدهای رها شده
// فقط برای ادمین
// ============================================
exports.getAbandonedCarts = async (req, res) => {
  try {
    // پارامترهای زمانی قابل تنظیم
    const hoursAgo = parseInt(req.query.hoursAgo, 10) || 1 // پیش‌فرض: 1 ساعت
    const daysAgo = parseInt(req.query.daysAgo, 10) || 7 // پیش‌فرض: 7 روز

    // محاسبه تاریخ‌ها
    const minTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
    const maxTime = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

    // پیدا کردن سبدهای رها شده
    // سبدهایی که:
    // 1. وضعیت active دارند
    // 2. updatedAt آن‌ها قدیمی‌تر از hoursAgo است (پیش‌فرض: 1 ساعت)
    // 3. updatedAt آن‌ها جدیدتر از daysAgo است (پیش‌فرض: 7 روز)
    const filter = {
      status: 'active',
      updatedAt: {
        $lte: minTime, // کمتر یا مساوی با زمان حداقل (قدیمی‌تر از 1 ساعت)
        $gte: maxTime, // بیشتر یا مساوی با زمان حداکثر (جدیدتر از 7 روز)
      },
      'items.0': { $exists: true }, // حداقل یک آیتم داشته باشد
    }

    const carts = await Cart.find(filter)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images sku price')
      .sort({ updatedAt: -1 })
      .lean()

    // محاسبه آمار
    const totalItems = carts.reduce((sum, cart) => {
      return sum + cart.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
    }, 0)

    const totalValue = carts.reduce((sum, cart) => {
      return (
        sum +
        cart.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0)
      )
    }, 0)

    res.json({
      success: true,
      data: carts,
      stats: {
        totalCarts: carts.length,
        totalItems,
        totalValue,
      },
      filters: {
        hoursAgo,
        daysAgo,
        minTime,
        maxTime,
      },
    })
  } catch (error) {
    console.error('Error fetching abandoned carts:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت سبدهای رها شده',
      error: error.message,
    })
  }
}

// ============================================
// GET /api/carts/admin/stats - آمار سبدها
// فقط برای ادمین
// ============================================
exports.getCartStats = async (req, res) => {
  try {
    const totalActiveCarts = await Cart.countDocuments({ status: 'active' })
    const totalConvertedCarts = await Cart.countDocuments({ status: 'converted' })

    // سبدهای رها شده (1 ساعت تا 7 روز)
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const abandonedCarts = await Cart.countDocuments({
      status: 'active',
      updatedAt: {
        $lte: oneHourAgo,
        $gte: sevenDaysAgo,
      },
      'items.0': { $exists: true },
    })

    res.json({
      success: true,
      stats: {
        totalActiveCarts,
        totalConvertedCarts,
        abandonedCarts,
        conversionRate:
          totalActiveCarts + totalConvertedCarts > 0
            ? ((totalConvertedCarts / (totalActiveCarts + totalConvertedCarts)) * 100).toFixed(2)
            : 0,
      },
    })
  } catch (error) {
    console.error('Error fetching cart stats:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت آمار سبدها',
      error: error.message,
    })
  }
}
