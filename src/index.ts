import express, { Application } from "express";
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
import { autoDeleteUnverifiedUsers } from "./utils/autoDeleteUnverifiedUsers"; // ✅ import cleanup function

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(express.json());

const allowedOrigins = [
  "https://jazzy-meerkat-7f46d1.netlify.app",
  "http://localhost:5173",
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true); // allow same-origin / curl / Postman
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use((req, res, next) => {
  res.header("Vary", "Origin");
  next();
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));


connectDB().then(async () => {
  console.log("Starting auto-delete for unverified users...");

  await autoDeleteUnverifiedUsers();

  setInterval(autoDeleteUnverifiedUsers, 10 * 60 * 1000);
});

app.use("/api/auth", authRoutes);
app.use("/api/auction", auctionRoutes);
app.use("/api/fixedprice", fixedPriceRoutes);
app.use("/api/bulk", bulkRoutes);

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
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
