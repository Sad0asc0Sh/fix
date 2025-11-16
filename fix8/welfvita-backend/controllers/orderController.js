const Order = require('../models/Order')

// ============================================
// GET /api/orders - لیست سفارش‌ها با فیلتر و صفحه‌بندی
// ============================================
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 20
    const skip = (page - 1) * limit

    const filter = {}

    if (req.query.orderStatus) {
      filter.orderStatus = req.query.orderStatus
    }

    if (req.query.isPaid !== undefined) {
      filter.isPaid = req.query.isPaid === 'true'
    }

    if (req.query.search) {
      filter._id = { $regex: req.query.search, $options: 'i' }
    }

    // فیلتر بر اساس کاربر (برای نمایش سفارشات یک مشتری خاص)
    if (req.query.userId) {
      filter.user = req.query.userId
    }

    const totalItems = await Order.countDocuments(filter)

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست سفارشات',
      error: error.message,
    })
  }
}

// ============================================
// GET /api/orders/:id - جزئیات یک سفارش
// ============================================
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'name images sku')
      .lean()

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'سفارش مورد نظر یافت نشد',
      })
    }

    res.json({
      success: true,
      data: order,
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت جزئیات سفارش',
      error: error.message,
    })
  }
}

// ============================================
// PUT /api/orders/:id/status - به‌روزرسانی وضعیت سفارش
// فقط فیلدهای مرتبط را لمس می‌کنیم
// ============================================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'وضعیت سفارش الزامی است',
      })
    }

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'وضعیت سفارش نامعتبر است',
      })
    }

    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'سفارش مورد نظر یافت نشد',
      })
    }

    const updates = {
      orderStatus: status,
    }

    if (status === 'Shipped' && !order.shippedAt) {
      updates.shippedAt = new Date()
    }
    if (status === 'Delivered' && !order.deliveredAt) {
      updates.deliveredAt = new Date()
    }

    // نرمال‌سازی یادداشت ادمین تا خطای CastError ندهد
    if (adminNotes !== undefined) {
      let normalizedAdminNotes
      if (Array.isArray(adminNotes)) {
        normalizedAdminNotes = adminNotes.join('\n')
      } else if (adminNotes === null) {
        normalizedAdminNotes = ''
      } else {
        normalizedAdminNotes = String(adminNotes)
      }
      updates.adminNotes = normalizedAdminNotes
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: false,
      },
    )

    res.json({
      success: true,
      message: 'وضعیت سفارش با موفقیت به‌روزرسانی شد',
      data: updatedOrder,
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی وضعیت سفارش',
      error: error.message,
    })
  }
}

