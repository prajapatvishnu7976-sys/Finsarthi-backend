// ==============================================
// EMAIL SERVICE
// ==============================================

const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ==============================================
// Send Email Function
// ==============================================

const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `Finsarthi <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('❌ Email send error:', error);
    throw error;
  }
};

// ==============================================
// Email Templates
// ==============================================

const sendVerificationEmail = async (email, token) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Verify Your Email</h2>
      <p>Thank you for registering with Finsarthi!</p>
      <p>Your verification code is:</p>
      <div style="background: #F3F4F6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
        ${token}
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't create an account, please ignore this email.</p>
      <hr style="margin: 30px 0;">
      <p style="color: #6B7280; font-size: 12px;">
        Finsarthi - Your AI-Powered Financial Assistant
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: 'Verify Your Email - Finsarthi',
    html
  });
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Reset Your Password</h2>
      <p>You requested to reset your password.</p>
      <p>Click the button below to reset it:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>Or copy this link:</p>
      <p style="background: #F3F4F6; padding: 10px; word-break: break-all;">${resetUrl}</p>
      <p>This link will expire in 30 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="margin: 30px 0;">
      <p style="color: #6B7280; font-size: 12px;">
        Finsarthi - Your AI-Powered Financial Assistant
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: 'Reset Your Password - Finsarthi',
    html
  });
};

const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Welcome to Finsarthi! 🎉</h2>
      <p>Hi ${name},</p>
      <p>Thank you for joining Finsarthi, your AI-powered personal finance assistant!</p>
      <h3>Get Started:</h3>
      <ul>
        <li>📊 Complete your financial profile</li>
        <li>💰 Track your expenses</li>
        <li>🎯 Set budgets and savings goals</li>
        <li>🤖 Chat with our AI advisor</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Go to Dashboard
        </a>
      </div>
      <p>If you have any questions, feel free to reach out!</p>
      <hr style="margin: 30px 0;">
      <p style="color: #6B7280; font-size: 12px;">
        Finsarthi - Your AI-Powered Financial Assistant
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: 'Welcome to Finsarthi!',
    html
  });
};

const sendBudgetAlert = async (email, category, percentage) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #EF4444;">⚠️ Budget Alert</h2>
      <p>You've used <strong>${percentage}%</strong> of your ${category} budget.</p>
      <p>Consider reviewing your spending in this category.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/budget" style="background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Budget
        </a>
      </div>
      <hr style="margin: 30px 0;">
      <p style="color: #6B7280; font-size: 12px;">
        Finsarthi - Your AI-Powered Financial Assistant
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: `Budget Alert: ${category}`,
    html
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendBudgetAlert
};