import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { Auction } from "../models/Auction";
import { Bid } from "../models/Bid";
import { User } from "../models/userModel";

const auctionRepo = AppDataSource.getRepository(Auction);
const bidRepo = AppDataSource.getRepository(Bid);
const userRepo = AppDataSource.getRepository(User);

// 🟢 Create new auction
export const createAuction = async (req: Request, res: Response) => {
  try {
    const { model, specs, startBid, duration } = req.body;
    const decodedUser = (req as any).user;

    const seller = await userRepo.findOne({ where: { id: decodedUser.id } });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    const durationSeconds = duration * 3600;
    const endTime = new Date(Date.now() + durationSeconds * 1000);

    const auction = auctionRepo.create({
      model,
      specs,
      startBid,
      currentBid: startBid,
      bidsCount: 0,
      durationSeconds,
      endTime,
      sellerType: seller.sellertype,
      sellerName: seller.username,
    });

    await auctionRepo.save(auction);
    res.status(201).json({ message: "Auction created successfully", auction });
  } catch (error) {
    console.error("Error creating auction:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟢 Get all auctions
export const getAuctions = async (_req: Request, res: Response) => {
  try {
    const auctions = await auctionRepo.find({ relations: ["bids"] });
    const now = new Date();

    const formatted = auctions.map((auction) => {
      const remaining = Math.max(0, new Date(auction.endTime).getTime() - now.getTime());
      const hrs = Math.floor(remaining / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((remaining % (1000 * 60)) / 1000);

      const latestBid = auction.bids?.[auction.bids.length - 1];

      return {
        id: auction.id,
        model: auction.model,
        specs: auction.specs,
        currentBid: auction.currentBid,
        startBid: auction.startBid,
        bidsCount: auction.bidsCount,
        latestBidder: latestBid
          ? {
              name: latestBid.bidderName,
              timeAgo: `${Math.floor(
                (now.getTime() - latestBid.createdAt.getTime()) / 60000
              )} min ago`,
            }
          : null,
        countdown: { hrs, mins, secs },
        seller: {
          type: auction.sellerType,
          name: auction.sellerName,
        },
        date: auction.createdAt,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching auctions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟢 Get single auction by ID
export const getAuctionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const auction = await auctionRepo.findOne({
      where: { id: Number(id) },
      relations: ["bids"],
    });

    if (!auction) return res.status(404).json({ message: "Auction not found" });

    res.json(auction);
  } catch (error) {
    console.error("Error fetching auction by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟢 Update auction
export const updateAuction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const decodedUser = (req as any).user;

    const auction = await auctionRepo.findOne({ where: { id: Number(id) } });
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    const seller = await userRepo.findOne({ where: { id: decodedUser.id } });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // only owner can update
    if (auction.sellerName !== seller.username)
      return res.status(403).json({ message: "Unauthorized to update this auction" });

    const { model, specs, startBid, duration } = req.body;

    if (model) auction.model = model;
    if (specs) auction.specs = specs;
    if (startBid) auction.startBid = startBid;
    if (duration) {
      auction.durationSeconds = duration * 3600;
      auction.endTime = new Date(Date.now() + auction.durationSeconds * 1000);
    }

    await auctionRepo.save(auction);
    res.json({ message: "Auction updated successfully", auction });
  } catch (error) {
    console.error("Error updating auction:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟢 Delete auction
export const deleteAuction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const decodedUser = (req as any).user;

    const auction = await auctionRepo.findOne({ where: { id: Number(id) } });
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    const seller = await userRepo.findOne({ where: { id: decodedUser.id } });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // only owner can delete
    if (auction.sellerName !== seller.username)
      return res.status(403).json({ message: "Unauthorized to delete this auction" });

    await auctionRepo.remove(auction);
    res.json({ message: "Auction deleted successfully" });
  } catch (error) {
    console.error("Error deleting auction:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟢 Place a bid
export const placeBid = async (req: Request, res: Response) => {
  try {
    const { auctionId, bidAmount } = req.body;
    const decodedUser = (req as any).user;

    const auction = await auctionRepo.findOne({
      where: { id: auctionId },
      relations: ["bids"],
    });
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    if (new Date() > new Date(auction.endTime))
      return res.status(400).json({ message: "Auction has ended" });

    if (bidAmount <= Number(auction.currentBid))
      return res.status(400).json({ message: "Bid must be higher than current bid" });

    const bidder = await userRepo.findOne({ where: { id: decodedUser.id } });
    if (!bidder) return res.status(404).json({ message: "User not found" });

    const bid = bidRepo.create({
      auction,
      auctionId,
      bidderName: bidder.username,
      amount: bidAmount,
    });

    await bidRepo.save(bid);

    auction.currentBid = bidAmount;
    auction.bidsCount += 1;
    await auctionRepo.save(auction);

    res.json({ message: "Bid placed successfully", bid });
  } catch (error) {
    console.error("Error placing bid:", error);
    res.status(500).json({ message: "Server error" });
  }
};
