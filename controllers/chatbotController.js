// ==============================================
// CHATBOT CONTROLLER - GEMINI AI POWERED
// ==============================================

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Expense = require('../models/Expense');
const { asyncHandler } = require('../middleware/errorMiddleware');

// ==============================================
// INITIALIZE GEMINI AI
// ==============================================

let genAI = null;
let model = null;

const initializeGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    return false;
  }

  console.log('🔑 API Key loaded:', apiKey.substring(0, 15) + '...');

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',  // ✅ FINAL: Using 2.5 flash lite (works with your API)
      generationConfig: {
        temperature: 1,
        topK: 64,
        topP: 0.95,
        maxOutputTokens: 65536,
      }
    });
    console.log('✅ Gemini AI initialized successfully with model: gemini-2.5-flash-lite');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Gemini:', error.message);
    return false;
  }
};

// Initialize on module load
const isInitialized = initializeGemini();
if (isInitialized) {
  console.log('🤖 Gemini AI is ready to use!');
} else {
  console.error('⚠️ Gemini AI initialization failed. Check API key.');
}

// ==============================================
// GENERATE GEMINI RESPONSE
// ==============================================

const generateGeminiResponse = async (context, userMessage) => {
  // Re-initialize if needed
  if (!model) {
    console.log('🔄 Re-initializing Gemini...');
    const initialized = initializeGemini();
    if (!initialized) {
      throw new Error('Gemini API not configured properly');
    }
  }

  const systemPrompt = `You are "Finsarthi AI" - an expert Indian financial advisor chatbot built for helping users manage money smartly.

## USER'S ACTUAL FINANCIAL DATA (USE THIS IN YOUR RESPONSES):
- Monthly Income: ₹${context.monthlyIncome.toLocaleString('en-IN')}
- This Month's Total Expenses: ₹${context.totalExpense.toLocaleString('en-IN')}
- Remaining Budget Available: ₹${context.remainingBudget.toLocaleString('en-IN')}
- Current Savings Rate: ${context.savingsRate}%
- Financial Risk Appetite: ${context.riskAppetite}
${context.savingsGoal > 0 ? `- Savings Goal Target: ₹${context.savingsGoal.toLocaleString('en-IN')}` : ''}

## TOP SPENDING CATEGORIES THIS MONTH:
${context.topExpenseCategories?.length > 0 
  ? context.topExpenseCategories.map((cat, i) => 
      `${i+1}. ${cat.name}: ₹${cat.amount.toLocaleString('en-IN')} (${cat.percentage}% of expenses)`
    ).join('\n') 
  : 'No expense data recorded yet'}

## RECENT TRANSACTIONS:
${context.recentExpenses?.length > 0 
  ? context.recentExpenses.join('\n') 
  : 'No recent transactions available'}

## YOUR EXPERTISE AREAS:
✅ Indian Government Schemes (PPF, Sukanya Samriddhi, NPS, SCSS, ELSS, Atal Pension Yojana, etc.)
✅ Banking Products (Union Bank, SBI, RBI schemes, FD, RD)
✅ Tax Planning (Section 80C, 80D, 80CCD, 80CCD(1B), HRA, LTA deductions)
✅ Investment Strategies (Mutual Funds, SIP, Index Funds, Gold Bonds, ETFs)
✅ Budget Management & Expense Optimization
✅ Purchase Decision Advice (Based on user's actual budget)
✅ EMI & Loan Calculations (Home loan, Car loan, Personal loan)
✅ Insurance Planning (Life, Health, Term insurance)
✅ Retirement & Financial Goal Planning
✅ Mathematical Calculations (Simple Interest, Compound Interest, EMI formulas)

## CRITICAL RESPONSE RULES:
1. **ALWAYS** use the user's REAL financial data shown above in your advice
2. **For purchase questions**: Check if amount fits in their ₹${context.remainingBudget.toLocaleString('en-IN')} remaining budget
3. **For calculations**: ALWAYS show complete calculation with final numeric answer (not just formula)
4. **Use Indian Rupee symbol**: ₹ for all amounts
5. **Be specific**: Give exact numbers based on their income/expenses
6. **For formulas**: Explain AND calculate with their actual numbers
7. **Stay financial**: If asked non-finance topics, politely redirect
8. **Be actionable**: Provide numbered steps they can follow immediately

## RESPONSE STYLE:
- Start with relevant emoji (💰📊🎯💡)
- Use bullet points • and numbered lists 1. 2. 3.
- Keep paragraphs short (2-3 lines max)
- Include specific calculations when relevant
- End with a helpful tip or follow-up question
- Use casual Indian English (mix Hindi words if natural)
- Be encouraging and supportive

## EXAMPLE RESPONSES:

**User asks:** "What is simple interest formula?"
**You respond:** 
💰 Simple Interest Formula

Formula: **SI = (P × R × T) ÷ 100**

Where:
• P = Principal (initial amount)
• R = Rate of interest (% per year)
• T = Time period (in years)

📝 Example Calculation:
Let's say you invest ₹1,00,000 at 8% for 2 years:

SI = (1,00,000 × 8 × 2) ÷ 100
SI = 16,00,000 ÷ 100
SI = **₹16,000**

Total Amount = ₹1,00,000 + ₹16,000 = **₹1,16,000**

💡 Quick Tip: For better returns, consider PPF (7.1%) or Sukanya Samriddhi (8.2%) which give tax benefits too!

---

**User asks:** "Can I buy ₹50,000 laptop?"
**You respond:** 
💻 Purchase Analysis for ₹50,000 Laptop

Your Financial Snapshot:
• Available Budget: ₹${context.remainingBudget.toLocaleString('en-IN')}
• Monthly Income: ₹${context.monthlyIncome.toLocaleString('en-IN')}
• Expenses So Far: ₹${context.totalExpense.toLocaleString('en-IN')}

${context.remainingBudget >= 50000 
  ? `✅ **Good News!** You can afford this laptop.

💡 Smart Purchase Strategy:
1. You have ₹${context.remainingBudget.toLocaleString('en-IN')} available
2. After purchase, you'll have ₹${(context.remainingBudget - 50000).toLocaleString('en-IN')} left
3. Keep at least ₹10,000 as emergency buffer

🎯 Recommendations:
• Look for Amazon/Flipkart sale (save ₹5,000-8,000)
• Use credit card cashback offers
• Compare prices across platforms
• Check for bank EMI offers (0% interest)

Would you like me to suggest best times to buy electronics?`
  : `⚠️ **Hold On!** This might stretch your budget.

Current Situation:
• You need: ₹50,000
• You have: ₹${context.remainingBudget.toLocaleString('en-IN')}
• Shortfall: ₹${(50000 - context.remainingBudget).toLocaleString('en-IN')}

💡 Better Options:
1. Wait for next month and save ₹${Math.ceil((50000 - context.remainingBudget)/30).toLocaleString('en-IN')}/day
2. Look for ₹30,000-35,000 laptops (great options available)
3. Consider refurbished laptops (₹25,000-30,000)
4. Check for 0% EMI (₹4,200/month for 12 months)

Want me to create a savings plan to buy this laptop in 2 months?`}

---

Now answer the user's question using their actual financial data:`;

  // Build full prompt with conversation history
  let fullPrompt = systemPrompt + '\n\n';
  
  if (context.chatHistory && context.chatHistory.length > 0) {
    fullPrompt += '--- RECENT CONVERSATION ---\n';
    context.chatHistory.slice(-4).forEach(chat => {
      fullPrompt += `User: ${chat.user}\nAssistant: ${chat.bot}\n\n`;
    });
  }
  
  fullPrompt += `User: ${userMessage}\n\nAssistant:`;

  console.log('\n🤖 Sending request to Gemini AI...');
  console.log('📝 User Question:', userMessage);

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiResponse = response.text();

    console.log('✅ Gemini AI responded successfully!');
    console.log('📄 Response length:', aiResponse.length, 'characters');

    return {
      success: true,
      response: aiResponse,
      intent: detectIntent(userMessage)
    };
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    console.error('❌ Error Details:', error);
    throw error;
  }
};

