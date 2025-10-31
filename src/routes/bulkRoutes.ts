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
  getLatestBulk,
} from "../controllers/bulkController";
import { verifyToken } from "../auth/middleware";

const router = Router();

router.get("/", getBulk);
router.get("/bulkseller/:id", getBulkByUser); // ✅ Keep before /:id
router.get("/:id", getBulkById);

router.post("/create", verifyToken, uploadBulk.array("images", 10), createBulk);
router.put("/:id", verifyToken, uploadBulk.array("images", 10), updateBulk);
router.delete("/:id", verifyToken, deleteBulk);
router.get("/latest", getLatestBulk);
export default router;
