// ==============================================
// DATABASE CONNECTION - FINSARTHI
// ==============================================

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Remove deprecated options
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`
╔═══════════════════════════════════════════════╗
║   ✅ MongoDB Connected Successfully          ║
║   Host: ${conn.connection.host.substring(0, 33).padEnd(33)}║
║   Database: ${conn.connection.name.padEnd(29)}║
╚═══════════════════════════════════════════════╝
    `);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('\n👋 MongoDB connection closed due to app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    process.on('SIGTERM', async () => {
      try {
        await mongoose.connection.close();
        console.log('\n👋 MongoDB connection closed due to SIGTERM');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error(`
╔═══════════════════════════════════════════════╗
║   ❌ MongoDB Connection Failed               ║
║   Error: ${error.message.substring(0, 35).padEnd(35)}║
╚═══════════════════════════════════════════════╝
    `);
    process.exit(1);
  }
};

module.exports = connectDB;