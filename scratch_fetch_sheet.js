const { google } = require('googleapis');
const env = require('./config/env');
const fs = require('fs');

const run = async () => {
  try {
    if (!fs.existsSync(env.googleSheets.credentialsPath)) {
      throw new Error(`Credentials not found at ${env.googleSheets.credentialsPath}`);
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: env.googleSheets.credentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    console.log('Fetching spreadsheet metadata/sheets list...');
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: env.googleSheets.spreadsheetId
    });
    const sheetName = meta.data.sheets[0].properties.title;
    console.log('Sheet Name:', sheetName);

    console.log('Fetching first 5 rows...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: env.googleSheets.spreadsheetId,
      range: `${sheetName}!A1:G5`,
    });

    console.log('Raw rows from sheet:');
    console.log(response.data.values);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

run();
