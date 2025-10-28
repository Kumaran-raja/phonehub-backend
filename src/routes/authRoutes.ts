import { Router } from "express";
import { signup, login, verifyOtp } from "../auth/authController";
import { verifyToken } from "../auth/middleware";
import { tokenBlocklist } from "../auth/tokenBlocklist";
import { AppDataSource } from "../config/db";
import { User } from "../models/userModel";
import { Request, Response } from "express";

const router = Router();
const userRepo = AppDataSource.getRepository(User);

import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if not exists
const uploadDir = path.join(__dirname, "../../uploads/licenses");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Public
router.post("/signup", upload.single("tradelicence"), signup);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);

router.get("/me", verifyToken, async (req, res) => {
  try {
    const decodedUser = (req as any).user;
    if (!decodedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await userRepo.findOne({
      where: { id: decodedUser.id },
      select: [
        "id",
        "username",
        "email",
        "phone",
        "city",
        "sellertype",
        "storename",
        "storeaddress",
        "tradelicence",
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", verifyToken, (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];
  if (token) tokenBlocklist.add(token);
  res.json({ message: "Logged out successfully" });
});

router.put(
  "/update",
  verifyToken,
  upload.single("tradelicence"),
  async (req: Request, res: Response) => {
    try {
      const decodedUser = (req as any).user;
      if (!decodedUser)
        return res.status(401).json({ message: "Unauthorized" });

      const { username, phone, city, sellertype, storename, storeaddress } =
        req.body;

      const user = await userRepo.findOne({ where: { id: decodedUser.id } });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (username) user.username = username;
      if (phone) user.phone = phone;
      if (city) user.city = city;
      if (
        sellertype === "individual" ||
        sellertype === "business" ||
        sellertype === "buyer"
      ) {
        user.sellertype = sellertype;
      }

      if (user.sellertype === "business") {
        user.storename = storename || user.storename;
        user.storeaddress = storeaddress || user.storeaddress;

        // ✅ If a file is uploaded, store its relative path
        if (req.file) {
          user.tradelicence = `/uploads/licenses/${req.file.filename}`;
        }
      } else {
        user.storename = "";
        user.storeaddress = "";
        user.tradelicence = "";
      }

      await userRepo.save(user);

      const { password, emailOtp, ...safeUser } = user;
      res.json({ message: "Profile updated successfully", user: safeUser });
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
