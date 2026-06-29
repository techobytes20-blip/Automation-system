const Registration = require('../models/registration.model');

class RegistrationRepository {
  /**
   * Creates a new registration if it doesn't already exist for this student and event.
   */
  async createRegistration(registrationData) {
    try {
      return await Registration.create(registrationData);
    } catch (error) {
      if (error.code === 11000) { // MongoDB duplicate key error
        return null; // Indicates duplicate registration (student already in event)
      }
      throw error;
    }
  }

  async findByToken(token) {
    return await Registration.findOne({ token })
      .populate('studentId', 'name email phone metadata')
      .populate('eventId', 'title');
  }

  /**
   * Atomically marks a checkpoint. Prevents duplicate scans.
   * If both day1 and day2 are scanned, automatically updates certificateEligible.
   * 
   * @param {String} token 
   * @param {String} checkpoint 'day1' | 'day2' | 'certificateCollected'
   * @param {String} scannerId 
   * @returns {Object|null} updated document or null if duplicate scan or invalid token
   */
  async scanCheckpoint(token, checkpoint, scannerId) {
    // Determine the query to ensure we only update if it hasn't been scanned yet
    const query = { 
      token, 
      [`${checkpoint}.scannedAt`]: { $exists: false } 
    };

    // If they are collecting the certificate, they MUST be eligible
    if (checkpoint === 'certificateCollected') {
      query.certificateEligible = true;
    }

    const update = {
      $set: {
        [`${checkpoint}.scannedAt`]: new Date(),
        [`${checkpoint}.scannedBy`]: scannerId
      }
    };

    const options = { new: true };

    const updatedDoc = await Registration.findOneAndUpdate(query, update, options)
      .populate('studentId', 'name email phone metadata')
      .populate('eventId', 'title');
    
    // If we successfully updated Day 1 or Day 2, we need to check eligibility
    // Note: To remain purely atomic on the document level without multi-document transactions, 
    // we perform the scan first, then check if both are present to set eligibility.
    if (updatedDoc && (checkpoint === 'day1' || checkpoint === 'day2')) {
      if (updatedDoc.day1?.scannedAt && updatedDoc.day2?.scannedAt && !updatedDoc.certificateEligible) {
        // Both days are marked, mark eligible atomically
        updatedDoc.certificateEligible = true;
        await updatedDoc.save(); // Save triggers the update on this specific document safely
      }
    }

    return updatedDoc;
  }

  async markThankYouMailSent(registrationId) {
    return await Registration.findByIdAndUpdate(registrationId, { thankYouMailSent: true });
  }

  /**
   * Finds a registration by student ID, event ID, and topic.
   * @param {string} studentId 
   * @param {string} eventId 
   * @param {string} topic 
   */
  async findByStudentEventAndTopic(studentId, eventId, topic = '') {
    return await Registration.findOne({ studentId, eventId, topic }).populate('studentId', 'name email phone');
  }

  /**
   * Finds the latest registration matching a query.
   * @param {Object} query 
   */
  async findLatest(query = {}) {
    return await Registration.findOne(query).sort({ createdAt: -1 });
  }

  /**
   * Finds recent registrations populated with student and event details.
   * @param {Object} query 
   * @param {number} limit 
   */
  async findRecentWithPopulated(query = {}, limit = 100) {
    return await Registration.find(query)
      .populate('studentId')
      .populate('eventId')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

module.exports = new RegistrationRepository();
