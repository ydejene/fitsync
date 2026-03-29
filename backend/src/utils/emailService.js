const nodemailer = require("nodemailer");
const path = require("path");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendResetPasswordEmail(userEmail, userName, resetUrl) {
  const logoPath = path.join(__dirname, "../../../frontend/public/logo.png");

  const mailOptions = {
    from: `"FitSync Support" <${process.env.SMTP_FROM || "support@fitsync.et"}>`,
    to: userEmail,
    subject: "Reset Your FitSync Password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; rounded-xl: 12px;">
        <div style="margin-bottom: 32px; text-align: center;">
          <img src="cid:fitsync-logo" alt="FitSync Logo" style="height: 48px; display: block; margin: 0 auto; border-radius: 10px;" />
        </div>
        
        <p style="font-size: 16px; color: #4B5563;">Hi ${userName},</p>
        
        <p style="font-size: 16px; color: #4B5563; line-height: 1.5;">
          We received a request to reset the password for your FitSync account. 
          Click the button below to choose a new password.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" 
             style="background-color: #F15A24; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="font-size: 14px; color: #9CA3AF; line-height: 1.5;">
          If you didn't request a password reset, you can safely ignore this email. 
          The link will expire in 1 hour.
        </p>
        
        <div style="border-top: 1px solid #e5e5e5; margin-top: 32px; padding-top: 16px; text-align: center;">
          <p style="font-size: 12px; color: #9CA3AF; margin: 0;">
            © ${new Date().getFullYear()} FitSync — Gym Management Platform
          </p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: "logo.png",
        path: logoPath,
        cid: "fitsync-logo", // Same as img src cid
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Reset email sent to: ${userEmail}`);
    console.log(`SMTP Response: ${info.response}`);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw error;
  }
}

module.exports = {
  sendResetPasswordEmail,
};
