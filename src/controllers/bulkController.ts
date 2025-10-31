import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { User } from "../models/userModel";
import { Bulk } from "../models/BulkData";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ILike } from "typeorm";
const bulkRepo = AppDataSource.getRepository(Bulk);
const userRepo = AppDataSource.getRepository(User);


const uploadDir = path.join(__dirname, "../../uploads/bulk");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
export const uploadBulk = multer({ storage });
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
      sellerType,
      sellerEmail,
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

    let images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      images = (req.files as Express.Multer.File[]).map(
        (file) => `/uploads/bulk/${file.filename}`
      );
    } else if (req.body.images) {
      try {
        images = JSON.parse(req.body.images);
      } catch {
        images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
      }
    }

    let parsedPricingTiers: any[] = [];
    if (Array.isArray(req.body.pricingTiers)) {
      parsedPricingTiers = req.body.pricingTiers.map((t: any) => {
        try {
          return typeof t === "string" ? JSON.parse(t) : t;
        } catch {
          return t;
        }
      });
    } else if (typeof req.body.pricingTiers === "string") {
      try {
        parsedPricingTiers = JSON.parse(req.body.pricingTiers);
      } catch {
        parsedPricingTiers = [];
      }
    }

    let parsedBulkFeatures: any[] = [];
    if (typeof bulkFeatures === "string") {
      try {
        parsedBulkFeatures = JSON.parse(bulkFeatures);
      } catch {
        parsedBulkFeatures = [];
      }
    } else if (Array.isArray(bulkFeatures)) {
      parsedBulkFeatures = bulkFeatures;
    }

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

    const bulk = bulkRepo.create({
      userId: decodedUser.id,
      model,
      storage,
      variant,
      deviceRegion,
      price,
      condition,
      location,
      description,
      images,
      sellerType: sellerType || decodedUser?.sellertype || "individual",
      sellerName,
      sellerPhone: sellerPhoneFinal || null,
      sellerEmail: sellerEmail,
      badgeType: badgeType || null,
      badgeText: badgeText || null,
      rating: rating || 0,
      verified: false,
      moqType,
      customMoq,
      pricingTiers: parsedPricingTiers,
      bulkFeatures: parsedBulkFeatures,
      quantity,
      unitPrice,
      totalPrice,
    });

    await bulkRepo.save(bulk);
    res.status(201).json({ message: "Bulk listing created", bulk });
  } catch (error: any) {
    console.error("Error creating bulk:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
  }
};

export const getBulk = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const skip = Number(req.query.skip) || 0;

    const {
      storage,
      sellerType,
      city,
      condition,
      series,
      sort, 
    } = req.query;

    const where: any = {};

    if (storage) where.storage = ILike(`%${storage}%`);
    if (sellerType) where.sellerType = String(sellerType);
    if (city) where.location = ILike(`%${city}%`);
    if (condition) where.condition = ILike(`%${condition}%`);
    if (series) where.model = ILike(`%${series}%`);

    let order: any = { createdAt: "DESC" }; // default
    if (sort === "priceLowHigh") order = { totalPrice: "ASC" };
    else if (sort === "priceHighLow") order = { totalPrice: "DESC" };
    else if (sort === "ratingHighLow") order = { rating: "DESC" }; // optional, if you have rating

    const [list, total] = await bulkRepo.findAndCount({
      where,
      order,
      skip,
      take: limit,
    });

    res.json({
      success: true,
      data: list,
      total,
      limit,
      skip,
      hasMore: skip + limit < total,
    });
  } catch (error) {
    console.error("Error fetching bulk:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getBulkById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await bulkRepo.findOne({ where: { id: Number(id) } });
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (error) {
    console.error("Error fetching bulk by id:", error);
    res.status(500).json({ message: "Server error" });
  }
};

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
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    let newImages: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      newImages = (req.files as Express.Multer.File[]).map(
        (file) => `/uploads/bulk/${file.filename}`
      );
    }

    let existingImages: string[] = [];
    if (req.body.existingImages) {
      try {
        existingImages = JSON.parse(req.body.existingImages);
      } catch {
        existingImages = Array.isArray(req.body.existingImages)
          ? req.body.existingImages
          : [req.body.existingImages];
      }
    }

const finalImages = [
  ...(Array.isArray(existingImages) ? existingImages : []),
  ...(Array.isArray(newImages) ? newImages : []),
];

bulk.images?.forEach((imgPath) => {
  if (!finalImages.includes(imgPath)) {
    const fullPath = path.join(__dirname, "../../", imgPath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); // delete old file
  }
});


    let parsedPricingTiers: any[] = [];
    if (req.body.pricingTiers) {
      if (Array.isArray(req.body.pricingTiers)) {
        parsedPricingTiers = req.body.pricingTiers.map((t: any) => {
          try {
            return typeof t === "string" ? JSON.parse(t) : t;
          } catch {
            return t;
          }
        });
      } else if (typeof req.body.pricingTiers === "string") {
        try {
          parsedPricingTiers = JSON.parse(req.body.pricingTiers);
        } catch {
          parsedPricingTiers = [];
        }
      }
    }

    let parsedBulkFeatures: any[] = [];
    if (req.body.bulkFeatures) {
      if (typeof req.body.bulkFeatures === "string") {
        try {
          parsedBulkFeatures = JSON.parse(req.body.bulkFeatures);
        } catch {
          parsedBulkFeatures = [];
        }
      } else if (Array.isArray(req.body.bulkFeatures)) {
        parsedBulkFeatures = req.body.bulkFeatures;
      }
    }

    const {
      id: _ignoreId,
      userId: _ignoreUserId,
      createdAt: _ignoreCreatedAt,
      updatedAt: _ignoreUpdatedAt,
      verified: _ignoreVerified,
      ...updatableFields
    } = req.body;

    Object.assign(bulk, {
      ...updatableFields,
      images: finalImages.length ? finalImages : bulk.images,
      pricingTiers:
        parsedPricingTiers.length > 0
          ? parsedPricingTiers
          : bulk.pricingTiers,
      bulkFeatures:
        parsedBulkFeatures.length > 0
          ? parsedBulkFeatures
          : bulk.bulkFeatures,
    });

    await bulkRepo.save(bulk);

    res.json({ message: "Bulk listing updated successfully", bulk });
  } catch (error) {
    console.error("Error updating bulk:", error);

    if (error instanceof Error) {
      res.status(500).json({
        message: "Server error",
        error: error.message,
        stack: error.stack,
      });
    } else {
      res.status(500).json({
        message: "Unknown server error",
        error,
      });
    }
  }
};

export const getLatestBulk = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const skip = Number(req.query.skip) || 0;

    const [list, total] = await bulkRepo.findAndCount({
      order: { createdAt: "DESC" },
      take: limit,
      skip,
    });

    res.json({
      success: true,
      total,
      limit,
      skip,
      hasMore: skip + limit < total,
      data: list,
    });
  } catch (error) {
    console.error("Error fetching latest bulk listings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

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
    res.json({ message: " Bulk deleted successfully" });
  } catch (error) {
    console.error(" Error deleting bulk:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//  Get All Bulk Listings by User ID
export const getBulkByUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // or use :userId
    const list = await bulkRepo.find({
      where: { userId: Number(id) },
      order: { createdAt: "DESC" },
    });
    res.json(list);
  } catch (error) {
    console.error(" Error fetching bulk by user:", error);
    res.status(500).json({ message: "Server error" });
  }
};
