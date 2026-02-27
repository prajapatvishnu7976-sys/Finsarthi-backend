// ==============================================
// FINSARTHI BACKEND - MAIN SERVER (HACKATHON READY)
// ==============================================

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// ✅ LOAD .env FILE FIRST (CRITICAL FIX)
const envPath = path.join(__dirname, '.env');
console.log('📁 Loading .env from:', envPath);

const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  console.error('❌ Error loading .env file:', envResult.error.message);
  console.log('⚠️ Trying default .env location...');
  dotenv.config(); // Fallback to default
}

console.log('✅ Environment variables loaded!');
console.log('🔑 GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 20)}... ✅` : '❌ NOT FOUND');
console.log('🔑 PORT:', process.env.PORT || '5001 (default)');
console.log('🔑 NODE_ENV:', process.env.NODE_ENV || 'development (default)');

// Import configurations
const connectDB = require('./config/db');
const passportConfig = require('./config/passport');

// Import middleware
const { errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const academyRoutes = require('./routes/academyRoutes');
const plannerRoutes = require('./routes/plannerRoutes');

// Import services
const { startScheduledJobs, stopScheduledJobs } = require('./services/alertService');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ==============================================
// MIDDLEWARE SETUP
// ==============================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Rate limiting
app.use('/api/', apiLimiter);

// Passport initialization
app.use(passport.initialize());
passportConfig(passport);

// Static files
app.use('/uploads', express.static('public/uploads'));

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ==============================================
// ROUTES
// ==============================================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Finsarthi API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 FINSARTHI API - Your AI Financial Companion',
    version: '1.0.0',
    tagline: 'Crafting Your Financial Future with Intelligence and Ease',
    features: [
      '💰 AI-Powered Expense Tracking',
      '🤖 Smart Financial Chatbot (Gemini AI)',
      '📚 Gamified Learning Academy',
      '🎯 Goal-Based Financial Planner',
      '🏛️ Government Schemes Hub',
      '📊 Advanced Analytics & Insights'
    ],
    documentation: '/api'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/advisor', purchaseRoutes);
app.use('/api/academy', academyRoutes);
app.use('/api/planner', plannerRoutes);

// API documentation route
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Finsarthi API Documentation',
    version: '1.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    endpoints: {
      authentication: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/me',
        updatePassword: 'PUT /api/auth/update-password'
      },
      expenses: {
        getAll: 'GET /api/expenses',
        create: 'POST /api/expenses',
        update: 'PUT /api/expenses/:id',
        delete: 'DELETE /api/expenses/:id'
      },
      budget: {
        getAll: 'GET /api/budget',
        create: 'POST /api/budget',
        update: 'PUT /api/budget/:id',
        delete: 'DELETE /api/budget/:id'
      },
      analytics: {
        dashboard: 'GET /api/analytics/dashboard',
        trends: 'GET /api/analytics/trends',
        insights: 'GET /api/analytics/insights'
      },
      chatbot: {
        sendMessage: 'POST /api/chatbot/message',
        getHistory: 'GET /api/chatbot/history',
        clearHistory: 'DELETE /api/chatbot/clear',
        health: 'GET /api/chatbot/health'
      },
      advisor: {
        purchaseCheck: 'POST /api/advisor/purchase-check',
        healthScore: 'GET /api/advisor/health-score'
      },
      academy: {
        getAllCourses: 'GET /api/academy/courses',
        getCourse: 'GET /api/academy/courses/:id',
        enrollCourse: 'POST /api/academy/courses/:id/enroll',
        completeChapter: 'POST /api/academy/courses/:courseId/chapters/:chapterNumber/complete',
        getProgress: 'GET /api/academy/progress',
        leaderboard: 'GET /api/academy/leaderboard'
      },
      planner: {
        getAllGoals: 'GET /api/planner/goals',
        createGoal: 'POST /api/planner/goals',
        updateGoal: 'PUT /api/planner/goals/:id',
        deleteGoal: 'DELETE /api/planner/goals/:id',
        addContribution: 'POST /api/planner/goals/:id/contribute',
        getInsights: 'GET /api/planner/insights'
      }
    },
    websocket: {
      events: ['expense-added', 'budget-alert', 'goal-milestone']
    }
  });
});

// Schemes data route (static JSON)
app.get('/api/schemes', (req, res) => {
  try {
    const schemes = require('./data/schemes.json');
    res.status(200).json({
      success: true,
      count: schemes.length,
      data: schemes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load schemes data'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    requestedUrl: req.originalUrl,
    availableRoutes: '/api'
  });
});

// Error handling middleware
app.use(errorHandler);

// ==============================================
// SOCKET.IO EVENTS (Real-time features)
// ==============================================

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their room`);
  });

  socket.on('expense-added', (data) => {
    io.to(data.userId).emit('expense-update', data);
    console.log(`💸 Expense update sent to user ${data.userId}`);
  });

  socket.on('budget-alert', (data) => {
    io.to(data.userId).emit('alert', {
      type: 'budget',
      message: data.message,
      severity: data.severity
    });
    console.log(`⚠️ Budget alert sent to user ${data.userId}`);
  });

  socket.on('goal-milestone', (data) => {
    io.to(data.userId).emit('notification', {
      type: 'milestone',
      message: data.message,
      goalId: data.goalId
    });
    console.log(`🎯 Goal milestone sent to user ${data.userId}`);
  });

  socket.on('chatbot-typing', (data) => {
    io.to(data.userId).emit('bot-typing', { isTyping: true });
    setTimeout(() => {
      io.to(data.userId).emit('bot-typing', { isTyping: false });
    }, 2000);
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

app.set('io', io);

// ==============================================
// DATABASE CONNECTION & SERVER START
// ==============================================

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    startScheduledJobs();
    console.log('✅ All scheduled jobs started');

    server.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║        🚀 FINSARTHI API SERVER RUNNING       ║
║                                               ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(33)}║
║   Port: ${PORT.toString().padEnd(39)}║
║   URL: http://localhost:${PORT.toString().padEnd(18)}║
║                                               ║
║   📊 Database: Connected                     ║
║   ⏰ Cron Jobs: Active                       ║
║   🔌 WebSocket: Active                       ║
║   🤖 AI Chatbot: ${process.env.GEMINI_API_KEY ? 'Ready ✅' : 'Not Configured ❌'.padEnd(29)}║
║   📚 Academy: 10 Courses Loaded              ║
║   🎯 Planner: Active                         ║
║   🏛️ Schemes: 10+ Available                 ║
║                                               ║
╚═══════════════════════════════════════════════╝
      `);
      
      console.log('\n📋 Available Features:');
      console.log('   ✅ AI-Powered Expense Tracking');
      console.log('   ✅ Smart Financial Chatbot (Gemini AI)');
      console.log('   ✅ Gamified Learning Academy');
      console.log('   ✅ Goal-Based Financial Planner');
      console.log('   ✅ Purchase Advisor');
      console.log('   ✅ Government Schemes Hub');
      console.log('   ✅ Real-time Analytics\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// ==============================================
// GRACEFUL SHUTDOWN
// ==============================================

const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️  ${signal} received, shutting down gracefully...`);
  
  stopScheduledJobs();
  console.log('✅ Scheduled jobs stopped');
  
  io.close(() => {
    console.log('✅ WebSocket connections closed');
  });
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    console.log('👋 Shutdown complete. Goodbye!\n');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:');
  console.error(err);
  gracefulShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:');
  console.error(err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

startServer();

module.exports = app;