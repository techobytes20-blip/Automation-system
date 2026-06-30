const app = require('./app');
const connectDB = require('../config/db');
const env = require('../config/env');
const { initSheetSyncCron } = require('./cron/sheet-sync.cron');
const { migrateRegistrationIndex } = require('./migrations/registration-index.migration');

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    // Run database migrations
    await migrateRegistrationIndex();

    // Initialize background cron jobs
    initSheetSyncCron();

    // Start Express server
    const server = app.listen(env.port, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${env.port}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.error('Unhandled Rejection:', err.message);
      // Close server & exit process
      server.close(() => process.exit(1));
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated.');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
