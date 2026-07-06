const authService = require('../services/auth.service');

class AuthController {
  /**
   * @openapi
   * /auth/send-otp:
   *   post:
   *     summary: Request OTP for admin/scanner login
   *     description: Generates a 6-digit OTP and sends/logs it for the scanner or admin.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 example: test@gmail.com
   *     responses:
   *       200:
   *         description: OTP sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       400:
   *         description: Email is required
   *       404:
   *         description: Admin account not found
   */
  async sendOtp(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      const result = await authService.sendOtp(email);
      return res.status(200).json(result);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  }

  /**
   * @openapi
   * /auth/login:
   *   post:
   *     summary: Admin scanner login via OTP
   *     description: Authenticates an admin or scanner using email and OTP to receive a JWT token.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 example: test@gmail.com
   *               otp:
   *                 type: string
   *                 example: "123456"
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *       400:
   *         description: Missing credentials
   *       401:
   *         description: Invalid or expired OTP
   */
  async login(req, res, next) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
      }

      const result = await authService.loginWithOtp(email, otp);
      return res.status(200).json(result);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  }
}

module.exports = new AuthController();
