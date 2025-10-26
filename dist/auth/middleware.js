"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const tokenBlocklist_1 = require("./tokenBlocklist");
const SECRET = process.env.JWT_SECRET_KEY || "fallback_secret";
const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader)
        return res.status(403).json({ message: "No token provided" });
    const token = authHeader.split(" ")[1];
    if (!token)
        return res.status(403).json({ message: "Token malformed" });
    // Check if token is invalidated
    if (tokenBlocklist_1.tokenBlocklist.has(token))
        return res.status(401).json({ message: "Token invalidated" });
    jsonwebtoken_1.default.verify(token, SECRET, (err, decoded) => {
        if (err)
            return res.status(401).json({ message: "Unauthorized" });
        req.user = decoded;
        next();
    });
};
exports.verifyToken = verifyToken;
// Role-based middleware
const requireRoles = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        if (!roles.includes(user.role))
            return res.status(403).json({ message: "Access denied" });
        next();
    };
};
exports.requireRoles = requireRoles;
