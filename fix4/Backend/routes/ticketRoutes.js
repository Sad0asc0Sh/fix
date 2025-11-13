const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');
const {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  replyToTicket,
  updateTicketStatus,
} = require('../controllers/ticketController');

// All routes require auth
router.use(protect);

// Create new ticket (logged-in user)
router.post('/', createTicket);

// Current user's tickets
router.get('/', getMyTickets);

// Admin: list all tickets
router.get('/admin/all', isAdmin, getAllTickets);

// Ticket details (owner or admin enforced in controller)
router.get('/:id', getTicketById);

// Reply to ticket (owner or admin)
router.post('/:id/reply', replyToTicket);

// Admin: update ticket status
router.put('/:id/status', isAdmin, updateTicketStatus);

module.exports = router;

