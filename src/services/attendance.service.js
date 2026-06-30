const registrationRepository = require('../repositories/registration.repository');
const mailService = require('./mail.service');

class AttendanceService {
  /**
   * Processes a QR scan for a specific checkpoint.
   * 
   * @param {String} token QR code token
   * @param {String} checkpoint 'day1' | 'day2' | 'certificateCollected'
   * @param {String} scannerId The admin ID who scanned
   * @returns {Object} Result object containing success status and message
   */
  async scanQR(token, checkpoint, scannerId) {
    // 1. Pre-validation for certificate
    if (checkpoint === 'certificateCollected') {
      const reg = await registrationRepository.findByToken(token);
      if (!reg) {
        return { success: false, error: 'Invalid token', status: 404 };
      }
      if (!reg.certificateEligible) {
        return { 
          success: false, 
          error: 'Participant is not eligible for a certificate. Requires both Day 1 and Day 2 attendance.', 
          status: 403 
        };
      }
    }

    // 2. Perform atomic scan update
    const updatedDoc = await registrationRepository.scanCheckpoint(token, checkpoint, scannerId);

    // 3. Handle Duplicate or Invalid
    if (!updatedDoc) {
      // Check if it's invalid or duplicate
      const exists = await registrationRepository.findByToken(token);
      if (!exists) {
        return { success: false, error: 'Invalid token. Registration not found.', status: 404 };
      }
      
      return { 
        success: false, 
        error: `Participant already scanned for checkpoint: ${checkpoint}`, 
        scannedAt: exists[checkpoint]?.scannedAt,
        student: exists.studentId,
        workshop: exists.eventId?.title || 'N/A',
        status: 409 
      };
    }

    // 4. Mail Automation Trigger (Fire & Forget)
    if (updatedDoc.certificateEligible && !updatedDoc.thankYouMailSent && (checkpoint === 'day1' || checkpoint === 'day2')) {
      // Execute asynchronously, do not await to keep scanner response fast
      mailService.sendThankYouMail(updatedDoc).catch(err => console.error("Mail trigger failed:", err));
    }

    return { 
      success: true, 
      student: updatedDoc.studentId, 
      workshop: updatedDoc.eventId?.title || 'N/A',
      checkpoint,
      eligible: updatedDoc.certificateEligible 
    };
  }
}

module.exports = new AttendanceService();
