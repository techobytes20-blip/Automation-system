const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

module.exports = {
  port: process.env.PORT || 3000,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-development-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  googleSheets: {
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM || 'noreply@workshop.com'
  }
};
