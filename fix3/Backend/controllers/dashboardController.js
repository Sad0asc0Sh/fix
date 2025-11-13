const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// GET /api/admin/dashboard/summary
exports.getDashboardSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const startOf7Days = new Date();
  startOf7Days.setHours(0, 0, 0, 0);
  // include today and previous 6 days
  startOf7Days.setDate(startOf7Days.getDate() - 6);

  const [todaySalesAgg, pendingOrdersCount, lowStockProducts, newUsersCount, latestOrders, salesAgg] = await Promise.all([
    // Today's sales total
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday, $lte: now } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]),

    // Pending orders count (status stored as lowercase in schema)
    Order.countDocuments({ status: 'pending' }),

    // Low stock products
    Product.find({ stock: { $lt: 10 } })
      .select('name stock')
      .sort({ stock: 1 })
      .limit(5)
      .lean(),

    // New users in last 24 hours
    User.countDocuments({ createdAt: { $gte: last24h } }),

    // Latest 5 orders
    Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id orderNumber user totalPrice status createdAt')
      .populate('user', 'name')
      .lean(),

    // Sales aggregated by day for last 7 days
    Order.aggregate([
      { $match: { createdAt: { $gte: startOf7Days, $lte: now } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$totalPrice' }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  // Normalize chart data into label series for past 7 days
  const labels = [];
  const sumsByDay = new Map(salesAgg.map((d) => [d._id, d.total]));
  const cursor = new Date(startOf7Days);
  while (cursor <= now) {
    const label = cursor.toISOString().slice(0, 10);
    labels.push(label);
    cursor.setDate(cursor.getDate() + 1);
  }
  const data = labels.map((l) => Math.round((sumsByDay.get(l) || 0) * 100) / 100);

  const todaySales = todaySalesAgg?.[0]?.total || 0;

  res.status(200).json({
    success: true,
    data: {
      todaySales,
      pendingOrdersCount,
      lowStockProducts,
      newUsersCount,
      latestOrders,
      salesChartData: { labels, data }
    }
  });
});

