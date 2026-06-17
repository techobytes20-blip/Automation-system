const { Resend } = require('resend');
const env = require('../../config/env');

class ResendProvider {
  constructor() {
    this.resend = null;
    const apiKey = env.resend.apiKey;
    if (apiKey && apiKey !== 'your_resend_api_key_here' && apiKey.trim() !== '') {
      this.resend = new Resend(apiKey);
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
      const response = await this.resend.emails.send({
        from: env.resend.from,
        to,
        subject,
        html,
        text
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('[RESEND PROVIDER] Error sending email:', error.message);
      throw error;
    }
  }
}

module.exports = new ResendProvider();
