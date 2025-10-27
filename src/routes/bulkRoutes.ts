// src/routes/bulkRoutes.ts
import { Router } from "express";
import {
  createBulk,
  getBulk,
  getBulkById,
  updateBulk,
  deleteBulk,
} from "../controllers/bulkController";
import { verifyToken } from "../auth/middleware";

const router = Router();

// Public routes
router.get("/", getBulk);
router.get("/:id", getBulkById);

// Protected routes
router.post("/create", verifyToken, createBulk);
router.put("/:id", verifyToken, updateBulk);
router.delete("/:id", verifyToken, deleteBulk);

export default router;
