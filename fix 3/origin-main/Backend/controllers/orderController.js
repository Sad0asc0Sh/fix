const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // برای decode در صورت نیاز
let cacheManager;
try {
  cacheManager = require('../utils/cacheManager'); // اگر وجود داشت برای پاک کردن کش استفاده می‌کنیم
} catch (_) {}

/**
 * ====================================
 * 👤 USER CONTROLLERS - کنترلرهای کاربر
 * ====================================
 */

/**
 * @desc    ایجاد سفارش جدید
 * @route   POST /api/orders
 * @access  Private
 */
exports.createOrder = catchAsync(async (req, res, next) => {
  const { orderItems, shippingAddress, paymentMethod, couponCode } = req.body;

  // ۱. بررسی ورودی‌ها
  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    return next(new AppError('سبد خرید خالی است', 400));
  }
  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.phone) {
    return next(new AppError('اطلاعات ارسال ناقص است', 400));
  }
  if (!paymentMethod) {
    return next(new AppError('روش پرداخت الزامی است', 400));
  }

  // ۲. دریافت اطلاعات محصولات از دیتابیس
  const productIds = orderItems.map(item => item.product);
  const products = await Product.find({ _id: { $in: productIds } });

  if (products.length !== productIds.length) {
    return next(new AppError('برخی محصولات در سبد خرید یافت نشدند', 404));
  }

  // ۳. آماده‌سازی آیتم‌ها و محاسبه قیمت (با در نظر گرفتن تخفیف و variant)
  let itemsPrice = 0;
  const preparedItems = [];

  for (const item of orderItems) {
    const product = products.find(p => p._id.toString() === String(item.product));
    if (!product) return next(new AppError('محصول یافت نشد', 404));
    if (!product.isActive) return next(new AppError(`محصول '${product.name}' غیرفعال است`, 400));

    // محاسبه قیمت نهایی واحد (با تخفیف و تغییر قیمت variant)
    let unitPrice = product.finalPrice ?? product.price; // virtual نهایی یا fallback به price
    let availableStock = product.stock;

    // اگر variant ارسال شده، قیمت و موجودی را بر اساس آن تنظیم کن
    if (item.variant && item.variant.name && item.variant.value && Array.isArray(product.variants)) {
      const group = product.variants.find(v => v.name === item.variant.name);
      const option = group?.options?.find(o => o.value === item.variant.value);
      if (option) {
        if (typeof option.priceModifier === 'number') unitPrice += option.priceModifier;
        if (typeof option.stock === 'number') availableStock = option.stock;
      }
    }

    if (availableStock < item.quantity) {
      return next(
        new AppError(
          `موجودی '${product.name}' کافی نیست. موجودی فعلی: ${availableStock}`,
          400
        )
      );
    }

    const itemTotal = unitPrice * item.quantity;
    itemsPrice += itemTotal;

    preparedItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url || '/uploads/products/default.jpg',
      price: unitPrice, // قیمت واحد در لحظه سفارش
      qty: item.quantity,
      discountPercent: product.discount || 0,
      variant: item.variant || null
    });
  }

  // ۴. محاسبه هزینه‌ها
  const freeShippingThreshold = parseInt(process.env.FREE_SHIPPING_THRESHOLD) || 500000;
  const baseShipping = parseInt(process.env.SHIPPING_PRICE) || 50000;
  const shippingPrice = itemsPrice >= freeShippingThreshold ? 0 : baseShipping;
  const taxRate = parseFloat(process.env.TAX_RATE) || 0.09;
  const taxPrice = Math.round(itemsPrice * taxRate);

  // TODO: اعمال کد تخفیف واقعی از مدل Discount
  let discountAmount = 0;
  let appliedCoupon = null;
  if (couponCode && typeof couponCode === 'string') {
    // در آینده با مدل Discount ست کن
    appliedCoupon = couponCode.toUpperCase();
  }

  const totalPrice = itemsPrice + shippingPrice + taxPrice - discountAmount;

  // ۵. ایجاد سفارش با Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ساخت سفارش
    const orderData = {
      user: req.user._id,
      orderItems: preparedItems,
      shippingAddress: {
        fullName: shippingAddress.fullName?.trim(),
        address: shippingAddress.address?.trim(),
        city: shippingAddress.city?.trim(),
        state: shippingAddress.state?.trim(),
        postalCode: shippingAddress.postalCode?.trim(),
        country: shippingAddress.country || 'ایران',
        phone: shippingAddress.phone?.trim(),
        email: req.user.email,
        notes: shippingAddress.notes?.trim()
      },
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      discountAmount,
      totalPrice,
      couponCode: appliedCoupon,
      status: 'pending',
      source: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web'
    };

    const order = await Order.create([orderData], { session }).then(docs => docs[0]);

    // کاهش موجودی انبار + افزایش فروش
    const stockUpdates = preparedItems.map(item =>
      Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.qty, soldCount: item.qty } },
        { session }
      )
    );
    await Promise.all(stockUpdates);

    await session.commitTransaction();

    // پاک کردن کش لیست سفارش‌ها
    try {
      cacheManager?.clearPattern?.('/api/orders');
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: 'سفارش با موفقیت ثبت شد',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('خطا در ثبت سفارش:', error);
    return next(new AppError('خطا در ثبت سفارش. لطفاً دوباره تلاش کنید', 500));
  } finally {
    session.endSession();
  }
});

