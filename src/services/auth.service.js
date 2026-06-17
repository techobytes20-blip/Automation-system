const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const adminRepository = require('../repositories/admin.repository');
const mailService = require('./mail.service');

class AuthService {
  /**
   * Generates a 6-digit OTP, stores it in the admin's document with a 5-minute expiry,
   * and triggers sending it via email.
   * @param {string} email 
   */
  async sendOtp(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    const admin = await adminRepository.findByEmail(email);
    if (!admin) {
      const err = new Error('Admin account not found');
      err.status = 404;
      throw err;
    }

    // Generate a secure 6-digit OTP (e.g., between 100000 and 999999)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Save OTP to DB
    await adminRepository.updateOtp(email, otp, expiresAt);

    // Send OTP email (async, but await here to ensure success before response)
    await mailService.sendOtpMail(email, otp);

    return { message: 'OTP sent successfully', otp };
  }

  /**
   * Validates the OTP submitted by the user. If correct, returns a JWT token.
   * @param {string} email 
   * @param {string} otp 
   */
  async loginWithOtp(email, otp) {
    if (!email || !otp) {
      const err = new Error('Email and OTP are required');
      err.status = 400;
      throw err;
    }

    const admin = await adminRepository.findByEmail(email);
    if (!admin) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    // Verify OTP exists, matches, and has not expired
    if (!admin.otp || admin.otp !== otp || !admin.otpExpiresAt || new Date() > admin.otpExpiresAt) {
      const err = new Error('Invalid or expired OTP');
      err.status = 401;
      throw err;
    }

    // Clear the OTP fields now that it has been successfully used
    await adminRepository.clearOtp(email);

    // Generate JWT Token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    return { token };
  }
}

module.exports = new AuthService();
