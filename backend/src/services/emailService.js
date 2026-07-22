const nodemailer = require('nodemailer');
const db = require('../config/db');

/**
 * Get transporter configured with system_settings or process.env
 */
function getTransporter() {
  let host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  let port = parseInt(process.env.EMAIL_PORT || '587', 10);
  let secure = process.env.EMAIL_SECURE === 'true';
  let user = process.env.EMAIL_USER || '';
  let pass = process.env.EMAIL_PASS || '';

  try {
    const settings = db.prepare('SELECT smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure FROM system_settings WHERE id = 1').get();
    if (settings) {
      if (settings.smtp_host) host = settings.smtp_host;
      if (settings.smtp_port) port = parseInt(settings.smtp_port, 10);
      if (settings.smtp_user) user = settings.smtp_user;
      if (settings.smtp_pass) pass = settings.smtp_pass;
      if (settings.smtp_secure !== undefined && settings.smtp_secure !== null) secure = !!settings.smtp_secure;
    }
  } catch (_) {}

  if (!user || !pass) {
    return { transporter: null, user: null };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return { transporter, user };
}

/**
 * Send an OTP code to a user's email
 * @param {string} toEmail - Recipient email
 * @param {string} otpCode - Generated 6-digit OTP
 * @param {string} userName - Name of the user
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
async function sendOTPEmail(toEmail, otpCode, userName) {
  const { transporter, user } = getTransporter();

  console.log(`\n====================================================`);
  console.log(`[OTP GENERATED] To: ${toEmail} | User: ${userName}`);
  console.log(`🔑 VERIFICATION CODE (OTP): ${otpCode}`);
  console.log(`====================================================\n`);

  if (!transporter) {
    console.warn('[EmailService] SMTP credentials not set (EMAIL_USER / EMAIL_PASS in .env or system_settings). OTP printed to console log above.');
    return { sent: false, error: 'SMTP credentials missing. Please set EMAIL_USER and EMAIL_PASS.' };
  }

  const mailOptions = {
    from: `"ReelsPro Ultimate" <${user}>`,
    to: toEmail,
    subject: 'ReelsPro — Your Email Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #0f172a; color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #6366f1; margin: 0;">ReelsPro Ultimate</h2>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Account Verification</p>
        </div>
        <p style="font-size: 16px; color: #e2e8f0;">Hi <strong>${userName}</strong>,</p>
        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
          Thank you for signing up on ReelsPro! To complete your registration and activate your account, please enter the following 6-digit verification code:
        </p>
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 18px; text-align: center; border-radius: 12px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ffffff; margin: 25px 0; box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);">
          ${otpCode}
        </div>
        <p style="color: #94a3b8; font-size: 13px; text-align: center;">
          This code will expire in <strong>15 minutes</strong>. If you did not sign up for ReelsPro, you can ignore this message.
        </p>
        <hr style="border: 0; border-top: 1px solid #334155; margin: 25px 0;" />
        <p style="text-align: center; font-size: 12px; color: #64748b;">
          &copy; ${new Date().getFullYear()} ReelsPro Engine. All rights reserved.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[EmailService] OTP email delivered to', toEmail, '| MessageID:', info.messageId);
    return { sent: true };
  } catch (err) {
    console.error('[EmailService] Email delivery failed:', err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendOTPEmail, getTransporter };
