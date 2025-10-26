import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/db";
import { User,SellerType } from "../models/userModel";

const SECRET = process.env.JWT_SECRET_KEY || "fallback_secret";

// Repository for User entity
const userRepo = AppDataSource.getRepository(User);

// ================== SIGNUP ==================
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
      tradelicence,
    } = req.body;

    // Check if email already exists
    const existingUser = await userRepo.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Optionally: check if username or phone already exists
    const existingUsername = await userRepo.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const existingPhone = await userRepo.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = userRepo.create({
      email,
      username,
      phone,
      city,
      password: hashedPassword,
      sellertype: sellertype || SellerType.INDIVIDUAL,
      storename,
      storeaddress,
      tradelicence, // can be a file path if uploaded
    });

    await userRepo.save(newUser);

    res.status(201).json({
      message: "User registered",
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        phone: newUser.phone,
        sellertype: newUser.sellertype,
        city: newUser.city,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// ================== LOGIN ==================

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await userRepo.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Generate JWT
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