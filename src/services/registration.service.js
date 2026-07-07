const studentRepository = require('../repositories/student.repository');
const registrationRepository = require('../repositories/registration.repository');
const qrService = require('./qr.service');
const mailService = require('./mail.service');

class RegistrationService {
  /**
   * Process a single valid participant row from the sheet.
   * Finds/creates the student, generates a token, and registers them.
   * 
   * @param {Object} rowData { name, email, phone, metadata, eventId }
   * @returns {Promise<Object>} registration document
   */
  async processRowRegistration(rowData) {
    // 1. Handle identity (Upsert)
    const studentData = {
      name: rowData.name,
      email: rowData.email,
      phone: rowData.phone,
      metadata: rowData.metadata
    };
    
    const student = await studentRepository.upsertStudentByEmail(studentData);
    const topic = rowData.topic || '';

    // 2. Check for existing registration (same student + event + topic)
    let registration = await registrationRepository.findByStudentEventAndTopic(student._id, rowData.eventId, topic);

    if (registration) {
      let updated = false;
      if (!registration.token) {
        registration.token = qrService.generateSecureToken();
        registration.qrCodeUrl = qrService.generateQRUrl(registration.token);
        updated = true;
      }
      if (updated) {
        await registration.save();
      }
      return { status: 'updated', registration };
    }

    // 3. Generate secure QR token
    const token = qrService.generateSecureToken();
    const qrCodeUrl = qrService.generateQRUrl(token);

    // 4. Register student atomically (unique per student + event + topic)
    const registrationData = {
      studentId: student._id,
      eventId: rowData.eventId,
      topic,
      token,
      qrCodeUrl
    };

    registration = await registrationRepository.createRegistration(registrationData);
    
    if (registration) {
      // Populate studentId and eventId for email formatting
      await registration.populate(['studentId', 'eventId']);
      // Trigger confirmation email asynchronously (fire & forget)
      mailService.sendConfirmationMail(registration).catch(err => {
        console.error('[REGISTRATION SERVICE] Failed to trigger confirmation mail:', err.message);
      });
    }
    
    return { status: 'registered', registration };
  }
}

module.exports = new RegistrationService();
