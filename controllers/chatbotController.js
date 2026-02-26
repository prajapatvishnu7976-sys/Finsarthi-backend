// ==============================================
// CHATBOT CONTROLLER - AI FINBOT
// ==============================================

const Chat = require('../models/Chat');
const User = require('../models/User');
const Expense = require('../models/Expense');
const { asyncHandler } = require('../middleware/errorMiddleware');

// ==============================================
// AI HELPER FUNCTION (Replace with actual AI API)
// ==============================================

const generateAIResponse = async (context, userMessage) => {
  // TODO: Integrate with actual AI API (OpenRouter, Groq, HuggingFace)
  // For now, rule-based responses
  
  const lowerMessage = userMessage.toLowerCase();
  
  // Intent detection
  if (lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
    return {
      intent: 'purchase_advice',
      response: `Based on your financial profile:
        
💰 Monthly Income: ₹${context.monthlyIncome.toLocaleString('en-IN')}
💸 Current Expenses: ₹${context.totalExpense.toLocaleString('en-IN')}
💵 Available Budget: ₹${context.remainingBudget.toLocaleString('en-IN')}

${context.remainingBudget > 5000 
  ? `✅ You have good financial buffer! You can consider making this purchase.

📋 My Recommendations:
1. Keep at least 20% of purchase amount as emergency buffer
2. Check for upcoming sale seasons (Diwali, Amazon/Flipkart sales)
3. Consider EMI only if it's less than 30% of your monthly savings

🎯 Smart Tip: Compare prices across platforms and use cashback offers!`
  : `⚠️ Your current financial situation suggests waiting.

🔍 Analysis:
- You've already spent ${((context.totalExpense/context.monthlyIncome)*100).toFixed(0)}% of monthly income
- Remaining budget is tight

💡 Better Strategy:
1. Save ₹${Math.ceil(5000/30)}/day for next month
2. Wait for festive sales
3. Consider refurbished/second-hand options

Would you like me to create a saving plan for this purchase?`
}`
    };
  }
  
  if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
    return {
      intent: 'saving_advice',
      response: `💰 Your Current Savings Analysis:

📊 Savings Rate: ${context.savingsRate}%
${context.savingsRate >= 30 
  ? `🎉 Excellent! You're saving more than recommended 20%` 
  : context.savingsRate >= 20 
    ? `✅ Good! You're on track` 
    : `⚠️ Try to increase savings to at least 20% of income`}

🎯 Personalized Saving Tips:

1️⃣ 50-30-20 Rule:
   • 50% Needs (₹${(context.monthlyIncome * 0.5).toLocaleString('en-IN')})
   • 30% Wants (₹${(context.monthlyIncome * 0.3).toLocaleString('en-IN')})
   • 20% Savings (₹${(context.monthlyIncome * 0.2).toLocaleString('en-IN')})

2️⃣ Cut These Categories:
${context.topExpenseCategories?.map((cat, i) => 
  `   ${i+1}. ${cat.name}: ₹${cat.amount.toLocaleString('en-IN')} (${cat.percentage}% of expenses)`
).join('\n') || '   Review your expense breakdown in Analytics'}

3️⃣ Auto-Save Strategy:
   • Set up automatic transfer of ₹${Math.round(context.monthlyIncome * 0.2)} on salary day
   • Use apps like Paytm Money or Groww for SIP

🚀 Goal: Increase savings by ₹5000/month = ₹60,000/year!`
    };
  }
  
  if (lowerMessage.includes('invest') || lowerMessage.includes('mutual fund') || lowerMessage.includes('sip')) {
    return {
      intent: 'investment_query',
      response: `📈 Investment Guidance Based on Your Profile:

💼 Your Investment Capacity:
   • Monthly Surplus: ₹${context.remainingBudget.toLocaleString('en-IN')}
   • Recommended Investment: ₹${Math.round(context.remainingBudget * 0.6).toLocaleString('en-IN')}

🎯 Beginner-Friendly Options:

1️⃣ Mutual Funds (SIP):
   • Index Funds (Nifty 50) - Low risk, 10-12% returns
   • Balanced Funds - Medium risk, 12-15% returns
   • Start with ₹500-1000/month

2️⃣ Fixed Deposits:
   • Bank FD: 6-7% (Safe)
   • Corporate FD: 8-9% (Moderate risk)

3️⃣ Public Provident Fund (PPF):
   • 7.1% interest, Tax-free
   • Lock-in: 15 years
   • Min: ₹500, Max: ₹1.5L/year

📱 Recommended Apps:
   • Groww (User-friendly)
   • Zerodha Kite (Advanced)
   • Paytm Money (Mutual Funds)

⚠️ Important:
   • Don't invest more than 60% of surplus
   • Keep 3-6 months emergency fund
   • Diversify across asset classes

💡 Want me to create a personalized investment plan?`
    };
  }
  
  if (lowerMessage.includes('expense') || lowerMessage.includes('spending')) {
    return {
      intent: 'expense_query',
      response: `📊 Your Expense Analysis:

💸 This Month's Spending: ₹${context.totalExpense.toLocaleString('en-IN')}

📈 Top 3 Categories:
${context.topExpenseCategories?.slice(0, 3).map((cat, i) => 
  `${i+1}. ${cat.name}: ₹${cat.amount.toLocaleString('en-IN')} (${cat.percentage}%)`
).join('\n') || 'No expense data yet'}

${context.totalExpense > context.monthlyIncome * 0.8 
  ? `⚠️ Alert: You've spent ${((context.totalExpense/context.monthlyIncome)*100).toFixed(0)}% of income!

🚨 Action Required:
1. Review discretionary spending (Food, Entertainment)
2. Cancel unused subscriptions
3. Track daily expenses using our app

💡 Quick Wins:
   • Cook at home 3 more times/week = Save ₹2000
   • Use public transport 2 days/week = Save ₹800
   • Cancel unused OTT = Save ₹500`
  : `✅ Your spending is under control!

💡 Optimization Tips:
1. Set category-wise budgets
2. Use cashback apps (Cred, Paytm)
3. Review recurring expenses monthly`}

🎯 Goal: Keep expenses below 70% of income`
    };
  }
  
  if (lowerMessage.includes('scheme') || lowerMessage.includes('government')) {
    return {
      intent: 'scheme_info',
      response: `🏛️ Popular Government Schemes for You:

1️⃣ Public Provident Fund (PPF)
   • Interest: 7.1% p.a.
   • Tax benefit: Under 80C
   • Lock-in: 15 years
   • Investment: ₹500 - ₹1.5L/year

2️⃣ Sukanya Samriddhi Yojana
   • For girl child
   • Interest: 8.0% p.a.
   • Maturity: 21 years

3️⃣ National Pension Scheme (NPS)
   • Retirement planning
   • Tax benefit up to ₹2L
   • Market-linked returns

4️⃣ Pradhan Mantri Jeevan Jyoti Bima
   • Life insurance: ₹2 Lakh
   • Premium: ₹436/year
   • Age: 18-50 years

5️⃣ Atal Pension Yojana
   • Pension: ₹1000-5000/month
   • After 60 years

📱 Check our "Schemes Hub" for detailed info and direct links!

💡 Need help choosing? Tell me your:
   • Age
   • Investment goal (retirement/education/tax-saving)
   • Risk appetite`
    };
  }
  
  // Default general response
  return {
    intent: 'general',
    response: `👋 Hello! I'm your AI Financial Assistant.

I can help you with:

💰 **Money Management**
   • "Should I buy [product]?"
   • "How can I save more?"
   • "Analyze my expenses"

📈 **Investments**
   • "Best mutual funds?"
   • "How to start SIP?"
   • "Where to invest ₹10,000?"

🎯 **Financial Planning**
   • "Plan for buying a car"
   • "Save for wedding"
   • "Emergency fund tips"

🏛️ **Government Schemes**
   • "PPF details"
   • "Tax-saving schemes"
   • "Pension plans"

💡 **Quick Tips:**
Try asking: 
   • "Can I afford ₹50,000 laptop?"
   • "How to reduce Food expenses?"
   • "Best scheme for retirement?"

What would you like to know? 😊`
  };
};

// ==============================================
// @desc    Send Message to AI Chatbot
// @route   POST /api/chatbot/message
// @access  Private
// ==============================================

exports.sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message is required'
    });
  }

  // Get user's financial context
  const user = await User.findById(userId);
  
  // Get current month expenses
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  endDate.setHours(23, 59, 59, 999);
  
  const expenseData = await Expense.getTotalByDateRange(userId, startDate, endDate, 'expense');
  const incomeData = await Expense.getTotalByDateRange(userId, startDate, endDate, 'income');
  
  const totalExpense = expenseData.total || 0;
  const totalIncome = incomeData.total || user.monthlyIncome || 0;
  const remainingBudget = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((remainingBudget / totalIncome) * 100).toFixed(1) : 0;
  
  // Get top expense categories
  const categoryBreakdown = await Expense.getByCategory(userId, startDate, endDate);
  const topExpenseCategories = categoryBreakdown.slice(0, 5).map(cat => ({
    name: cat.category,
    amount: cat.total,
    percentage: totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(1) : 0
  }));
  
  // Get recent expenses
  const recentExpenses = await Expense.find({ user: userId })
    .sort({ date: -1 })
    .limit(5)
    .select('category amount description date');
  
  // Get chat history (last 5 messages for context)
  const chatHistory = await Chat.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('userMessage botResponse');
  
  // Build context for AI
  const context = {
    monthlyIncome: totalIncome,
    totalExpense,
    remainingBudget,
    savingsRate: parseFloat(savingsRate),
    savingsGoal: user.savingsGoal || 0,
    riskAppetite: user.riskAppetite || 'Medium',
    topExpenseCategories,
    recentExpenses: recentExpenses.map(e => `${e.category}: ₹${e.amount}`),
    chatHistory: chatHistory.reverse().map(c => ({
      user: c.userMessage,
      bot: c.botResponse
    }))
  };
  
  // Generate AI response
  const aiResult = await generateAIResponse(context, message);
  
  // Save chat to database
  const chat = await Chat.create({
    user: userId,
    userMessage: message,
    botResponse: aiResult.response,
    financialContext: {
      monthlyIncome: totalIncome,
      totalExpense,
      savingsRate: parseFloat(savingsRate),
      recentExpenses: context.recentExpenses
    },
    intent: aiResult.intent || 'general'
  });

  res.status(200).json({
    success: true,
    data: {
      message: aiResult.response,
      intent: aiResult.intent,
      chatId: chat._id,
      timestamp: chat.createdAt
    }
  });
});

// ==============================================
// @desc    Get Chat History
// @route   GET /api/chatbot/history
// @access  Private
// ==============================================

exports.getChatHistory = asyncHandler(async (req, res) => {
  const { limit = 20, page = 1 } = req.query;
  const userId = req.user.id;

  const chats = await Chat.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .select('-financialContext');

  const total = await Chat.countDocuments({ user: userId });

  res.status(200).json({
    success: true,
    data: chats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ==============================================
// @desc    Star/Unstar a Chat
// @route   PUT /api/chatbot/:id/star
// @access  Private
// ==============================================

exports.toggleStar = asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ 
    _id: req.params.id, 
    user: req.user.id 
  });

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found'
    });
  }

  chat.isStarred = !chat.isStarred;
  await chat.save();

  res.status(200).json({
    success: true,
    data: chat
  });
});

// ==============================================
// @desc    Delete Chat
// @route   DELETE /api/chatbot/:id
// @access  Private
// ==============================================

exports.deleteChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ 
    _id: req.params.id, 
    user: req.user.id 
  });

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found'
    });
  }

  await chat.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Chat deleted successfully'
  });
});

// ==============================================
// @desc    Clear All Chat History
// @route   DELETE /api/chatbot/clear
// @access  Private
// ==============================================

exports.clearHistory = asyncHandler(async (req, res) => {
  await Chat.deleteMany({ user: req.user.id, isStarred: false });

  res.status(200).json({
    success: true,
    message: 'Chat history cleared (starred chats preserved)'
  });
});

module.exports = exports;