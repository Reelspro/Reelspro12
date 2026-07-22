const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

/**
 * Send an OTP code to a user's email
 * @param {string} toEmail - Recipient email
 * @param {string} otpCode - Generated 6-digit OTP
 * @param {string} userName - Name of the user
 * @returns {Promise<boolean>}
 */
async function sendOTPEmail(toEmail, otpCode, userName) {
  // If SMTP is not configured, fallback to console log for easy testing
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`\n[MAIL FALLBACK] =====================================`);
    console.log(`To: ${toEmail}`);
    console.log(`Hi ${userName},`);
    console.log(`Your ReelsPro Verification OTP code is: ${otpCode}`);
    console.log(`This code expires in 15 minutes.`);
    console.log(`====================================================\n`);
    return true;
  }

  const mailOptions = {
    from: `"ReelsPro Ultimate" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'ReelsPro — Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #f9f9f9;">
        <h2 style="color: #6c5ce7; text-align: center;">ReelsPro Account Verification</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Thank you for signing up on ReelsPro Ultimate! To complete your registration, please verify your email address by entering the following OTP code:</p>
        <div style="background-color: #e0dbff; padding: 15px; text-align: center; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #4834d4; margin: 20px 0;">
          ${otpCode}
        </div>
        <p style="color: #666; font-size: 13px;">This verification code will expire in <strong>15 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="text-align: center; font-size: 12px; color: #999;">ReelsPro Ultimate Engine — Automated System</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[EmailService] Email sent successfully:', info.messageId);
    return true;
  } catch (err) {
    console.error('[EmailService] Failed to send email:', err.message);
    return false;
  }
}

module.exports = { sendOTPEmail };
