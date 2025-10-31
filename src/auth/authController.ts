import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/db";
import { User, SellerType } from "../models/userModel";
import { sendOtpEmail } from "../utils/emailService";

const SECRET = process.env.JWT_SECRET_KEY || "fallback_secret";
const userRepo = AppDataSource.getRepository(User);
export const signup = async (req: Request, res: Response) => {
  try {
    const {
      email,
      username,
      phone,
      city,
      password,
      sellertype,
      storename,
      storeaddress,
    } = req.body;

    const existingUser = await userRepo.findOne({ where: { email } });
    if (existingUser && !existingUser.isVerified) {
      const now = new Date();
      if (existingUser.emailOtpExpires && existingUser.emailOtpExpires < now) {
        await userRepo.remove(existingUser);
      } else {
        return res
          .status(400)
          .json({ message: "Please try again after 10 minutes." });
      }
    }

    if (await userRepo.findOne({ where: { email } }))
      return res.status(400).json({ message: "Email already registered" });

    if (await userRepo.findOne({ where: { username } }))
      return res.status(400).json({ message: "Username taken" });

    if (await userRepo.findOne({ where: { phone } }))
      return res.status(400).json({ message: "Phone already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    let userType: SellerType;
    if (sellertype === SellerType.BUSINESS) userType = SellerType.BUSINESS;
    else if (sellertype === SellerType.BUYER) userType = SellerType.BUYER;
    else userType = SellerType.INDIVIDUAL;

    const newUser = userRepo.create({
      email,
      username,
      phone,
      city,
      password: hashedPassword,
      sellertype: userType,
      storename: userType === SellerType.BUSINESS ? storename || "" : "",
      storeaddress: userType === SellerType.BUSINESS ? storeaddress || "" : "",
      emailOtp: otp,
      emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000), // OTP expires in 10 minutes
      isVerified: false,
    });

    await userRepo.save(newUser);

    await sendOtpEmail(email, otp, "signup");

    res.status(201).json({
      message:
        "User registered successfully. Please check your email for OTP (valid for 10 minutes).",
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const user = await userRepo.findOne({ where: { email } });

    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ message: "User already verified" });

    const now = new Date();
    if (!user.emailOtpExpires || user.emailOtpExpires < now) {
      await userRepo.remove(user);
      return res
        .status(400)
        .json({
          message: "OTP expired. Please register again after 10 minutes.",
        });
    }

    if (user.emailOtp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    user.isVerified = true;
    user.emailOtp = null;
    user.emailOtpExpires = null;

    await userRepo.save(user);
    res.json({ message: "Email verified successfully! You can now login." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await userRepo.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerified)
      return res
        .status(403)
        .json({ message: "Please verify your email first" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, sellertype: user.sellertype },
      SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await userRepo.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins validity

    await userRepo.save(user);

    await sendOtpEmail(email, otp, "forgotPassword");

    res.json({
      message: "OTP sent to your email for password reset",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyResetOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const user = await userRepo.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.resetOtp || user.resetOtp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (user.resetOtpExpires && user.resetOtpExpires < new Date())
      return res.status(400).json({ message: "OTP expired" });

    res.json({
      message: "OTP verified successfully. You can now reset password.",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await userRepo.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.resetOtp || user.resetOtp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (user.resetOtpExpires && user.resetOtpExpires < new Date())
      return res.status(400).json({ message: "OTP expired" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetOtp = null;
    user.resetOtpExpires = null;

    await userRepo.save(user);

    res.json({ message: "Password reset successful. You can now login." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
