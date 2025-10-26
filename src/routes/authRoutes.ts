import { Router } from "express";
import { signup, login } from "../auth/authController";
import { verifyToken, requireRoles } from "../auth/middleware";
import { tokenBlocklist } from "../auth/tokenBlocklist";

const router = Router();

// Public
router.post("/signup", signup);
router.post("/login", login);

// Protected (any logged-in user)
router.get("/me", verifyToken, (req, res) => {
  // `verifyToken` middleware should attach user info to req.user
  const user = (req as any).user;
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ user });
});

// Vendor or Admin
router.get("/vendor-products", verifyToken, requireRoles(["vendor", "admin"]), (req, res) => {
  res.json({ message: "Vendor/Admin access granted" });
});

// Admin only
router.get("/all-users", verifyToken, requireRoles(["admin"]), (req, res) => {
  res.json({ message: "Admin access granted" });
});

router.post("/logout", verifyToken, (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];
  if (token) tokenBlocklist.add(token); // add token to blocklist
  res.json({ message: "Logged out successfully" });
});

export default router;
