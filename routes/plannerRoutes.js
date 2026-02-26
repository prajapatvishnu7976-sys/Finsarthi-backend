// ==============================================
// PLANNER ROUTES
// ==============================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createGoal,
  getAllGoals,
  getGoalById,
  updateGoal,
  addContribution,
  deleteGoal,
  regenerateRecommendations,
  getInsights
} = require('../controllers/plannerController');

router.post('/goals', protect, createGoal);
router.get('/goals', protect, getAllGoals);
router.get('/goals/:id', protect, getGoalById);
router.put('/goals/:id', protect, updateGoal);
router.post('/goals/:id/contribute', protect, addContribution);
router.delete('/goals/:id', protect, deleteGoal);
router.post('/goals/:id/regenerate-ai', protect, regenerateRecommendations);
router.get('/insights', protect, getInsights);

module.exports = router;