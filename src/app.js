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

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Swagger Docs Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
const router = express.Router();

// Auth Routes
router.post('/auth/send-otp', authController.sendOtp);
router.post('/auth/login', authController.login);

// Attendance Routes (Protected)
router.post('/attendance/scan', authenticate, attendanceController.scan);

// Sync Routes (Protected - assuming only admins can trigger sync)
router.post('/sync/sheet', authenticate, syncController.triggerSync);

// Mount API v1
app.use('/api/v1', router);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
