const registrationRepository = require('../repositories/registration.repository');
const resendProvider = require('../providers/resend.provider');

class MailService {
  /**
   * Sends a thank you email to a participant when they become eligible for a certificate.
   * @param {Object} registrationDoc The registration document populated with student info.
   */
  async sendThankYouMail(registrationDoc) {
    try {
      const studentEmail = registrationDoc.studentId.email;
      const studentName = registrationDoc.studentId.name;
      
      console.log(`[MAIL SERVICE] Sending Thank You Mail to: ${studentName} <${studentEmail}>`);
      
      const htmlContent = `
        <h1>Thank You for Attending!</h1>
        <p>Hi ${studentName},</p>
        <p>Thank you for attending our workshop. We hope you found it valuable.</p>
        <p>You have successfully completed the attendance checkpoints for Day 1 and Day 2, and are now eligible to collect your certificate.</p>
        <p>Best regards,<br>Workshop Team</p>
      `;

      await resendProvider.sendEmail({
        to: studentEmail,
        subject: 'Thank You for Attending the Workshop!',
        html: htmlContent
      });
      
      console.log(`[MAIL SERVICE] Mail successfully sent to: ${studentEmail}`);
      
      // Mark as sent in the database
      await registrationRepository.markThankYouMailSent(registrationDoc._id);
      
    } catch (error) {
      console.error(`[MAIL SERVICE] Failed to send email to ${registrationDoc.studentId?.email}:`, error);
    }
  }

  /**
   * Sends a one-time password (OTP) email for administrative login.
   * @param {string} email 
   * @param {string} otp 
   */
  async sendOtpMail(email, otp) {
    try {
      console.log(`[MAIL SERVICE] Sending OTP Mail to: ${email}`);
      // Maintain console log for automated testing and development login flows
      console.log(`[MAIL SERVICE] Your Login OTP is: ${otp}`);
      
      const htmlContent = `
        <h1>Your Login OTP</h1>
        <p>You requested a login verification code for the Workshop Admin Panel.</p>
        <p>Your OTP code is: <strong style="font-size: 20px; color: #1e3a8a;">${otp}</strong></p>
        <p>This code is valid for 5 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `;

      await resendProvider.sendEmail({
        to: email,
        subject: 'Your Admin Login OTP',
        html: htmlContent
      });
      
      console.log(`[MAIL SERVICE] OTP Mail successfully sent to: ${email}`);
    } catch (error) {
      console.error(`[MAIL SERVICE] Failed to send OTP email to ${email}:`, error);
    }
  }
}

module.exports = new MailService();
