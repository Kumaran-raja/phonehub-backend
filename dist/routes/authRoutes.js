"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../auth/authController");
const middleware_1 = require("../auth/middleware");
const tokenBlocklist_1 = require("../auth/tokenBlocklist");
const router = (0, express_1.Router)();
// Public
router.post("/signup", authController_1.signup);
router.post("/login", authController_1.login);
// Protected (any logged-in user)
router.get("/me", middleware_1.verifyToken, (req, res) => {
    // `verifyToken` middleware should attach user info to req.user
    const user = req.user;
    if (!user)
        return res.status(404).json({ message: "User not found" });
    res.json({ user });
});
// Vendor or Admin
router.get("/vendor-products", middleware_1.verifyToken, (0, middleware_1.requireRoles)(["vendor", "admin"]), (req, res) => {
    res.json({ message: "Vendor/Admin access granted" });
});
// Admin only
router.get("/all-users", middleware_1.verifyToken, (0, middleware_1.requireRoles)(["admin"]), (req, res) => {
    res.json({ message: "Admin access granted" });
});
router.post("/logout", middleware_1.verifyToken, (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];
    if (token)
        tokenBlocklist_1.tokenBlocklist.add(token); // add token to blocklist
    res.json({ message: "Logged out successfully" });
});
exports.default = router;
