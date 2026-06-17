const SyncLog = require('../models/sync-log.model');

class SyncLogRepository {
  async startLog() {
    return await SyncLog.create({
      startedAt: new Date(),
      status: 'Running'
    });
  }

  async markSuccess(logId, rowsProcessed) {
    return await SyncLog.findByIdAndUpdate(
      logId, 
      {
        status: 'Success',
        completedAt: new Date(),
        rowsProcessed
      },
      { new: true }
    );
  }

  async markFailed(logId, errorsArray) {
    return await SyncLog.findByIdAndUpdate(
      logId, 
      {
        status: 'Failed',
        completedAt: new Date(),
        $push: { errors: { $each: errorsArray } }
      },
      { new: true }
    );
  }

  async addError(logId, row, message, data = {}) {
    return await SyncLog.findByIdAndUpdate(
      logId,
      {
        $push: { errors: { row, message, data } }
      }
    );
  }
}

module.exports = new SyncLogRepository();
