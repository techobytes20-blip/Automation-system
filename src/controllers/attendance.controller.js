const attendanceService = require('../services/attendance.service');

class AttendanceController {
  /**
   * @openapi
   * /attendance/scan:
   *   post:
   *     summary: Scan QR code at a checkpoint
   *     description: Marks attendance for a specific checkpoint and validates eligibility.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               token:
   *                 type: string
   *                 description: The cryptographic token from the QR code
   *               checkpoint:
   *                 type: string
   *                 enum: [day1, day2, certificateCollected]
   *     responses:
   *       200:
   *         description: Scan successful
   *       400:
   *         description: Invalid request body
   *       403:
   *         description: Not eligible for certificate
   *       404:
   *         description: Invalid token
   *       409:
   *         description: Duplicate scan
   *       401:
   *         description: Unauthorized scanner
   */
  async scan(req, res, next) {
    try {
      const { token, checkpoint } = req.body;
      
      // Basic validation
      if (!token || !checkpoint) {
        return res.status(400).json({ error: 'Token and checkpoint are required' });
      }

      const validCheckpoints = ['day1', 'day2', 'certificateCollected'];
      if (!validCheckpoints.includes(checkpoint)) {
        return res.status(400).json({ error: 'Invalid checkpoint type' });
      }

      // Scanner ID comes from the authenticated JWT token (req.user is set by auth middleware)
      const scannerId = req.user.id;

      const result = await attendanceService.scanQR(token, checkpoint, scannerId);

      if (!result.success) {
        return res.status(result.status || 400).json({ error: result.error, scannedAt: result.scannedAt, student: result.student, workshop: result.workshop, status: 'duplicate' });
      }

      return res.status(200).json(result);
    } catch (error) {
      next(error); // Pass to global error handler
    }
  }
}

module.exports = new AttendanceController();
