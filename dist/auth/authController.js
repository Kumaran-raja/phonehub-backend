"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const userModel_1 = require("../models/userModel");
const SECRET = process.env.JWT_SECRET_KEY || "fallback_secret";
// Repository for User entity
const userRepo = db_1.AppDataSource.getRepository(userModel_1.User);
// ================== SIGNUP ==================
const signup = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        // Check if email already exists
        const existingUser = await userRepo.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create new user
        const newUser = userRepo.create({
            email,
            password: hashedPassword,
            role: role || userModel_1.Role.USER, // default role
        });
        await userRepo.save(newUser);
        res.json({
            message: "User registered",
            user: { id: newUser.id, email: newUser.email, role: newUser.role },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.signup = signup;
// ================== LOGIN ==================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userRepo.findOne({ where: { email } });
        if (!user)
            return res.status(401).json({ message: "Invalid credentials" });
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch)
            return res.status(401).json({ message: "Invalid credentials" });
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: "1h" });
        res.json({ token });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.login = login;