// ==============================================
// INTENT DETECTION
// ==============================================

const detectIntent = (message) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.match(/buy|purchase|afford|kharid|le sakte|buy kar/i)) {
    return 'purchase_advice';
  }
  if (lowerMessage.match(/save|saving|bachao|bachat|बचत/i)) {
    return 'saving_advice';
  }
  if (lowerMessage.match(/invest|sip|mutual fund|stock|nivesh/i)) {
    return 'investment_query';
  }
  if (lowerMessage.match(/expense|spending|kharcha|reduce|kam/i)) {
    return 'expense_query';
  }
  if (lowerMessage.match(/scheme|ppf|nps|sukanya|yojana|सुकन्या/i)) {
    return 'scheme_info';
  }
  if (lowerMessage.match(/tax|80c|80d|80ccd|deduction/i)) {
    return 'tax_planning';
  }
  if (lowerMessage.match(/budget|plan|planning/i)) {
    return 'budget_query';
  }
  if (lowerMessage.match(/loan|emi|कर्ज/i)) {
    return 'loan_query';
  }
  if (lowerMessage.match(/simple interest|compound interest|calculate|formula|ब्याज/i)) {
    return 'calculation';
  }
  
  return 'general';
};

// ==============================================
// @desc    Send Message to Chatbot
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

  console.log('\n========================================');
  console.log('📨 New Message from User:', userId);
  console.log('💬 Message:', message);
  console.log('========================================');

  // Get user data
  const user = await User.findById(userId);
  
  // Date range for current month
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  endDate.setHours(23, 59, 59, 999);
  
  // Get financial data
  let totalExpense = 0;
  let totalIncome = user?.monthlyIncome || 50000;
  let categoryBreakdown = [];
  let recentExpenses = [];

  try {
    const expenseData = await Expense.getTotalByDateRange(userId, startDate, endDate, 'expense');
    const incomeData = await Expense.getTotalByDateRange(userId, startDate, endDate, 'income');
    
    totalExpense = expenseData?.total || 0;
    totalIncome = incomeData?.total || user?.monthlyIncome || 50000;
    
    categoryBreakdown = await Expense.getByCategory(userId, startDate, endDate) || [];
    recentExpenses = await Expense.find({ user: userId })
      .sort({ date: -1 })
      .limit(5)
      .select('category amount description date') || [];
  } catch (error) {
    console.log('⚠️ Could not fetch expense data:', error.message);
  }

  const remainingBudget = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((remainingBudget / totalIncome) * 100).toFixed(1) : 0;
  
  const topExpenseCategories = categoryBreakdown.slice(0, 5).map(cat => ({
    name: cat.category || cat._id,
    amount: cat.total,
    percentage: totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(1) : 0
  }));
  
  // Chat history
  let chatHistory = [];
  try {
    const history = await Chat.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('userMessage botResponse');
    
    chatHistory = history.reverse().map(c => ({
      user: c.userMessage,
      bot: c.botResponse
    }));
  } catch (error) {
    console.log('⚠️ Could not fetch chat history');
  }
  
  // Build context
  const context = {
    monthlyIncome: totalIncome,
    totalExpense,
    remainingBudget,
    savingsRate: parseFloat(savingsRate),
    savingsGoal: user?.savingsGoal || 0,
    riskAppetite: user?.riskAppetite || 'Medium',
    topExpenseCategories,
    recentExpenses: recentExpenses.map(e => 
      `• ${e.category}: ₹${e.amount} ${e.description ? `(${e.description})` : ''}`
    ),
    chatHistory
  };

  console.log('📊 Financial Context:');
  console.log(`   Income: ₹${context.monthlyIncome}`);
  console.log(`   Expenses: ₹${context.totalExpense}`);
  console.log(`   Available: ₹${context.remainingBudget}`);

  try {
    // Generate AI response
    const aiResult = await generateGeminiResponse(context, message);
    
    // Save to database
    const chat = await Chat.create({
      user: userId,
      userMessage: message,
      botResponse: aiResult.response,
      financialContext: {
        monthlyIncome: totalIncome,
        totalExpense,
        savingsRate: parseFloat(savingsRate),
        recentExpenses: context.recentExpenses.slice(0, 3)
      },
      intent: aiResult.intent
    });

    console.log('✅ Response generated and saved!');

    res.status(200).json({
      success: true,
      data: {
        message: aiResult.response,
        intent: aiResult.intent,
        chatId: chat._id,
        timestamp: chat.createdAt,
        aiPowered: true
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    res.status(500).json({
      success: false,
      message: `Failed to generate response: ${error.message}`
    });
  }
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
// @desc    Toggle Star
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
// @desc    Clear History
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

// ==============================================
// @desc    Get Suggestions
// @route   GET /api/chatbot/suggestions
// @access  Public
// ==============================================

exports.getQuickSuggestions = asyncHandler(async (req, res) => {
  const suggestions = [
    "Can I afford to buy a ₹50,000 laptop?",
    "How can I save more money this month?",
    "Best tax-saving schemes under Section 80C",
    "Compare PPF vs Sukanya Samriddhi Yojana",
    "Calculate simple interest for ₹1 lakh at 8% for 2 years",
    "What is EMI formula? Calculate for ₹10 lakh at 8.5%",
    "Best government schemes for senior citizens",
    "How to reduce my monthly expenses?"
  ];

  res.status(200).json({
    success: true,
    count: suggestions.length,
    data: suggestions
  });
});

// ==============================================
// @desc    Health Check
// @route   GET /api/chatbot/health
// @access  Public
// ==============================================

exports.checkHealth = asyncHandler(async (req, res) => {
  const isConfigured = !!process.env.GEMINI_API_KEY;
  const apiKeyPreview = isConfigured 
    ? `${process.env.GEMINI_API_KEY.substring(0, 15)}...` 
    : 'NOT SET';
  
  res.status(200).json({
    success: true,
    data: {
      geminiConfigured: isConfigured,
      apiKeyPreview: apiKeyPreview,
      status: isConfigured ? 'Gemini AI Ready ✅' : 'API Key Missing ❌',
      model: 'gemini-2.5-flash-lite',  // ✅ UPDATED
      timestamp: new Date()
    }
  });
});

module.exports = exports;