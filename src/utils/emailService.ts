import nodemailer from "nodemailer";

export const sendOtpEmail = async (to: string, otp: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
      <div style="max-width: 500px; margin: auto; background: white; border-radius: 10px; padding: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <h2 style="text-align: center; color: #ff6600;"> PhoneHub Email Verification</h2>
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 15px; color: #555;">
          Please use the following One-Time Password (OTP) to verify your email address:
        </p>
        <div style="text-align: center; margin: 25px 0;">
          <span style="display: inline-block; background-color: #ff6600; color: white; font-size: 22px; font-weight: bold; letter-spacing: 4px; padding: 10px 20px; border-radius: 8px;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">
          This OTP will expire in <strong>10 minutes</strong>.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 13px; color: #999; text-align: center;">
          If you didn’t request this verification, please ignore this email.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"PhoneHub" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 Verify Your Email — PhoneHub OTP",
    html: htmlContent,
  });
};
