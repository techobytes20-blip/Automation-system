const { google } = require('googleapis');
const env = require('../../config/env');
const fs = require('fs');

class GoogleSheetsProvider {
  constructor() {
    this.auth = null;
  }

  async authenticate() {
    if (this.auth) return this.auth;

    const authOptions = {
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    };

    if (process.env.GOOGLE_CREDS_JSON) {
      try {
        authOptions.credentials = JSON.parse(process.env.GOOGLE_CREDS_JSON);
      } catch (err) {
        throw new Error(`Failed to parse GOOGLE_CREDS_JSON environment variable: ${err.message}`);
      }
    } else {
      // Check if credentials.json exists before attempting to load
      if (!fs.existsSync(env.googleSheets.credentialsPath)) {
        throw new Error(
          `Google Service Account Credentials not found. Please place credentials.json at ${env.googleSheets.credentialsPath} or set the GOOGLE_CREDS_JSON environment variable in production.`
        );
      }
      authOptions.keyFile = env.googleSheets.credentialsPath;
    }

    this.auth = new google.auth.GoogleAuth(authOptions);
    return this.auth;
  }

  /**
   * Fetch rows from the configured Google Spreadsheet.
   * Assumes the first row is the header: Name, Email, Phone, Workshop
   * @param {String} range e.g., 'Sheet1!A2:D1000'
   */
  async fetchRows(range = 'Sheet1!A2:E1000') {
    const authClient = await this.authenticate();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: env.googleSheets.spreadsheetId,
        range: range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      // Map raw array rows into objects based on user's column order
      // Columns are: Name, Email, Phone, Topic
      return rows.map((row) => ({
        name: row[0] || '',
        email: row[1] || '',
        phone: row[2] || '',
        topic: row[3] || ''
      }));

    } catch (error) {
      console.error('[GoogleSheetsProvider] Error fetching data:', error.message);
      throw error;
    }
  }

  /**
   * Fetch all sheet tab names from the configured Google Spreadsheet.
   * @returns {Promise<Array<String>>} Array of sheet titles
   */
  async fetchSheetNames() {
    const authClient = await this.authenticate();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    try {
      const response = await sheets.spreadsheets.get({
        spreadsheetId: env.googleSheets.spreadsheetId,
      });

      const sheetsList = response.data.sheets;
      if (!sheetsList || sheetsList.length === 0) {
        return [];
      }

      return sheetsList.map(s => s.properties.title);
    } catch (error) {
      console.error('[GoogleSheetsProvider] Error fetching sheet names:', error.message);
      throw error;
    }
  }

  /**
   * Fetch raw values from the configured Google Spreadsheet.
   * @param {String} range e.g., 'Sheet1!A1:Z1000'
   */
  async fetchRawValues(range) {
    const authClient = await this.authenticate();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: env.googleSheets.spreadsheetId,
        range: range,
      });

      return response.data.values || [];
    } catch (error) {
      console.error('[GoogleSheetsProvider] Error fetching raw values:', error.message);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsProvider();
