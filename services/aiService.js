// ==============================================
// AI SERVICE (OpenAI / Gemini Integration)
// ==============================================

const axios = require('axios');

// ==============================================
// OpenAI Integration (if using GPT)
// ==============================================

async function getChatResponseOpenAI(message, context) {
  try {
    const systemPrompt = `You are a professional financial advisor AI assistant for Finsarthi app. 
    
User's Financial Context:
- Monthly Income: ₹${context.profile?.monthlyIncome || 0}
- Fixed Expenses: ₹${context.profile?.fixedExpenses || 0}
- Financial Health Score: ${context.profile?.healthScore || 0}/100 (${context.profile?.healthStatus || 'Unknown'})
- Current Month Expenses: ₹${context.currentMonth.expenses}
- Current Month Savings: ₹${context.currentMonth.savings}
- Savings Rate: ${context.currentMonth.savingsRate}%
- Debt: ₹${context.profile?.debt?.totalAmount || 0}
- Emergency Fund: ₹${context.profile?.emergencyFund?.currentAmount || 0}

Provide clear, actionable financial advice in a friendly but professional tone. Keep responses concise (3-4 sentences).`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      message: response.data.choices[0].message.content,
      suggestions: generateSuggestions(message, context)
    };

  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    return getFallbackResponse(message, context);
  }
}

// ==============================================
// Google Gemini Integration (Free Alternative)
// ==============================================

async function getChatResponseGemini(message, context) {
  try {
    const prompt = `You are a financial advisor. User asks: "${message}"

Financial Context:
- Income: ₹${context.profile?.monthlyIncome || 0}/month
- Expenses: ₹${context.currentMonth.expenses} this month
- Savings: ₹${context.currentMonth.savings}
- Health Score: ${context.profile?.healthScore || 0}/100

Provide helpful financial advice in 3-4 sentences.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const aiMessage = response.data.candidates[0].content.parts[0].text;

    return {
      message: aiMessage,
      suggestions: generateSuggestions(message, context)
    };

  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    return getFallbackResponse(message, context);
  }
}

// ==============================================
// Main Function (Choose AI Service)
// ==============================================

async function getChatResponse(message, context) {
  // Use OpenAI if API key exists, otherwise use Gemini
  if (process.env.OPENAI_API_KEY) {
    return await getChatResponseOpenAI(message, context);
  } else if (process.env.GEMINI_API_KEY) {
    return await getChatResponseGemini(message, context);
  } else {
    return getFallbackResponse(message, context);
  }
}

// ==============================================
// Fallback Response (Rule-based)
// ==============================================

function getFallbackResponse(message, context) {
  const lowerMessage = message.toLowerCase();

  // Budget related
  if (lowerMessage.includes('budget') || lowerMessage.includes('spend')) {
    return {
      message: `This month you've spent ₹${context.currentMonth.expenses}. Your savings rate is ${context.currentMonth.savingsRate}%. ${context.currentMonth.savingsRate < 20 ? 'Try to save at least 20% of your income.' : 'Great job on saving!'}`,
      suggestions: ['View detailed expenses', 'Set monthly budgets', 'Analyze spending']
    };
  }

  // Savings related
  if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
    const savingsAdvice = context.currentMonth.savingsRate > 30 
      ? 'Excellent! You\'re saving well. Consider investing for better returns.'
      : 'Try the 50-30-20 rule: 50% needs, 30% wants, 20% savings.';
    
    return {
      message: savingsAdvice,
      suggestions: ['Set savings goal', 'View savings progress', 'Investment tips']
    };
  }

  // Health score
  if (lowerMessage.includes('health') || lowerMessage.includes('score')) {
    return {
      message: `Your financial health score is ${context.profile?.healthScore || 0}/100 (${context.profile?.healthStatus || 'Unknown'}). ${context.profile?.healthScore < 50 ? 'Focus on building emergency funds and reducing debt.' : 'Keep maintaining good financial habits!'}`,
      suggestions: ['View health breakdown', 'Improve score tips']
    };
  }

  // Debt related
  if (lowerMessage.includes('debt') || lowerMessage.includes('loan')) {
    if (context.profile?.debt?.totalAmount > 0) {
      return {
        message: `You have ₹${context.profile.debt.totalAmount} in debt with ${context.profile.debt.interestRate}% interest. Focus on paying high-interest debt first.`,
        suggestions: ['Debt repayment plan', 'Debt consolidation options']
      };
    } else {
      return {
        message: 'Great! You have no debt. Keep it that way by avoiding unnecessary loans.',
        suggestions: ['Maintain debt-free status']
      };
    }
  }

  // Purchase advice
  if (lowerMessage.includes('buy') || lowerMessage.includes('purchase') || lowerMessage.includes('afford')) {
    return {
      message: 'I can help you decide if a purchase is affordable. Tell me the item name and price, and I\'ll analyze it based on your financial situation.',
      suggestions: ['Analyze purchase', 'View purchase plans']
    };
  }

  // Default response
  return {
    message: 'I\'m your AI financial advisor! I can help you with budgeting, savings, expense analysis, debt management, and purchase decisions. What would you like to know?',
    suggestions: [
      'Show my spending this month',
      'How can I save more?',
      'What\'s my financial health?',
      'Can I afford to buy something?'
    ]
  };
}

// ==============================================
// Generate Context-based Suggestions
// ==============================================

function generateSuggestions(message, context) {
  const suggestions = [];

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('save') || lowerMessage.includes('money')) {
    suggestions.push('View savings tips', 'Set savings goal', 'Analyze expenses');
  } else if (lowerMessage.includes('spend') || lowerMessage.includes('expense')) {
    suggestions.push('View all expenses', 'Category breakdown', 'Set budgets');
  } else if (lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
    suggestions.push('Analyze affordability', 'Create purchase plan', 'EMI calculator');
  } else {
    suggestions.push('View dashboard', 'Get financial advice', 'Track expenses');
  }

  return suggestions;
}

module.exports = {
  getChatResponse
};