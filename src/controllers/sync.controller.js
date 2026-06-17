const sheetSyncService = require('../services/sheet-sync.service');
const googleSheetsProvider = require('../providers/google-sheets.provider');
const eventRepository = require('../repositories/event.repository');

class SyncController {
  /**
   * @openapi
   * /sync/sheet:
   *   post:
   *     summary: Manually trigger Google Sheet synchronization
   *     description: Fetches and processes rows from Google Sheets for registration.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               eventId:
   *                 type: string
   *               mockRows:
   *                 type: array
   *                 items:
   *                   type: object
   *     responses:
   *       200:
   *         description: Sync completed successfully
   *       401:
   *         description: Unauthorized scanner
   */
  async triggerSync(req, res, next) {
    try {
      const { eventId, mockRows } = req.body || {};
      
      let result;
      let targetEventId;

      if (mockRows) {
        // Mock flow (usually for tests)
        let event;
        if (eventId) {
          if (eventId.match(/^[0-9a-fA-F]{24}$/)) {
            event = await eventRepository.findById(eventId);
          }
          if (!event) {
            event = await eventRepository.findOrCreateEventByTitle(eventId);
          }
        } else {
          event = await eventRepository.findOrCreateEventByTitle('TestEvent');
        }

        targetEventId = event._id;
        result = await sheetSyncService.processSheetSync(mockRows, targetEventId);
      } else {
        // Production flow: sync all sheet tabs automatically
        result = await sheetSyncService.syncAllSheets();
      }

      // Fetch the last registration for testing/verification purposes
      const Registration = require('../models/registration.model');
      const query = targetEventId ? { eventId: targetEventId } : {};
      const testReg = await Registration.findOne(query).sort({ createdAt: -1 });

      return res.status(200).json({
        message: 'Sync completed',
        testToken: testReg ? testReg.token : null,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SyncController();
