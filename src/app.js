const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

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

// Rate Limiting Definitions
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 authentication requests per 15 minutes
  message: { error: 'Too many login or OTP attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit scanning rate
  message: { error: 'Too many scan requests, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
// CORS must be before Helmet and other middlewares to handle preflight correctly
const allowedOrigins = [
  'https://ai-frontend-attendance.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:5500',
  'http://localhost:5501',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5501'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const sanitizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    if (allowedOrigins.includes(sanitizedOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true
}));

app.use(helmet({
  crossOriginResourcePolicy: false, // Disable to prevent conflicts with CORS
}));
app.use(globalLimiter);
app.use(express.json({ limit: '10kb' }));
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
router.post('/auth/send-otp', authLimiter, authController.sendOtp);
router.post('/auth/login', authLimiter, authController.login);

// Attendance Routes (Protected)
router.post('/attendance/scan', scanLimiter, authenticate, attendanceController.scan);

// Sync Routes (Protected - assuming only admins can trigger sync)
router.post('/sync/sheet', authenticate, syncController.triggerSync);
router.get('/sync/sheets', authenticate, syncController.getSheets);
router.get('/sync/sheets/:sheetName', authenticate, syncController.getSheetData);

// Mount API v1
app.use('/api/v1', router);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
