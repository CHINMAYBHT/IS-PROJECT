const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const createOTPResetTemplate = (userName, otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chat App - Password Reset OTP</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; }
            body { margin: 0; padding: 0; }
            body, p, td { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7f7f7; color: #1f2937; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 320px; background-color: #f7f7f7;">
            <tr>
                <td align="center" style="padding: 20px 10px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 6px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);">

                        <!-- Header -->
                        <tr>
                            <td align="left" style="padding: 20px 30px; border-bottom: 1px solid #e5e7eb;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                                    <tr>
                                        <td align="left" style="vertical-align: middle;">
                                            <h1 style="color: #1f2937; margin: 0; font-size: 24px; font-weight: 700;">
                                                Chat App
                                            </h1>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Main Content -->
                        <tr>
                            <td align="left" style="padding: 30px 30px 20px 30px; background-color: #ffffff;">
                                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Hi ${userName},</h2>

                                <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                                    You requested a password reset for your Chat App account. Here is your verification code:
                                </p>

                                <!-- OTP Display -->
                                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 20px; margin: 20px 0; text-align: center;">
                                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #374151; font-weight: 600;">
                                        Your Verification Code:
                                    </p>
                                    <p style="margin: 0; font-size: 24px; color: #1f2937; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 10px 20px; border-radius: 4px; letter-spacing: 2px; display: inline-block; border: 1px solid #e5e7eb;">
                                        ${otp}
                                    </p>
                                </div>

                                <p style="color: #4b5563; margin: 20px 0 0 0; font-size: 14px; line-height: 1.6;">
                                    Enter this code in the verification field to proceed with your password reset. This code will expire in 15 minutes.
                                </p>

                                <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 12px; line-height: 1.5;">
                                    If you didn't request a password reset, please ignore this email.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td align="center" style="padding: 20px 30px; background-color: #f7f7f7; border-top: 1px solid #e5e7eb; border-radius: 0 0 6px 6px;">
                                <p style="color: #6b7280; font-size: 11px; margin: 0; line-height: 1.5;">
                                    This email was sent by Chat App. Please do not reply to this automated message.
                                </p>
                                <p style="color: #9ca3af; font-size: 10px; margin-top: 5px;">
                                    &copy; ${new Date().getFullYear()} Chat App.
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
  `;
};

const sendOTPReset = async (userEmail, userName, otp) => {
  try {
    console.log(`📧 [EMAIL] Preparing OTP email for ${userEmail}`);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Chat App - Password Reset Verification Code',
      html: createOTPResetTemplate(userName, otp)
    };

    console.log(`📧 [EMAIL] Sending OTP email to ${userEmail}...`);
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ [EMAIL] OTP email sent successfully:`, result.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ [EMAIL] Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

const sendPasswordReset = async (userEmail, userName, password) => {
  try {
    console.log(`📧 [EMAIL] Preparing password reset email for ${userEmail}`);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Chat App - Password Recovery',
      html: createPasswordResetTemplate(userName, password)
    };

    console.log(`📧 [EMAIL] Sending email to ${userEmail}...`);
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ [EMAIL] Password reset email sent successfully:`, result.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ [EMAIL] Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTPReset, sendPasswordReset };
