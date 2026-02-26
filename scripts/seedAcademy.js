// ==============================================
// SEED FINANCE ACADEMY COURSES
// ==============================================

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('../models/Course');

dotenv.config();

const courses = [
  {
    title: "Budgeting Basics",
    description: "Master the fundamentals of personal budgeting and expense tracking",
    category: "Personal Finance",
    level: "Beginner",
    thumbnail: "https://via.placeholder.com/400x250/4F46E5/ffffff?text=Budgeting",
    chapters: [
      {
        chapterNumber: 1,
        title: "Introduction to Budgeting",
        description: "Learn why budgeting is essential for financial success",
        content: `# Welcome to Budgeting Basics!

Budgeting is the foundation of financial freedom. In this chapter, you'll learn:

## What is a Budget?
A budget is a plan for how you'll spend your money each month. It helps you:
- Track your income and expenses
- Avoid overspending
- Save for future goals
- Reduce financial stress

## Why Budget?
✅ Control your money instead of it controlling you
✅ Identify wasteful spending
✅ Build emergency savings
✅ Achieve financial goals faster

## The 50/30/20 Rule
A simple budgeting framework:
- **50%** - Needs (rent, food, utilities)
- **30%** - Wants (entertainment, dining out)
- **20%** - Savings & Debt Repayment

Let's start your journey to financial control!`,
        duration: 10,
        points: 10,
        keyTakeaways: [
          "Budgeting helps you control your finances",
          "The 50/30/20 rule is a simple starting framework",
          "Tracking expenses is the first step to financial awareness"
        ]
      },
      {
        chapterNumber: 2,
        title: "Creating Your First Budget",
        description: "Step-by-step guide to creating a monthly budget",
        content: `# Creating Your First Budget

Now that you understand WHY to budget, let's create one!

## Step 1: Calculate Your Income
List all sources of monthly income:
- Salary (after tax)
- Freelance earnings
- Side hustle income
- Rental income

## Step 2: List Your Expenses
### Fixed Expenses
- Rent/EMI
- Insurance
- Subscriptions

### Variable Expenses
- Groceries
- Transportation
- Entertainment

## Step 3: Set Spending Limits
Based on the 50/30/20 rule, allocate your income:

**Example for ₹50,000/month:**
- Needs: ₹25,000
- Wants: ₹15,000
- Savings: ₹10,000

## Step 4: Track & Adjust
Use FinSarthi to track daily expenses and adjust your budget monthly!`,
        duration: 15,
        points: 15,
        keyTakeaways: [
          "Start with calculating total monthly income",
          "Categorize expenses into fixed and variable",
          "Apply the 50/30/20 rule for balanced spending",
          "Review and adjust your budget monthly"
        ]
      },
      {
        chapterNumber: 3,
        title: "Common Budgeting Mistakes",
        description: "Avoid these pitfalls to stay on track",
        content: `# Common Budgeting Mistakes to Avoid

Even experienced budgeters make these mistakes. Learn to avoid them!

## ❌ Mistake #1: Being Too Restrictive
**Problem:** Setting unrealistic limits leads to burnout
**Solution:** Allow 10-15% flexibility in your budget

## ❌ Mistake #2: Forgetting Irregular Expenses
**Problem:** Annual insurance, festivals catch you off guard
**Solution:** Calculate yearly expenses and save monthly

**Example:**
₹12,000 annual insurance = ₹1,000/month savings

## ❌ Mistake #3: Not Tracking Small Expenses
**Problem:** ₹50 coffee daily = ₹1,500/month!
**Solution:** Track EVERY expense for 1 month to see patterns

## ❌ Mistake #4: No Emergency Fund
**Problem:** Unexpected expenses break your budget
**Solution:** Build 3-6 months expenses as emergency fund

## ❌ Mistake #5: Giving Up After One Bad Month
**Problem:** One overspending month = quit budgeting
**Solution:** Budgeting is a skill - it takes 3 months to master

Remember: Progress, not perfection!`,
        duration: 12,
        points: 15,
        keyTakeaways: [
          "Build flexibility into your budget (10-15%)",
          "Save monthly for annual/irregular expenses",
          "Small daily expenses add up significantly",
          "Emergency fund prevents budget breakdown",
          "Give yourself 3 months to master budgeting"
        ]
      }
    ]
  },
  {
    title: "Emergency Fund Essentials",
    description: "Build your financial safety net step by step",
    category: "Personal Finance",
    level: "Beginner",
    thumbnail: "https://via.placeholder.com/400x250/10B981/ffffff?text=Emergency+Fund",
    chapters: [
      {
        chapterNumber: 1,
        title: "Why You Need an Emergency Fund",
        description: "Understanding the importance of financial cushion",
        content: `# The Power of an Emergency Fund

Life is unpredictable. An emergency fund is your financial airbag.

## What is an Emergency Fund?
Money set aside ONLY for unexpected expenses:
- Medical emergencies
- Job loss
- Car/home repairs
- Family emergencies

## Why It's Critical
🚨 Without emergency fund:
- Use credit cards (high interest)
- Break investments (lose growth)
- Borrow from family (stress)
- Miss financial goals

✅ With emergency fund:
- Handle crises stress-free
- No debt accumulation
- Investments stay intact
- Peace of mind

## How Much Do You Need?
**Minimum:** 3 months expenses
**Ideal:** 6 months expenses
**Aggressive:** 12 months expenses

**Example:**
Monthly expenses = ₹40,000
Target emergency fund = ₹2,40,000 (6 months)

Start small, think big!`,
        duration: 10,
        points: 10,
        keyTakeaways: [
          "Emergency fund prevents debt during crises",
          "Target 3-6 months of expenses",
          "Keep it separate from regular savings",
          "Use only for true emergencies"
        ]
      },
      {
        chapterNumber: 2,
        title: "Building Your Emergency Fund",
        description: "Practical strategies to save consistently",
        content: `# Building Your Emergency Fund Fast

Let's turn that ₹0 into a solid safety net!

## Step 1: Start With ₹1,000
Don't aim for ₹2 lakhs immediately. Start with ₹1,000 this month.

Small wins = Motivation!

## Step 2: Automate Savings
**Pay yourself first!**

Set up auto-transfer on salary day:
- Fixed monthly amount
- Direct to emergency fund account
- Treat it as a non-negotiable expense

## Step 3: Save Windfalls
Put these directly into emergency fund:
- Tax refunds
- Bonuses
- Gifts
- Freelance income

## Step 4: Cut One Expense
Find ₹2,000-5,000 monthly savings:
- Cancel unused subscriptions (OTT, gym)
- Cook 2 more meals at home
- Skip one coffee shop visit weekly

## Milestone Strategy
✅ Month 1-3: ₹25,000 (bare minimum)
✅ Month 4-6: ₹50,000 (1 month expenses)
✅ Month 7-12: ₹1,50,000 (3 months expenses)
✅ Month 13-18: ₹2,40,000 (6 months - DONE!)

You've got this! 💪`,
        duration: 15,
        points: 15,
        keyTakeaways: [
          "Start small - even ₹1,000 is progress",
          "Automate savings on salary day",
          "Save 100% of bonuses and windfalls",
          "Set milestone targets for motivation"
        ]
      }
    ]
  },
  {
    title: "Introduction to Investing",
    description: "Start your wealth creation journey with smart investing",
    category: "Investing",
    level: "Intermediate",
    thumbnail: "https://via.placeholder.com/400x250/8B5CF6/ffffff?text=Investing",
    chapters: [
      {
        chapterNumber: 1,
        title: "Investing vs Saving",
        description: "Understanding the fundamental difference",
        content: `# Investing vs Saving: Know the Difference

Both are important, but serve different purposes.

## Saving 💰
**Purpose:** Short-term goals & emergencies
**Returns:** 3-4% per year (savings account)
**Risk:** Very low
**Liquidity:** Immediate access
**Best for:**
- Emergency fund
- Goals within 1-3 years
- Down payments

## Investing 📈
**Purpose:** Long-term wealth creation
**Returns:** 10-15% average (over 10+ years)
**Risk:** Market fluctuations
**Liquidity:** May take 1-3 days
**Best for:**
- Retirement (20+ years away)
- Children's education (10+ years)
- Wealth building

## The Inflation Problem
₹1 lakh today ≠ ₹1 lakh in 10 years

**Inflation:** ~6% per year
**Savings account:** 3-4% interest
**Real return:** -2% to -3% (LOSING money!)

**Stock market:** 12-15% average
**Real return:** +6% to +9% (BEATING inflation!)

## Golden Rule
✅ Save for emergencies
✅ Invest for the future

Both are essential!`,
        duration: 12,
        points: 10,
        keyTakeaways: [
          "Saving is for short-term, investing for long-term",
          "Inflation erodes savings account value",
          "Investing beats inflation over time",
          "You need both saving AND investing"
        ]
      }
    ]
  }
];

const seedCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 MongoDB Connected');

    // Clear existing courses
    await Course.deleteMany({});
    console.log('🗑️  Cleared existing courses');

    // Insert new courses
    const created = await Course.insertMany(courses);
    console.log(`✅ ${created.length} courses created successfully!`);

    console.log('\n📚 Courses:');
    created.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title} (${course.chapters.length} chapters, ${course.totalPoints} points)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedCourses();