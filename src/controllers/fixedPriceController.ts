import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { FixedPrice } from "../models/FixedPrice";
import { User } from "../models/userModel";

const fixedRepo = AppDataSource.getRepository(FixedPrice);
const userRepo = AppDataSource.getRepository(User);

// Create fixed-price listing (protected)
export const createFixedPrice = async (req: Request, res: Response) => {
  try {
    const decodedUser = (req as any).user;

    const {
      model,
      storage,
      price,
      specs,
      condition,
      location,
      description,
      images,
      sellerType,
      batteryHealth,
    } = req.body;

    const user = await userRepo.findOne({ where: { id: decodedUser.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const fixed = fixedRepo.create({
      model,
      storage,
      price,
      specs: specs || null,
      condition,
      location,
      description: description || null,
      images: images || null,
      sellerType: sellerType || user.sellertype,
      sellerName: user.username,
      sellerPhone: user.phone,
      batteryHealth: batteryHealth || null,
      verified: false,
      user, // ✅ attach relation
      userId: user.id, // ✅ store FK
    });

    await fixedRepo.save(fixed);

    res.status(201).json({
      message: "✅ Fixed price created successfully",
      fixed,
    });
  } catch (error) {
    console.error("❌ Error creating fixed price:", error);
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

export const getFixedPrices = async (_req: Request, res: Response) => {
  try {
    const list = await fixedRepo.find({ order: { createdAt: "DESC" } });
    const withTimeAgo = list.map((item) => ({
      ...item,
      postedAgo: getTimeAgo(item.createdAt), // ✅ dynamically add
    }));
    res.json(withTimeAgo);
  } catch (error) {
    console.error("Error fetching fixed prices:", error);
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
    const fixed = await fixedRepo.findOne({ where: { id: Number(id) } });
    if (!fixed) return res.status(404).json({ message: "Not found" });

    const seller = await userRepo.findOne({ where: { id: decodedUser.id } });
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    if (
      fixed.sellerName !== seller.username &&
      fixed.sellerPhone !== seller.phone
    )
      return res.status(403).json({ message: "Unauthorized" });

    const {
      model,
      storage,
      price,
      specs,
      condition,
      location,
      description,
      images,
      sellerType,
      sellerPhone,
      verified,
    } = req.body;

    if (model) fixed.model = model;
    if (storage) fixed.storage = storage;
    if (price) fixed.price = price;
    if (specs !== undefined) fixed.specs = specs;
    if (condition) fixed.condition = condition;
    if (location) fixed.location = location;
    if (description !== undefined) fixed.description = description;
    if (images !== undefined) fixed.images = images;
    if (sellerType) fixed.sellerType = sellerType;
    if (sellerPhone) fixed.sellerPhone = sellerPhone;
    if (verified !== undefined) fixed.verified = Boolean(verified);

    await fixedRepo.save(fixed);
    res.json({ message: "Updated", fixed });
  } catch (error) {
    console.error("Error updating fixed:", error);
    res.status(500).json({ message: "Server error" });
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
