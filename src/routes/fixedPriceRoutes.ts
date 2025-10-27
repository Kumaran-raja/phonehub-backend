import { Router } from "express";
import {
  createFixedPrice,
  getFixedPrices,
  getFixedById,
  getFixedBySellerPhone,
  updateFixedPrice,
  deleteFixedPrice,
  getFixedByUser,
} from "../controllers/fixedPriceController";
import { verifyToken } from "../auth/middleware";

const router = Router();

router.get("/", getFixedPrices);
router.get("/:id", getFixedById);
router.get("/seller/:phone", getFixedBySellerPhone);
router.get("/fixedseller/:id", getFixedByUser);

// protected
router.post("/create", verifyToken, createFixedPrice);
router.put("/:id", verifyToken, updateFixedPrice);
router.delete("/:id", verifyToken, deleteFixedPrice);

export default router;
