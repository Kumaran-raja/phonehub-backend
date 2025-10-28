import { Router } from "express";
import { verifyToken } from "../auth/middleware";
import {
  createAuction,
  getAuctions,
  getAuctionById,
  updateAuction,
  deleteAuction,
  placeBid,
} from "../controllers/auctionController";

const router = Router();

router.get("/", getAuctions);
router.get("/:id", getAuctionById);

router.post("/create", verifyToken, createAuction);
router.put("/:id", verifyToken, updateAuction);
router.delete("/:id", verifyToken, deleteAuction);
router.post("/bid", verifyToken, placeBid);

export default router;