/**
 * @desc    دریافت سفارش‌های کاربر
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
exports.getMyOrders = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const skip = (page - 1) * limit;

  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [orders, totalOrders] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-statusHistory -adminNotes -paymentResult.gatewayResponse'),
    Order.countDocuments(filter)
  ]);

  return res.status(200).json({
    success: true,
    count: orders.length,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders
    },
    data: orders
  });
});

/**
 * @desc    دریافت جزئیات سفارش
 * @route   GET /api/orders/:id
 * @access  Private (مالک یا ادمین)
 */
exports.getOrderById = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('orderItems.product', 'name slug category brand');

  if (!order) {
    return next(new AppError('سفارش یافت نشد', 404));
  }

  return res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * @desc    لغو سفارش
 * @route   PUT /api/orders/:id/cancel
 * @access  Private (مالک)
 */
exports.cancelOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('سفارش یافت نشد', 404));

  // بررسی قابلیت لغو
  if (!order.canBeCancelled) {
    return next(new AppError('این سفارش قابل لغو نیست', 400));
  }

  // لغو سفارش و بازگرداندن موجودی
  await order.cancelOrder('user', req.body.reason || 'لغو توسط کاربر');

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const stockRestores = order.orderItems.map(item =>
      Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.qty, soldCount: -item.qty } },
        { session }
      )
    );
    await Promise.all(stockRestores);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error('خطا در بازگرداندن موجودی:', error);
  } finally {
    session.endSession();
  }

  try {
    cacheManager?.clearPattern?.('/api/orders');
  } catch (_) {}

  return res.status(200).json({
    success: true,
    message: 'سفارش با موفقیت لغو شد',
    data: order
  });
});

/**
 * @desc    ردیابی سفارش
 * @route   GET /api/orders/track
 * @access  Public
 */
exports.trackOrder = catchAsync(async (req, res, next) => {
  const { orderNumber, email } = req.query;

  if (!orderNumber || !email) {
    return next(new AppError('شماره سفارش و ایمیل الزامی است', 400));
  }

  const order = await Order.findOne({
    orderNumber: String(orderNumber).toUpperCase(),
    'shippingAddress.email': String(email).toLowerCase()
  }).select('orderNumber status statusHistory trackingInfo expectedDeliveryDate createdAt orderItems.name orderItems.image');

  if (!order) {
    return next(new AppError('سفارش با این مشخصات یافت نشد', 404));
  }

  return res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * @desc    تایید پرداخت (Callback درگاه)
 * @route   GET /api/orders/verify-payment (یا POST)
 * @access  Public
 */
exports.verifyPayment = catchAsync(async (req, res, next) => {
  // هم از query و هم از body بخوان (برای سازگاری)
  const authority = req.query.Authority || req.body.authority;
  const status = req.query.Status || req.body.status;
  const orderId = req.query.orderId || req.body.orderId;
  const orderNumber = req.query.orderNumber || req.body.orderNumber;

  if (!authority || !status) {
    return next(new AppError('پارامترهای Authority و Status الزامی است', 400));
  }

  let order = null;
  if (orderId) {
    order = await Order.findById(orderId);
  } else if (orderNumber) {
    order = await Order.findOne({ orderNumber: String(orderNumber).toUpperCase() });
  } else {
    return next(new AppError('شناسه سفارش یا شماره سفارش الزامی است', 400));
  }

  if (!order) {
    return next(new AppError('سفارش یافت نشد', 404));
  }

  if (order.isPaid) {
    return res.status(200).json({
      success: true,
      message: 'این سفارش قبلاً پرداخت شده است',
      data: { orderId: order._id, orderNumber: order.orderNumber }
    });
  }

  if (String(status).toUpperCase() === 'OK') {
    // TODO: تایید با API درگاه واقعی (Authority + Amount)
    const paymentResult = {
      authority,
      status: 'OK',
      refId: 'REF' + Date.now(),
      cardPan: '****-****-****-1234',
      update_time: new Date().toISOString()
    };

    await order.markAsPaid(paymentResult);

    try {
      cacheManager?.clearPattern?.('/api/orders');
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: 'پرداخت با موفقیت انجام شد',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        refId: paymentResult.refId
      }
    });
  } else {
    // پرداخت ناموفق
    order.status = 'failed';
    order.paymentResult = { authority, status };
    await order.save();
    return next(new AppError('پرداخت ناموفق بود', 400));
  }
});

/**
 * @desc    دانلود فاکتور
 * @route   GET /api/orders/:id/invoice
 * @access  Private (مالک یا ادمین)
 */
