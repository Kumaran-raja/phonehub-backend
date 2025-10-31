import { Router } from "express";
import {
  createFixedPrice,
  getFixedPrices,
  getFixedById,
  getFixedBySellerPhone,
  updateFixedPrice,
  deleteFixedPrice,
  getFixedByUser,
  upload,
  getLatestFixedPrices, // 👈 import multer upload from controller
} from "../controllers/fixedPriceController";
import { verifyToken } from "../auth/middleware";

const router = Router();

router.get("/", getFixedPrices);
router.get("/:id", getFixedById);
router.get("/seller/:phone", getFixedBySellerPhone);
router.get("/fixedseller/:id", getFixedByUser);

router.post("/create", verifyToken, upload.array("images", 5), createFixedPrice); // ✅ upload here
router.put("/:id", verifyToken, upload.array("images", 5), updateFixedPrice);

router.delete("/:id", verifyToken, deleteFixedPrice);
router.get("/latest", getLatestFixedPrices);
export default router;
