const app = require('./app');
const connectDB = require('../config/db');
const env = require('../config/env');
const { initSheetSyncCron } = require('./cron/sheet-sync.cron');
const { migrateRegistrationIndex } = require('./migrations/registration-index.migration');

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Run database migrations
  await migrateRegistrationIndex();

  // Initialize background cron jobs
  initSheetSyncCron();

  // Start Express server
  app.listen(env.port, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${env.port}`);
  });
};

startServer();
