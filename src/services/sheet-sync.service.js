const syncLogRepository = require('../repositories/sync-log.repository');
const registrationService = require('./registration.service');
const googleSheetsProvider = require('../providers/google-sheets.provider');
const eventRepository = require('../repositories/event.repository');

class SheetSyncService {
  /**
   * Automatically fetches all sheet tabs and synchronizes them.
   * @returns {Promise<Object>} sync summary
   */
  async syncAllSheets() {
    console.log('[SHEET SYNC] Fetching sheet names...');
    const sheetNames = await googleSheetsProvider.fetchSheetNames();
    console.log(`[SHEET SYNC] Found ${sheetNames.length} sheet tabs:`, sheetNames);

    let totalProcessed = 0;
    let totalErrors = 0;
    const details = [];

    for (const sheetName of sheetNames) {
      try {
        console.log(`[SHEET SYNC] Processing sheet tab: "${sheetName}"`);
        
        // 1. Auto-create/find event in MongoDB
        const event = await eventRepository.findOrCreateEventByTitle(sheetName);

        // 2. Fetch rows for this sheet tab
        const rows = await googleSheetsProvider.fetchRows(`${sheetName}!A2:E1000`);
        console.log(`[SHEET SYNC] Fetched ${rows.length} rows for event "${event.title}"`);

        // 3. Process sync for this event
        const result = await this.processSheetSync(rows, event._id);
        
        totalProcessed += result.processedCount;
        totalErrors += result.errorsCount;

        details.push({
          sheet: sheetName,
          eventId: event._id,
          processed: result.processedCount,
          errors: result.errorsCount
        });
      } catch (error) {
        console.error(`[SHEET SYNC] Failed to sync sheet "${sheetName}":`, error.message);
        totalErrors++;
        details.push({
          sheet: sheetName,
          error: error.message
        });
      }
    }

    return {
      message: 'All sheets synchronized successfully',
      totalProcessed,
      totalErrors,
      details
    };
  }

  /**
   * Processes an array of rows fetched from the Google Sheet.
   * Enforces student validation rules.
   * 
   * @param {Array<Object>} rows Array of row objects from google sheets
   * @param {String} eventId The target event ID for these rows
   */
  async processSheetSync(rows, eventId) {
    const log = await syncLogRepository.startLog();
    let processedCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2; // Assuming row 1 is header

      try {
        // Validation Rule 1: Email and Name are mandatory
        if (!row.email || typeof row.email !== 'string') {
          throw new Error('Missing or invalid email address');
        }
        if (!row.name || typeof row.name !== 'string') {
          throw new Error('Missing or invalid name');
        }

        const sanitizedRow = {
          name: row.name.trim(),
          email: row.email.trim().toLowerCase(),
          phone: row.phone ? row.phone.trim() : null,
          topic: row.topic ? row.topic.trim() : '',
          eventId,
          metadata: { ...row } // Dump all extra columns into metadata
        };

        // Pass to Registration Service
        await registrationService.processRowRegistration(sanitizedRow);
        processedCount++;

      } catch (error) {
        // Validation Rule 2: Failures must not crash the loop
        errors.push({
          row: rowIndex,
          message: error.message,
          data: { email: row.email }
        });
      }
    }

    // Finalize Sync Log
    if (errors.length > 0) {
      await syncLogRepository.markFailed(log._id, errors);
    } else {
      await syncLogRepository.markSuccess(log._id, processedCount);
    }

    return { processedCount, errorsCount: errors.length };
  }

  /**
   * Fetches all sheet tab names.
   * @returns {Promise<Array<String>>} Array of sheet titles
   */
  async getSheetNames() {
    return await googleSheetsProvider.fetchSheetNames();
  }

  /**
   * Fetches data of a sheet by its tab name.
   * Parses the first row as headers and maps the subsequent rows to objects.
   * @param {String} sheetName
   * @returns {Promise<Object>} Mapped headers and rows
   */
  async getSheetDataByName(sheetName) {
    if (!sheetName) {
      throw new Error('Sheet name is required');
    }

    // Fetch raw values including header row (A1:Z1000)
    const range = `${sheetName}!A1:Z1000`;
    const rawRows = await googleSheetsProvider.fetchRawValues(range);

    if (rawRows.length === 0) {
      return { headers: [], rows: [] };
    }

    // Extract and clean header names (e.g. trim spaces)
    const headers = rawRows[0].map(header => (header ? header.toString().trim() : ''));

    // Map rows to objects
    const mappedData = [];
    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      // Skip completely empty rows
      if (row.length === 0 || row.every(val => !val)) {
        continue;
      }

      const rowObj = {};
      headers.forEach((header, index) => {
        if (header) {
          rowObj[header] = row[index] !== undefined ? row[index].toString().trim() : '';
        }
      });
      mappedData.push(rowObj);
    }

    return { headers, rows: mappedData };
  }
}

module.exports = new SheetSyncService();
