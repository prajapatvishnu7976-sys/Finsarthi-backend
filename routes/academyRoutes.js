// ==============================================
// ACADEMY ROUTES
// ==============================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAllCourses,
  getCourseById,
  enrollCourse,
  completeChapter,
  getUserProgress,
  getLeaderboard
} = require('../controllers/academyController');

router.get('/courses', getAllCourses);
router.get('/courses/:id', protect, getCourseById);
router.post('/courses/:id/enroll', protect, enrollCourse);
router.post('/courses/:courseId/chapters/:chapterNumber/complete', protect, completeChapter);
router.get('/progress', protect, getUserProgress);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;