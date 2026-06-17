const cron = require('node-cron');
const sheetSyncService = require('../services/sheet-sync.service');

const initSheetSyncCron = () => {
  // Run every 2 minutes by default, or use custom cron schedule from environment variables
  const cronSchedule = process.env.SHEET_SYNC_CRON || '*/2 * * * *';

  console.log(`[CRON] Initializing Sheet Sync Cron Job with schedule: "${cronSchedule}"`);

  cron.schedule(cronSchedule, async () => {
    console.log('[CRON] Starting automatic Google Sheet synchronization across all tabs...');
    try {
      const result = await sheetSyncService.syncAllSheets();
      console.log('[CRON] Automatic sheets synchronization completed:', JSON.stringify(result));
    } catch (error) {
      console.error('[CRON] Error during background Sheet Sync:', error.message);
    }
  });
};

module.exports = { initSheetSyncCron };
