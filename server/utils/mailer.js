const nodemailer = require('nodemailer');

/**
 * Creates and returns a configured Nodemailer transport
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  // Check if SMTP is configured
  if (!host || !user || !pass || host === 'your-smtp-host') {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports (587, 25)
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });
}

/**
 * Sends a password reset OTP email
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.otp - 6-digit numeric OTP code
 * @param {string} [options.username] - Recipient username
 * @returns {Promise<{ sent: boolean, messageId?: string, error?: string }>}
 */
async function sendOtpEmail({ to, otp, username = 'Reader' }) {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(`[MAILER] SMTP is not yet configured in .env. OTP for ${to}: ${otp}`);
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const subject = `Your Password Reset Code: ${otp} - Blog App`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 32px 28px; line-height: 1.6; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
        .text { font-size: 15px; color: #475569; margin-bottom: 24px; }
        .otp-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 18px 24px; text-align: center; margin: 28px 0; }
        .otp-code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; margin: 0; }
        .otp-validity { font-size: 13px; color: #64748b; margin-top: 8px; font-weight: 500; }
        .security-note { font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; }
        .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Blog Application</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello, ${username}!</div>
          <p class="text">We received a request to reset your password. Use the following 6-digit verification code to complete your password reset:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="otp-validity">⏱ Code expires in 10 minutes</div>
          </div>

          <p class="text">Enter this code on the password reset screen to verify your identity and set a new password.</p>

          <div class="security-note">
            <strong>Security Reminder:</strong> If you did not request a password reset, please ignore this email or make sure your account is secure. Do not share this OTP with anyone.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Blog Application. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hello ${username},\n\nYour 6-digit password reset verification code is:\n\n${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.\n`;

  try {
    const info = await transporter.sendMail({
      from: `"Blog Application" <${fromAddress}>`,
      to,
      subject,
      text,
      html
    });

    console.log(`[MAILER] OTP email sent successfully to ${to} (Message ID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[MAILER] Failed to send OTP email to ${to}:`, error.message);
    return { sent: false, error: error.message };
  }
}

module.exports = {
  createTransporter,
  sendOtpEmail
};
