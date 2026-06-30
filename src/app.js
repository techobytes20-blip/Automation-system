const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authController = require('./controllers/auth.controller');
const attendanceController = require('./controllers/attendance.controller');
const syncController = require('./controllers/sync.controller');

const { authenticate } = require('./middleware/auth.middleware');
const { errorHandler } = require('./middleware/error-handler');

const app = express();

// Trust reverse proxy (e.g., Render, Heroku, Nginx) for correct IP and protocol
app.set('trust proxy', 1);

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');

// Middleware
// CORS must be before Helmet and other middlewares to handle preflight correctly
app.use(cors({
  origin: true, // Reflects the request origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true
}));

app.use(helmet({
  crossOriginResourcePolicy: false, // Disable to prevent conflicts with CORS
}));
app.use(express.json());
app.use(morgan('dev'));

// Swagger Docs Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Redirect root to api docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Routes
const router = express.Router();

// Base Router Welcome/Status
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Attendance Management System API v1',
    docs: '/api-docs',
    status: 'healthy'
  });
});

// Health Check Route
router.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    services: {
      database: dbStatus,
      api: 'online'
    }
  });
});

// Auth Routes
router.post('/auth/send-otp', authController.sendOtp);
router.post('/auth/login', authController.login);

// Attendance Routes (Protected)
router.post('/attendance/scan', authenticate, attendanceController.scan);

// Sync Routes (Protected - assuming only admins can trigger sync)
router.post('/sync/sheet', authenticate, syncController.triggerSync);
router.get('/sync/sheets', authenticate, syncController.getSheets);
router.get('/sync/sheets/:sheetName', authenticate, syncController.getSheetData);

// Mount API v1
app.use('/api/v1', router);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
