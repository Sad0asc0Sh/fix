const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/apiResponse');

// POST /api/tickets
exports.createTicket = catchAsync(async (req, res) => {
  const { subject, message, priority, order } = req.body || {};
  if (!subject || !message) {
    throw new AppError('موضوع و متن پیام الزامی است', 400);
  }

  const payload = {
    user: req.user._id,
    subject: String(subject).trim(),
    priority: priority && ['low', 'medium', 'high'].includes(priority) ? priority : undefined,
    order: order && mongoose.Types.ObjectId.isValid(order) ? order : undefined,
    messages: [
      { sender: req.user._id, message: String(message).trim(), timestamp: new Date() },
    ],
  };

  const ticket = await Ticket.create(payload);
  return ApiResponse.success(res, ticket, 'تیکت ایجاد شد', 201);
});

// GET /api/tickets (current user)
exports.getMyTickets = catchAsync(async (req, res) => {
  const { status, priority, page = 1, limit = 20, sort = '-createdAt', search } = req.query;
  const safeLimit = Math.min(parseInt(limit) || 20, 100);
  const skip = (parseInt(page) - 1) * safeLimit;

  const filter = { user: req.user._id };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) {
    const q = new RegExp(String(search), 'i');
    filter.$or = [{ subject: q }, { 'messages.message': q }];
  }

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate('user', 'name email')
      .populate('order', 'orderNumber totalPrice')
      .sort(String(sort).split(',').join(' '))
      .skip(skip)
      .limit(safeLimit),
    Ticket.countDocuments(filter),
  ]);

  return ApiResponse.success(res, tickets, 'Success', 200);
});

// GET /api/tickets/admin/all (admin)
exports.getAllTickets = catchAsync(async (req, res) => {
  const { status, priority, userId, page = 1, limit = 20, sort = '-createdAt', search } = req.query;
  const safeLimit = Math.min(parseInt(limit) || 20, 100);
  const skip = (parseInt(page) - 1) * safeLimit;

  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.user = userId;
  if (search) {
    const q = new RegExp(String(search), 'i');
    filter.$or = [{ subject: q }, { 'messages.message': q }];
  }

  const sortFields = String(sort).split(',').join(' ');
  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate('user', 'name email')
      .populate('order', 'orderNumber totalPrice')
      .sort(sortFields)
      .skip(skip)
      .limit(safeLimit),
    Ticket.countDocuments(filter),
  ]);

  return ApiResponse.successWithPagination(res, tickets, {
    page: parseInt(page),
    limit: safeLimit,
    totalItems: total,
  });
});

// GET /api/tickets/:id (owner or admin)
exports.getTicketById = catchAsync(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('user', 'name email')
    .populate('messages.sender', 'name email')
    .populate('order', 'orderNumber totalPrice');
  if (!ticket) throw new AppError('تیکت یافت نشد', 404);

  if (req.user.role !== 'admin' && String(ticket.user) !== String(req.user._id)) {
    throw new AppError('عدم دسترسی', 403);
  }

  return ApiResponse.success(res, ticket);
});

// POST /api/tickets/:id/reply (owner or admin)
exports.replyToTicket = catchAsync(async (req, res) => {
  const { message } = req.body || {};
  if (!message) throw new AppError('متن پیام الزامی است', 400);

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new AppError('تیکت یافت نشد', 404);

  if (req.user.role !== 'admin' && String(ticket.user) !== String(req.user._id)) {
    throw new AppError('عدم دسترسی', 403);
  }

  ticket.messages.push({ sender: req.user._id, message: String(message).trim(), timestamp: new Date() });
  // Optionally, if ticket is closed, reopen to pending on reply
  if (ticket.status === 'closed') ticket.status = 'pending';
  await ticket.save();

  const populated = await Ticket.findById(ticket._id)
    .populate('user', 'name email')
    .populate('messages.sender', 'name email')
    .populate('order', 'orderNumber totalPrice');

  return ApiResponse.success(res, populated, 'پاسخ ثبت شد');
});

// PUT /api/tickets/:id/status (admin)
exports.updateTicketStatus = catchAsync(async (req, res) => {
  const { status } = req.body || {};
  const allowed = ['open', 'pending', 'closed'];
  if (!allowed.includes(status)) throw new AppError('وضعیت نامعتبر است', 400);

  const ticket = await Ticket.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  )
    .populate('user', 'name email')
    .populate('messages.sender', 'name email')
    .populate('order', 'orderNumber totalPrice');

  if (!ticket) throw new AppError('تیکت یافت نشد', 404);
  return ApiResponse.success(res, ticket, 'وضعیت تیکت به‌روزرسانی شد');
});

