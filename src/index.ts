import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import "reflect-metadata";

import authRoutes from "./routes/authRoutes";
import auctionRoutes from "./routes/auctionRoutes";
import fixedPriceRoutes from "./routes/fixedPriceRoutes";
import bulkRoutes from "./routes/bulkRoutes";

import { AppDataSource, connectDB } from "./config/db";
import { User } from "./models/userModel";
import { FixedPrice } from "./models/FixedPrice";
import { Bulk } from "./models/BulkData";
import { autoDeleteUnverifiedUsers } from "./utils/autoDeleteUnverifiedUsers";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ✅ Allowed origins
const allowedOrigins = [
  "https://jazzy-meerkat-7f46d1.netlify.app",
  "http://localhost:5173",
];

// ✅ Apply CORS globally FIRST
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  // ✅ Handle OPTIONS preflight right here
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ✅ Connect to DB
connectDB().then(async () => {
  console.log("Starting auto-delete for unverified users...");
  await autoDeleteUnverifiedUsers();
  setInterval(autoDeleteUnverifiedUsers, 10 * 60 * 1000);
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/auction", auctionRoutes);
app.use("/api/fixedprice", fixedPriceRoutes);
app.use("/api/bulk", bulkRoutes);

// ✅ Example stats route
app.get("/api/stats", async (req, res) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const fixedRepo = AppDataSource.getRepository(FixedPrice);
    const bulkRepo = AppDataSource.getRepository(Bulk);

    const [userCount, fixedCount, bulkCount] = await Promise.all([
      userRepo.count(),
      fixedRepo.count(),
      bulkRepo.count(),
    ]);

    res.json({
      users: userCount,
      fixedProducts: fixedCount,
      bulkProducts: bulkCount,
      totalProducts: fixedCount + bulkCount,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
