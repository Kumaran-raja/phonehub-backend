import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { FixedPrice } from "../models/FixedPrice";
import { User } from "../models/userModel";
import path from "path";
import multer from "multer";
import fs from "fs";
import { Between, ILike } from "typeorm";

const fixedRepo = AppDataSource.getRepository(FixedPrice);
const userRepo = AppDataSource.getRepository(User);

const uploadDir = path.join(__dirname, "../../uploads/fixedprice");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({ storage });
export const createFixedPrice = async (req: Request, res: Response) => {
  try {
    const decodedUser = (req as any).user;
    if (!decodedUser) return res.status(401).json({ message: "Unauthorized" });

    const {
      model,
      storage,
      variant,
      old,
      price,
      specs,
      condition,
      badgeType,
      location,
      description,
      sellerType,
      sellerEmail,
      batteryHealth,
    } = req.body;

    const user = await userRepo.findOne({ where: { id: decodedUser.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Handle uploaded images
    const imagePaths = req.files
      ? (req.files as Express.Multer.File[]).map(
          (file) => `/uploads/fixedprice/${file.filename}`
        )
      : [];

    const fixed = fixedRepo.create({
      model,
      storage,
      variant,
      price,
      old,
      specs: specs || null,
      condition,
      badgeType,
      location,
      description: description || null,
      images: imagePaths,
      sellerType: sellerType || user.sellertype,
      sellerName: user.username,
      sellerPhone: user.phone,
      sellerEmail: sellerEmail,
      batteryHealth: batteryHealth || null,
      verified: false,
      user,
      userId: user.id,
    });

    await fixedRepo.save(fixed);

    res.status(201).json({
      message: "Fixed price created successfully",
      fixed,
    });
  } catch (error) {
    console.error("Error creating fixed price:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getTimeAgo = (createdAt: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
};
export const getFixedPrices = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const skip = Number(req.query.skip) || 0;

    const {
      storage,
      sellerType,
      city,
      minPrice,
      maxPrice,
      condition,
      series,
      sort,
    } = req.query;

    const where: any = {};

    if (storage) where.storage = ILike(`%${storage}%`);
    if (sellerType) where.sellerType = String(sellerType);
    if (city) where.location = ILike(`%${city}%`);
    if (condition) where.condition = String(condition);
    if (series) where.model = ILike(`%${series}%`);

    if (minPrice || maxPrice) {
      const min = Number(minPrice) || 0;
      const max = Number(maxPrice) || 9999999;
      where.price = Between(min, max);
    }

    let order: any = { createdAt: "DESC" }; // default
    if (sort === "priceLowHigh") order = { price: "ASC" };
    else if (sort === "priceHighLow") order = { price: "DESC" };
    else if (sort === "ratingHighLow") order = { rating: "DESC" };

    const [list, total] = await fixedRepo.findAndCount({
      where,
      order,
      take: limit,
      skip,
    });

    const withTimeAgo = list.map((item) => ({
      ...item,
      postedAgo: getTimeAgo(item.createdAt),
    }));

    res.json({
      success: true,
      total,
      data: withTimeAgo,
    });
  } catch (error) {
    console.error("Error fetching fixed prices:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getLatestFixedPrices = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10; // default limit = 10
    const skip = Number(req.query.skip) || 0;

    const [list, total] = await fixedRepo.findAndCount({
      order: { createdAt: "DESC" }, // latest first
      take: limit,
      skip,
    });

    const withTimeAgo = list.map((item) => ({
      ...item,
      postedAgo: getTimeAgo(item.createdAt),
    }));

    res.json({
      success: true,
      total,
      data: withTimeAgo,
    });
  } catch (error) {
    console.error("Error fetching latest fixed prices:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFixedByUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const listings = await fixedRepo.find({
      where: { userId: Number(id) },
      order: { createdAt: "DESC" },
    });
    res.json(listings);
  } catch (error) {
    console.error("Error fetching user's listings:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getFixedById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fixed = await fixedRepo.findOne({ where: { id: Number(id) } });
    if (!fixed) return res.status(404).json({ message: "Not found" });
    res.json(fixed);
  } catch (error) {
    console.error("Error get fixed by id:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFixedBySellerPhone = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const list = await fixedRepo.find({
      where: { sellerPhone: phone },
      order: { createdAt: "DESC" },
    });
    res.json(list);
  } catch (error) {
    console.error("Error fetching by phone:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateFixedPrice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const decodedUser = (req as any).user;

    if (!decodedUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const fixed = await fixedRepo.findOne({ where: { id: Number(id) } });
    if (!fixed) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const user = await userRepo.findOne({ where: { id: decodedUser.id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Authorization check
    if (
      fixed.sellerName !== user.username &&
      fixed.sellerPhone !== user.phone
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // ✅ Handle uploaded images (new files)
    let newImages: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      newImages = (req.files as Express.Multer.File[]).map(
        (file) => `/uploads/fixedprice/${file.filename}`
      );
    }

    // ✅ Handle existing images (from frontend)
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

    // ✅ Final image list = remaining + new uploads
    const finalImages = [
      ...(Array.isArray(existingImages) ? existingImages : []),
      ...(Array.isArray(newImages) ? newImages : []),
    ];

    // ✅ Remove deleted images from disk
    fixed.images?.forEach((imgPath) => {
      if (!finalImages.includes(imgPath)) {
        const fullPath = path.join(__dirname, "../../", imgPath);
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (err) {
            console.warn("Failed to delete old image:", err);
          }
        }
      }
    });

    // ✅ Extract form fields
    const {
      model,
      storage,
      variant,
      old,
      price,
      specs,
      condition,
      badgeType,
      location,
      description,
      sellerType,
      batteryHealth,
      verified,
    } = req.body;

    // ✅ Update fields safely
    fixed.model = model || fixed.model;
    fixed.storage = storage || fixed.storage;
    fixed.variant = variant || fixed.variant;
    fixed.old = old || fixed.old;
    fixed.price = price || fixed.price;
    fixed.specs = specs || fixed.specs;
    fixed.condition = condition || fixed.condition;
    fixed.badgeType = badgeType || fixed.badgeType;
    fixed.location = location || fixed.location;
    fixed.description = description || fixed.description;
    fixed.images = finalImages.length ? finalImages : fixed.images;
    fixed.sellerType = sellerType || fixed.sellerType;
    fixed.sellerName = user.username;
    fixed.sellerPhone = user.phone;
    fixed.batteryHealth = batteryHealth || fixed.batteryHealth;
    fixed.verified =
      verified !== undefined ? Boolean(verified) : fixed.verified;

    await fixedRepo.save(fixed);

    res.json({
      message: "Fixed price listing updated successfully",
      fixed,
    });
  } catch (error) {
    console.error("Error updating fixed price:", error);
    if (error instanceof Error) {
      res.status(500).json({
        message: "Server error",
        error: error.message,
        stack: error.stack,
      });
    } else {
      res.status(500).json({ message: "Unknown server error", error });
    }
  }
};

export const deleteFixedPrice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const decodedUser = (req as any).user;
    const fixed = await fixedRepo.findOne({ where: { id: Number(id) } });
    if (!fixed) return res.status(404).json({ message: "Not found" });

    const seller = await userRepo.findOne({ where: { id: decodedUser.id } });
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    if (
      fixed.sellerName !== seller.username &&
      fixed.sellerPhone !== seller.phone
    )
      return res.status(403).json({ message: "Unauthorized" });

    await fixedRepo.remove(fixed);
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting fixed:", error);
    res.status(500).json({ message: "Server error" });
  }
};
