const { Resend } = require('resend');

// Initialize Resend with API key from environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an OTP email using Resend.
 * @param {string} email - Recipient email address.
 * @param {string} otp - The 6‑digit OTP.
 * @returns {Promise<boolean>} - Returns true if email sent, false otherwise.
 */
async function sendOTPEmail(email, otp) {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'BookHive OTP Verification',
      html: `
        <p>Hello,</p>
        <p>Your BookHive verification OTP is:</p>
        <h2 style="letter-spacing: 4px;">${otp}</h2>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you did not request this OTP, please ignore this email.</p>
        <p>Regards,<br/>BookHive Team</p>
      `,
    });
    console.log('✅ OTP email sent to', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return false;
  }
}

module.exports = { sendOTPEmail };