exports.downloadInvoice = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');

  if (!order) {
    return next(new AppError('سفارش یافت نشد', 404));
  }

  if (!order.isPaid) {
    return next(new AppError('فاکتور فقط برای سفارشات پرداخت شده در دسترس است', 400));
  }

  // TODO: تولید PDF (pdfkit یا هر سرویس دیگر)

  return res.status(200).json({
    success: true,
    message: 'دانلود فاکتور به زودی فعال می‌شود',
    data: order
  });
});

/**
 * ====================================
 * 👨‍💼 ADMIN CONTROLLERS - کنترلرهای ادمین
 * ====================================
 */

/**
 * @desc    دریافت همه سفارش‌ها
 * @route   GET /api/orders/admin/all
 * @access  Private/Admin
 */
exports.getOrders = catchAsync(async (req, res, next) => {
  const {
    status,
    search,
    userId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sort = '-createdAt'
  } = req.query;

  const safeLimit = Math.min(parseInt(limit) || 20, 100);
  const skip = (parseInt(page) - 1) * safeLimit;
  const filter = {};

  if (status) filter.status = status;
  if (userId) filter.user = userId;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    const q = new RegExp(search, 'i');
    filter.$or = [
      { orderNumber: String(search).toUpperCase() },
      { 'shippingAddress.fullName': q },
      { 'shippingAddress.phone': q }
    ];
  }

  const sortFields = String(sort).split(',').join(' ');

  const [orders, totalOrders] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort(sortFields)
      .skip(skip)
      .limit(safeLimit)
      .select('-adminNotes'),
    Order.countDocuments(filter)
  ]);

  return res.status(200).json({
    success: true,
    count: orders.length,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalOrders / safeLimit),
      totalOrders
    },
    data: orders
  });
});

/**
 * @desc    آمار سفارشات
 * @route   GET /api/orders/admin/stats
 * @access  Private/Admin
 */
exports.getOrderStats = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const statsByStatus = await Order.getStats(startDate, endDate);
  const totalRevenue = await Order.getTotalRevenue();

  // سفارشات امروز
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });

  // سفارشات در انتظار
  const pendingOrders = await Order.countDocuments({ status: 'pending' });

  return res.status(200).json({
    success: true,
    data: {
      totalRevenue,
      todayOrders,
      pendingOrders,
      statsByStatus
    }
  });
});

/**
 * @desc    تغییر وضعیت سفارش
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status, note, trackingInfo } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('سفارش یافت نشد', 404));

  // تغییر وضعیت
  await order.updateStatus(status, req.user._id, note);

  // ذخیره اطلاعات ردیابی
  if (status === 'shipped' && trackingInfo) {
    order.trackingInfo = {
      carrier: trackingInfo.carrier,
      trackingNumber: trackingInfo.trackingNumber,
      url: trackingInfo.url,
      lastUpdate: Date.now()
    };
    await order.save();
  }

  if (status === 'cancelled' && !order.cancellationDetails?.cancelledBy) {
    order.cancellationDetails = {
      cancelledBy: 'admin',
      reason: note || 'لغو توسط ادمین',
      cancelledAt: Date.now()
    };
    await order.save();
    // TODO: بازگرداندن موجودی
  }

  await order.populate('user', 'name email');

  try {
    cacheManager?.clearPattern?.('/api/orders');
  } catch (_) {}

  return res.status(200).json({
    success: true,
    message: `وضعیت به '${order.statusPersian || order.status}' تغییر یافت`,
    data: order
  });
});

/**
 * @desc    تحویل سفارش
 * @route   PUT /api/orders/:id/deliver
 * @access  Private/Admin
 */
exports.updateOrderToDelivered = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('سفارش یافت نشد', 404));

  if (!['shipped', 'processing'].includes(order.status)) {
    return next(new AppError('فقط سفارشات ارسال شده قابل تحویل هستند', 400));
  }

  await order.updateStatus('delivered', req.user._id, 'تحویل به مشتری');

  try {
    cacheManager?.clearPattern?.('/api/orders');
  } catch (_) {}

  return res.status(200).json({
    success: true,
    message: 'سفارش به عنوان تحویل شده علامت‌گذاری شد',
    data: order
  });
});

/**
 * @desc    پرداخت دستی (برای COD)
 * @route   PUT /api/orders/:id/pay
 * @access  Private/Admin
 */
exports.updateOrderToPaid = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('سفارش یافت نشد', 404));
  if (order.isPaid) return next(new AppError('این سفارش قبلاً پرداخت شده است', 400));

  const paymentResult = {
    id: `MANUAL-${Date.now()}`,
    status: 'PAID',
    update_time: new Date().toISOString()
  };

  await order.markAsPaid(paymentResult);

  try {
    cacheManager?.clearPattern?.('/api/orders');
  } catch (_) {}

  return res.status(200).json({
    success: true,
    message: 'سفارش به عنوان پرداخت شده علامت‌گذاری شد',
    data: order
  });
});