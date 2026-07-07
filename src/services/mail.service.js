const axios = require('axios');
const registrationRepository = require('../repositories/registration.repository');
const resendProvider = require('../providers/resend.provider');

class MailService {
  /**
   * Sends a thank you email to a participant when they become eligible for a certificate.
   * @param {Object} registrationDoc The registration document populated with student info.
   */
  async sendThankYouMail(registrationDoc) {
    try {
      // Validate that studentId is populated (not just an ObjectId reference)
      if (!registrationDoc.studentId || typeof registrationDoc.studentId === 'string' || !registrationDoc.studentId.email) {
        console.error('[MAIL SERVICE] studentId is not populated on the registration document. Cannot send email.');
        console.error('[MAIL SERVICE] studentId value:', registrationDoc.studentId);
        return;
      }

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
      console.error(`[MAIL SERVICE] Failed to send email to ${registrationDoc.studentId?.email}:`, error.message);
      throw error;
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
      console.error(`[MAIL SERVICE] Failed to send OTP email to ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Sends a confirmation email to a participant with their registration QR code.
   * @param {Object} registrationDoc The registration document populated with student and event info.
   */
  async sendConfirmationMail(registrationDoc) {
    try {
      if (!registrationDoc.studentId || typeof registrationDoc.studentId === 'string' || !registrationDoc.studentId.email) {
        console.error('[MAIL SERVICE] studentId is not populated on the registration document. Cannot send email.');
        return;
      }

      const studentEmail = registrationDoc.studentId.email;
      const studentName = registrationDoc.studentId.name;
      const qrCodeUrl = registrationDoc.qrCodeUrl;

      console.log(`[MAIL SERVICE] Sending Registration Confirmation Mail to: ${studentName} <${studentEmail}>`);

      let base64Image = null;
      try {
        console.log(`[MAIL SERVICE] Downloading QR code image from URL: ${qrCodeUrl}`);
        const imageResponse = await axios.get(qrCodeUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(imageResponse.data, 'binary');
        base64Image = buffer.toString('base64');
      } catch (dlError) {
        console.error('[MAIL SERVICE] Failed to download QR code image. Sending without image attachment:', dlError.message);
      }

      const htmlContent = `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #1e3a8a; margin-top: 0;">Workshop Registration Confirmed</h2>
          <p>Dear Participant,</p>
          <p>Thank you for registering for our workshop!</p>
          <p>Your registration has been successfully confirmed.</p>
          <p>Please find your unique QR code attached to this email. Kindly keep it safe and present it at the registration desk during check-in. This QR code will be used to verify your attendance and ensure a smooth entry.</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <img src="${qrCodeUrl}" alt="Attendance QR Code" style="width: 200px; height: 200px; border: 1px solid #e5e7eb; padding: 10px; border-radius: 8px; background-color: #fff;" />
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #111827; font-size: 16px;">Important:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Carry this QR code (printed or on your phone).</li>
              <li>Arrive at the venue at least 15 minutes before the workshop begins.</li>
              <li>If you have any questions, feel free to reply to this email.</li>
            </ul>
          </div>
          
          <p>We look forward to seeing you at the workshop!</p>
          <p style="margin-bottom: 0;">Best regards,<br><strong>Team Techobytes</strong></p>
        </div>
      `;

      const attachments = [];
      if (base64Image) {
        attachments.push({
          filename: 'attendance-qr.png',
          content: base64Image,
          contentId: 'attendance-qr'
        });
      }

      await resendProvider.sendEmail({
        to: studentEmail,
        subject: 'Your Workshop Registration Confirmation',
        html: htmlContent,
        attachments
      });

      console.log(`[MAIL SERVICE] Registration Confirmation Mail successfully sent to: ${studentEmail}`);

      // Mark as sent in the database
      await registrationRepository.markConfirmationMailSent(registrationDoc._id);

    } catch (error) {
      console.error(`[MAIL SERVICE] Failed to send registration confirmation email to ${registrationDoc.studentId?.email}:`, error.message);
      throw error;
    }
  }

  /**
   * Finds and sends thank you emails to all eligible participants who haven't received them yet.
   */
  async sendPendingThankYouMails() {
    try {
      const registrations = await registrationRepository.findRecentWithPopulated({
        certificateEligible: true,
        thankYouMailSent: false
      }, 100);

      if (registrations.length === 0) {
        return;
      }

      console.log(`[MAIL SERVICE] Found ${registrations.length} pending thank you emails to send.`);

      for (const reg of registrations) {
        try {
          await this.sendThankYouMail(reg);
        } catch (err) {
          console.error(`[MAIL SERVICE] Failed to send pending thank you email for registration ${reg._id}:`, err.message);
        }
      }
    } catch (error) {
      console.error('[MAIL SERVICE] Error in sendPendingThankYouMails:', error.message);
    }
  }
}

module.exports = new MailService();
