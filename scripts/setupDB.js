// ==============================================
// DATABASE SETUP SCRIPT
// ==============================================

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../backend/models/User');
const Category = require('../backend/models/Category');
const FinancialProfile = require('../backend/models/FinancialProfile');

dotenv.config();

const setupDatabase = async () => {
  try {
    console.log('🔧 Setting up database...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create indexes
    console.log('📊 Creating indexes...');
    
    await User.createIndexes();
    await Category.createIndexes();
    await FinancialProfile.createIndexes();

    console.log('✅ Indexes created');

    console.log('✅ Database setup complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Setup error:', error);
    process.exit(1);
  }
};

setupDatabase();