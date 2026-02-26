// ==============================================
// SEED COURSES DATA
// ==============================================

const mongoose = require('mongoose');
const Course = require('../models/Course');
const coursesData = require('../data/courses.json');
require('dotenv').config();

const seedCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Clear existing courses
    await Course.deleteMany({});
    console.log('🗑️  Old courses cleared');

    // Insert new courses
    await Course.insertMany(coursesData);
    console.log('✅ Courses seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedCourses();