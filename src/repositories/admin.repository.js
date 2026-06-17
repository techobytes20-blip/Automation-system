const Admin = require('../models/admin.model');

class AdminRepository {
  async findByEmail(email) {
    return await Admin.findOne({ email });
  }

  async findById(id) {
    return await Admin.findById(id).select('-passwordHash -password -otp -otpExpiresAt');
  }

  async updateOtp(email, otp, expiresAt) {
    return await Admin.findOneAndUpdate(
      { email },
      { otp, otpExpiresAt: expiresAt },
      { new: true }
    );
  }

  async clearOtp(email) {
    return await Admin.findOneAndUpdate(
      { email },
      { $unset: { otp: 1, otpExpiresAt: 1 } },
      { new: true }
    );
  }
}

module.exports = new AdminRepository();
