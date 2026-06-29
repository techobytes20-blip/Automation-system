const { Resend } = require('resend');
const env = require('../../config/env');

class ResendProvider {
  constructor() {
    this.resend = null;
    this.fromAddress = env.resend.from || 'noreply@workshop.com';
    const apiKey = env.resend.apiKey;
    if (apiKey && apiKey !== 'your_resend_api_key_here' && apiKey.trim() !== '') {
      this.resend = new Resend(apiKey);
      console.log(`[RESEND PROVIDER] Initialized with from address: ${this.fromAddress}`);
      if (this.fromAddress.includes('@resend.dev')) {
        console.warn('[RESEND PROVIDER] ⚠️  WARNING: Using sandbox sender (onboarding@resend.dev).');
        console.warn('[RESEND PROVIDER] ⚠️  Emails can ONLY be delivered to your Resend account\'s verified email.');
        console.warn('[RESEND PROVIDER] ⚠️  To send to any recipient, verify a custom domain at https://resend.com/domains');
      }
    } else {
      console.warn('[RESEND PROVIDER] API Key is not set or is using placeholder. Running in MOCK mode.');
    }
  }

  /**
   * Sends an email via Resend (or logs to console if in mock mode).
   * @param {Object} options { to, subject, html, text }
   * @returns {Promise<Object>} Resend response data or mock metadata
   */
  async sendEmail(options) {
    const { to, subject, html, text } = options;

    if (!this.resend) {
      console.log(`[RESEND PROVIDER] [MOCK] Sending Email:
      From: ${env.resend.from}
      To: ${to}
      Subject: ${subject}
      Content Type: ${html ? 'HTML' : 'Text'}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id: `mock-resend-id-${Math.random().toString(36).substr(2, 9)}` };
    }

    try {
      console.log(`[RESEND PROVIDER] Attempting to send email from: ${this.fromAddress} to: ${to}`);
      
      const response = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject,
        html,
        text
      });

      console.log('[RESEND PROVIDER] API Response:', JSON.stringify(response));

      if (response.error) {
        console.error(`[RESEND PROVIDER] API returned error: ${response.error.name} - ${response.error.message}`);
        throw new Error(response.error.message);
      }

      console.log(`[RESEND PROVIDER] Email sent successfully, id: ${response.data?.id}`);
      return response.data;
    } catch (error) {
      console.error('[RESEND PROVIDER] Error sending email:', error.message);
      if (error.statusCode) {
        console.error(`[RESEND PROVIDER] Status code: ${error.statusCode}`);
      }
      throw error;
    }
  }
}

module.exports = new ResendProvider();
