import { Router } from "express";
import { signup, login, verifyOtp } from "../auth/authController";
import { verifyToken } from "../auth/middleware";
import { tokenBlocklist } from "../auth/tokenBlocklist";
import { AppDataSource } from "../config/db";
import { SellerType, User } from "../models/userModel";
import { Request, Response } from "express";

const router = Router();
const userRepo = AppDataSource.getRepository(User);

// Public
router.post("/signup", signup);
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
  if (token) tokenBlocklist.add(token); // add token to blocklist
  res.json({ message: "Logged out successfully" });
});


router.put("/update", verifyToken, async (req: Request, res: Response) => {
  try {
    const decodedUser = (req as any).user;
    if (!decodedUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      username,
      phone,
      city,
      sellertype,
      storename,
      storeaddress,
      tradelicence,
    } = req.body;

    const user = await userRepo.findOne({ where: { id: decodedUser.id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🚫 Prevent email updates explicitly
    // (even if attacker sends email field manually)
    if ("email" in req.body) {
      delete (req.body as any).email;
    }

    // ✅ Update allowed fields only
    if (username) user.username = username;
    if (phone) user.phone = phone;
    if (city) user.city = city;
    if (sellertype && Object.values(SellerType).includes(sellertype)) {
      user.sellertype = sellertype;
    }

    // ✅ Handle business / individual fields properly
    if (user.sellertype === SellerType.BUSINESS) {
      user.storename = storename || user.storename;
      user.storeaddress = storeaddress || user.storeaddress;
      user.tradelicence = tradelicence || user.tradelicence;
    } else {
      // clear business fields if user switches to individual
      user.storename = "";
      user.storeaddress = "";
      user.tradelicence = "";
    }

    await userRepo.save(user);

    // 🧹 Return safe user data (no password or OTP)
    const { password, emailOtp, ...safeUser } = user;

    return res.json({
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
