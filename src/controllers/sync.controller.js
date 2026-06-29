const sheetSyncService = require('../services/sheet-sync.service');
const googleSheetsProvider = require('../providers/google-sheets.provider');
const eventRepository = require('../repositories/event.repository');
const registrationRepository = require('../repositories/registration.repository');

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
      const query = targetEventId ? { eventId: targetEventId } : {};
      const testReg = await registrationRepository.findLatest(query);

      // Fetch the synced registrations to send back to the frontend builder
      const registrations = await registrationRepository.findRecentWithPopulated(query, 100);

      const syncedRows = registrations.map(reg => {
        const student = reg.studentId || {};
        const event = reg.eventId || {};
        return {
          Name: student.name || 'N/A',
          Email: student.email || 'N/A',
          Phone: student.phone || 'N/A',
          College: student.metadata?.College || student.metadata?.college || 'N/A',
          Topic: reg.topic || '',
          Workshop: event.title || 'N/A',
          Token: reg.token
        };
      });

      return res.status(200).json({
        message: 'Sync completed',
        testToken: testReg ? testReg.token : null,
        syncedRows,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @openapi
   * /sync/sheets:
   *   get:
   *     summary: Get all sheet tab names in the spreadsheet
   *     description: Fetches metadata of the spreadsheet and returns all tab names.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of sheet tab names retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 sheets:
   *                   type: array
   *                   items:
   *                     type: string
   *       401:
   *         description: Unauthorized
   */
  async getSheets(req, res, next) {
    try {
      const sheets = await sheetSyncService.getSheetNames();
      return res.status(200).json({ sheets });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @openapi
   * /sync/sheets/{sheetName}:
   *   get:
   *     summary: Get sheet data by tab name
   *     description: Fetches rows of a specific sheet tab and maps them using headers.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sheetName
   *         required: true
   *         schema:
   *           type: string
   *         description: The name of the sheet tab
   *     responses:
   *       200:
   *         description: Sheet data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 headers:
   *                   type: array
   *                   items:
   *                     type: string
   *                 rows:
   *                   type: array
   *                   items:
   *                     type: object
   *       401:
   *         description: Unauthorized
   */
  async getSheetData(req, res, next) {
    try {
      const { sheetName } = req.params;
      const data = await sheetSyncService.getSheetDataByName(sheetName);
      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SyncController();
