import { Router } from "express";
import { verifyToken } from "../auth/middleware";
import { createAuction, getAuctions, placeBid } from "../controllers/auctionController";

const router = Router();

// Public route
router.get("/", getAuctions);

// Protected routes
router.post("/create", verifyToken, createAuction);
router.post("/bid", verifyToken, placeBid);

export default router;
