// ==============================================
// SEED DATA SCRIPT (Sample data for testing)
// ==============================================

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../backend/models/User');
const Category = require('../backend/models/Category');
const FinancialProfile = require('../backend/models/FinancialProfile');
const Expense = require('../backend/models/Expense');
const Budget = require('../backend/models/Budget');

dotenv.config();

const seedData = async () => {
  try {
    console.log('🌱 Seeding database...');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await FinancialProfile.deleteMany({});
    await Expense.deleteMany({});
    await Budget.deleteMany({});

    // Create demo user
    console.log('👤 Creating demo user...');
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@finsarthi.com',
      password: 'demo123',
      isVerified: true
    });

    // Create categories
    console.log('📁 Creating categories...');
    await Category.createDefaultCategories(demoUser._id);

    // Create financial profile
    console.log('💰 Creating financial profile...');
    await FinancialProfile.create({
      user: demoUser._id,
      monthlyIncome: 50000,
      fixedExpenses: 20000,
      savingsGoal: {
        amount: 100000,
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      riskAppetite: 'medium',
      emergencyFund: {
        currentAmount: 50000,
        targetAmount: 120000
      }
    });

    // Get categories
    const categories = await Category.find({ user: demoUser._id });

    // Create sample expenses
    console.log('💸 Creating sample expenses...');
    const now = new Date();
    const sampleExpenses = [];

    for (let i = 0; i < 20; i++) {
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const randomDays = Math.floor(Math.random() * 30);
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - randomDays);

      sampleExpenses.push({
        user: demoUser._id,
        category: randomCategory._id,
        amount: Math.floor(Math.random() * 5000) + 100,
        description: `Sample ${randomCategory.name} expense`,
        date,
        type: 'expense',
        paymentMethod: ['cash', 'card', 'upi'][Math.floor(Math.random() * 3)]
      });
    }

    await Expense.insertMany(sampleExpenses);

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('Email: demo@finsarthi.com');
    console.log('Password: demo123');

    process.exit(0);

  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();