// ==============================================
// CHATBOT ROUTES
// ==============================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  sendMessage,
  getChatHistory,
  toggleStar,
  deleteChat,
  clearHistory
} = require('../controllers/chatbotController');

router.post('/message', protect, sendMessage);
router.get('/history', protect, getChatHistory);
router.put('/:id/star', protect, toggleStar);
router.delete('/:id', protect, deleteChat);
router.delete('/clear', protect, clearHistory);

module.exports = router;