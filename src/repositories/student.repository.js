const Student = require('../models/student.model');

class StudentRepository {
  /**
   * Upserts a student by email. If the student exists, updates their details.
   * If not, creates a new record.
   * @param {Object} studentData
   * @returns {Promise<Object>} The Mongoose document
   */
  async upsertStudentByEmail(studentData) {
    return await Student.findOneAndUpdate(
      { email: studentData.email },
      { $set: studentData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  async findById(id) {
    return await Student.findById(id);
  }
}

module.exports = new StudentRepository();
