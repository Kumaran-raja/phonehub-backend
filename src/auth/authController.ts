import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/db";
import { User, SellerType } from "../models/userModel";
import { sendOtpEmail } from "../utils/emailService";

const SECRET = process.env.JWT_SECRET_KEY || "fallback_secret";
const userRepo = AppDataSource.getRepository(User);

// ===== SIGNUP =====

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, username, phone, city, password, sellertype, storename, storeaddress, tradelicence } = req.body;

    // Check duplicates
    if (await userRepo.findOne({ where: { email } })) return res.status(400).json({ message: "Email already registered" });
    if (await userRepo.findOne({ where: { username } })) return res.status(400).json({ message: "Username taken" });
    if (await userRepo.findOne({ where: { phone } })) return res.status(400).json({ message: "Phone already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = userRepo.create({
      email, username, phone, city,
      password: hashedPassword,
      sellertype: sellertype || SellerType.INDIVIDUAL,
      storename, storeaddress, tradelicence,
      emailOtp: otp,
      isVerified: false,
    });

    await userRepo.save(newUser);

    // Send OTP email
    await sendOtpEmail(email, otp);

    res.status(201).json({
      message: "User registered. Please check your email for OTP to verify your account.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ===== VERIFY EMAIL =====
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const user = await userRepo.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    if (user.emailOtp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    user.isVerified = true;
    user.emailOtp = null;
    await userRepo.save(user);

    res.json({ message: "Email verified successfully! You can now login." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ===== LOGIN =====
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await userRepo.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerified) return res.status(403).json({ message: "Please verify your email first" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

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
