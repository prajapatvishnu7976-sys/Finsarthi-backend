// ==============================================
// CHATBOT ROUTES - GEMINI AI POWERED
// ==============================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  sendMessage,
  getChatHistory,
  toggleStar,
  deleteChat,
  clearHistory,
  getQuickSuggestions,
  checkHealth
} = require('../controllers/chatbotController');

// AI Chat Routes
router.post('/message', protect, sendMessage);
router.get('/history', protect, getChatHistory);
router.put('/:id/star', protect, toggleStar);
router.delete('/:id', protect, deleteChat);
router.delete('/clear', protect, clearHistory);

// Public Routes
router.get('/suggestions', getQuickSuggestions);
router.get('/health', checkHealth);

module.exports = router;