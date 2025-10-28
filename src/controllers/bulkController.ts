// src/controllers/bulkController.ts
import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { User } from "../models/userModel";
import { Bulk } from "../models/BulkData";

const bulkRepo = AppDataSource.getRepository(Bulk);
const userRepo = AppDataSource.getRepository(User);

// ✅ Create Bulk Listing (Protected)
export const createBulk = async (req: Request, res: Response) => {
  try {
    const decodedUser = (req as any).user;
    const {
      model,
      storage,
      variant,
      deviceRegion,
      price,
      condition,
      location,
      description,
      images,
      sellerType,
      badgeType,
      badgeText,
      rating,
      moqType,
      customMoq,
      pricingTiers,
      bulkFeatures,
      quantity,
      unitPrice,
      totalPrice,
    } = req.body;

    // 🧠 Get seller info from JWT or DB
    let sellerName =
      req.body.sellerName?.trim() ||
      decodedUser?.username ||
      decodedUser?.name ||
      "";
    let sellerPhoneFinal =
      req.body.sellerPhone?.trim() ||
      decodedUser?.phone ||
      decodedUser?.mobile ||
      "";

    if ((!sellerName || !sellerPhoneFinal) && decodedUser?.email) {
      const dbUser = await userRepo.findOne({
        where: { email: decodedUser.email },
        select: ["username", "phone"],
      });
      if (dbUser) {
        if (!sellerName) sellerName = dbUser.username;
        if (!sellerPhoneFinal) sellerPhoneFinal = dbUser.phone;
      }
    }

    if (!sellerName)
      return res
        .status(400)
        .json({ message: "Seller name missing — please update your profile." });

    // ✅ Create new bulk listing
    const bulk = bulkRepo.create({
      userId: decodedUser.id, // ✅ link with logged-in user
      model,
      storage,
      variant,
      deviceRegion,
      price,
      condition,
      location,
      description,
      images: images || null,
      sellerType: sellerType || decodedUser?.sellertype || "individual",
      sellerName,
      sellerPhone: sellerPhoneFinal || null,
      badgeType: badgeType || null,
      badgeText: badgeText || null,
      rating: rating || 0,
      verified: false,
      moqType,
      customMoq,
      pricingTiers,
      bulkFeatures,
      quantity,
      unitPrice,
      totalPrice,
    });

    await bulkRepo.save(bulk);
    res.status(201).json({ message: "✅ Bulk listing created", bulk });
  } catch (error: any) {
    console.error("❌ Error creating bulk:", error);
    res
      .status(500)
      .json({
        message: "Server error",
        error: error.message,
        stack: error.stack,
      });
  }
};


// ✅ Get All Bulk Listings (with limit + skip)
export const getBulk = async (req: Request, res: Response) => {
  try {
    // parse query params
    const limit = Number(req.query.limit) || 10; // default 10
    const skip = Number(req.query.skip) || 0;    // default 0

    const [list, total] = await bulkRepo.findAndCount({
      order: { createdAt: "DESC" },
      skip,
      take: limit,
    });

    res.json({
      data: list,
      total,
      limit,
      skip,
      hasMore: skip + limit < total,
    });
  } catch (error) {
    console.error("❌ Error fetching bulk:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ Get Bulk Listing by ID
export const getBulkById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await bulkRepo.findOne({ where: { id: Number(id) } });
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (error) {
    console.error("❌ Error fetching bulk by id:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update Bulk Listing (Protected)
export const updateBulk = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const decodedUser = (req as any).user;

    const bulk = await bulkRepo.findOne({ where: { id: Number(id) } });
    if (!bulk) return res.status(404).json({ message: "Not found" });

    const seller = await userRepo.findOne({ where: { id: decodedUser.id } });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    if (
      bulk.sellerName !== seller.username &&
      bulk.sellerPhone !== seller.phone
    )
      return res.status(403).json({ message: "Unauthorized" });

    Object.assign(bulk, req.body);
    await bulkRepo.save(bulk);

    res.json({ message: "✅ Bulk updated", bulk });
  } catch (error) {
    console.error("❌ Error updating bulk:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete Bulk Listing (Protected)
export const deleteBulk = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const decodedUser = (req as any).user;

    const bulk = await bulkRepo.findOne({ where: { id: Number(id) } });
    if (!bulk) return res.status(404).json({ message: "Not found" });

    const seller = await userRepo.findOne({ where: { id: decodedUser.id } });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    if (
      bulk.sellerName !== seller.username &&
      bulk.sellerPhone !== seller.phone
    )
      return res.status(403).json({ message: "Unauthorized" });

    await bulkRepo.remove(bulk);
    res.json({ message: "✅ Bulk deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting bulk:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get All Bulk Listings by User ID
export const getBulkByUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // or use :userId
    const list = await bulkRepo.find({
      where: { userId: Number(id) },
      order: { createdAt: "DESC" },
    });
    res.json(list);
  } catch (error) {
    console.error("❌ Error fetching bulk by user:", error);
    res.status(500).json({ message: "Server error" });
  }
};
