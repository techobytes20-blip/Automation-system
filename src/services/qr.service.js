const crypto = require('crypto');

class QRService {
  /**
   * Generates a high-entropy, URL-safe random token.
   * @returns {String} 48-character hex string
   */
  generateSecureToken() {
    return crypto.randomBytes(24).toString('hex');
  }

  /**
   * Constructs the URL to fetch the QR code image.
   * @param {String} token 
   * @returns {String} URL string
   */
  generateQRUrl(token) {
    // In production, this might point to a dynamic QR generation API or an S3 bucket
    // For this design, we map it to an external or internal QR generation utility.
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(token)}`;
  }
}

module.exports = new QRService();
