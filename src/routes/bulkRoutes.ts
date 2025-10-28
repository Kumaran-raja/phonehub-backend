// src/routes/bulkRoutes.ts
import { Router } from "express";
import {
  createBulk,
  getBulk,
  getBulkById,
  updateBulk,
  deleteBulk,
  getBulkByUser,
  uploadBulk,
} from "../controllers/bulkController";
import { verifyToken } from "../auth/middleware";

const router = Router();

// ✅ Public routes
router.get("/", getBulk);
router.get("/bulkseller/:id", getBulkByUser); // ✅ Keep before /:id
router.get("/:id", getBulkById);

// ✅ Protected routes (with verifyToken)
router.post("/create", verifyToken, uploadBulk.array("images", 10), createBulk);
router.put("/:id", verifyToken, uploadBulk.array("images", 10), updateBulk);
router.delete("/:id", verifyToken, deleteBulk);

export default router;
