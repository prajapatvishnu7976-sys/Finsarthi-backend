// ==============================================
// ACADEMY CONTROLLER - GAMIFIED LEARNING
// ==============================================

const Course = require('../models/Course');
const UserProgress = require('../models/UserProgress');
const { asyncHandler } = require('../middleware/errorMiddleware');

// ==============================================
// @desc    Get All Courses
// @route   GET /api/academy/courses
// @access  Public
// ==============================================

exports.getAllCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ isPublished: true })
    .select('-chapters.content -chapters.quiz')
    .sort({ category: 1, level: 1 });

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses
  });
});

// ==============================================
// @desc    Get Course Details
// @route   GET /api/academy/courses/:id
// @access  Private
// ==============================================

exports.getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

  // Get user's progress for this course
  const userProgress = await UserProgress.findOne({ user: req.user.id });
  const courseProgress = userProgress?.courses.find(
    c => c.course.toString() === req.params.id
  );

  res.status(200).json({
    success: true,
    data: {
      course,
      progress: courseProgress || null
    }
  });
});

// ==============================================
// @desc    Enroll in Course
// @route   POST /api/academy/courses/:id/enroll
// @access  Private
// ==============================================

exports.enrollCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

  let userProgress = await UserProgress.findOne({ user: req.user.id });

  if (!userProgress) {
    userProgress = await UserProgress.create({ user: req.user.id });
  }

  // Check if already enrolled
  const alreadyEnrolled = userProgress.courses.some(
    c => c.course.toString() === req.params.id
  );

  if (alreadyEnrolled) {
    return res.status(400).json({
      success: false,
      message: 'Already enrolled in this course'
    });
  }

  // Enroll user
  userProgress.courses.push({
    course: req.params.id,
    enrolledAt: new Date()
  });

  await userProgress.save();

  // Increment course enrollment count
  course.enrolledCount += 1;
  await course.save();

  res.status(200).json({
    success: true,
    message: 'Successfully enrolled in course',
    data: userProgress
  });
});

// ==============================================
// @desc    Complete Chapter
// @route   POST /api/academy/courses/:courseId/chapters/:chapterNumber/complete
// @access  Private
// ==============================================

exports.completeChapter = asyncHandler(async (req, res) => {
  const { courseId, chapterNumber } = req.params;
  const { quizScore, timeSpent } = req.body;

  const course = await Course.findById(courseId);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

  const chapter = course.chapters.find(ch => ch.chapterNumber === parseInt(chapterNumber));

  if (!chapter) {
    return res.status(404).json({
      success: false,
      message: 'Chapter not found'
    });
  }

  let userProgress = await UserProgress.findOne({ user: req.user.id });

  if (!userProgress) {
    return res.status(400).json({
      success: false,
      message: 'Please enroll in the course first'
    });
  }

  const courseProgress = userProgress.courses.find(
    c => c.course.toString() === courseId
  );

  if (!courseProgress) {
    return res.status(400).json({
      success: false,
      message: 'Not enrolled in this course'
    });
  }

  // Check if already completed
  const alreadyCompleted = courseProgress.completedChapters.some(
    ch => ch.chapterNumber === parseInt(chapterNumber)
  );

  if (!alreadyCompleted) {
    // Add chapter to completed
    courseProgress.completedChapters.push({
      chapterNumber: parseInt(chapterNumber),
      completedAt: new Date(),
      quizScore: quizScore || 0,
      timeSpent: timeSpent || 0
    });

    // Add points
    const points = chapter.points || 10;
    courseProgress.totalPoints += points;
    userProgress.totalPoints += points;

    // Update progress percentage
    const totalChapters = course.chapters.length;
    courseProgress.progress = Math.round((courseProgress.completedChapters.length / totalChapters) * 100);

    // Check if course completed
    if (courseProgress.completedChapters.length === totalChapters) {
      courseProgress.isCompleted = true;
      courseProgress.completedAt = new Date();
      
      // Award completion badge
      if (!userProgress.achievements.includes('first_course')) {
        userProgress.achievements.push('first_course');
      }
    }

    // Update streak
    userProgress.updateStreak();

    // Calculate level
    userProgress.calculateLevel();

    // Check and award badges
    const newBadges = userProgress.checkAndAwardBadges();

    await userProgress.save();

    res.status(200).json({
      success: true,
      message: `Chapter completed! You earned ${points} points 🎉`,
      data: {
        pointsEarned: points,
        totalPoints: userProgress.totalPoints,
        level: userProgress.level,
        courseProgress: courseProgress.progress,
        newBadges: newBadges.length > 0 ? newBadges : undefined
      }
    });
  } else {
    res.status(200).json({
      success: true,
      message: 'Chapter already completed',
      data: courseProgress
    });
  }
});

// ==============================================
// @desc    Get User Progress
// @route   GET /api/academy/progress
// @access  Private
// ==============================================

exports.getUserProgress = asyncHandler(async (req, res) => {
  let userProgress = await UserProgress.findOne({ user: req.user.id })
    .populate({
      path: 'courses.course',
      select: 'title category thumbnail totalPoints totalDuration'
    });

  if (!userProgress) {
    userProgress = await UserProgress.create({ user: req.user.id });
  }

  res.status(200).json({
    success: true,
    data: userProgress
  });
});

// ==============================================
// @desc    Get Leaderboard
// @route   GET /api/academy/leaderboard
// @access  Private
// ==============================================

exports.getLeaderboard = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const leaderboard = await UserProgress.find()
    .select('user totalPoints level badges streak')
    .populate('user', 'name avatar')
    .sort({ totalPoints: -1 })
    .limit(parseInt(limit));

  // Get current user rank
  const currentUserProgress = await UserProgress.findOne({ user: req.user.id });
  let userRank = 0;

  if (currentUserProgress) {
    userRank = await UserProgress.countDocuments({
      totalPoints: { $gt: currentUserProgress.totalPoints }
    }) + 1;
  }

  res.status(200).json({
    success: true,
    data: {
      leaderboard,
      userRank,
      userPoints: currentUserProgress?.totalPoints || 0
    }
  });
});

module.exports = exports;