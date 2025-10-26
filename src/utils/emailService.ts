// src/utils/sendEmail.ts
import nodemailer from "nodemailer";

export const sendOtpEmail = async (to: string, otp: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "PhoneHub Email Verification OTP",
    text: `Your OTP to verify your email is: ${otp}. It will expire in 10 minutes.`,
  });
};
