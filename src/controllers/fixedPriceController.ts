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
    } = req.body;

    console.log("📦 Incoming Body:", req.body);
    console.log("🧑‍💻 Decoded User:", decodedUser);

    // --- Step 1: Initialize seller info from token/body
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

    // --- Step 2: If missing, lookup in DB by email
    if ((!sellerName || !sellerPhoneFinal) && decodedUser?.email) {
      const dbUser = await userRepo.findOne({
        where: { email: decodedUser.email },
        select: ["username", "phone", "email", "sellertype"],
      });
      if (dbUser) {
        if (!sellerName) sellerName = dbUser.username;
        if (!sellerPhoneFinal) sellerPhoneFinal = dbUser.phone;
      }
    }

    // --- Step 3: Validate essential fields
    if (!sellerName) {
      return res.status(400).json({
        message: "Seller name missing — please update your profile.",
      });
    }

    // --- Step 4: Create and save listing
    const fixed = fixedRepo.create({
      model,
      storage,
      price,
      specs: specs || null,
      condition,
      location,
      description: description || null,
      images: images || null,
      sellerType: sellerType || decodedUser?.sellertype || "individual",
      sellerName,
      sellerPhone: sellerPhoneFinal || null,
      verified: false,
    });

    await fixedRepo.save(fixed);
    res.status(201).json({ message: "✅ Fixed price created successfully", fixed });
  } catch (error) {
    console.error("❌ Error creating fixed price:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFixedPrices = async (_req: Request, res: Response) => {
  try {
    const list = await fixedRepo.find({ order: { createdAt: "DESC" } });
    res.json(list);
  } catch (error) {
    console.error("Error fetching fixed prices:", error);
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
