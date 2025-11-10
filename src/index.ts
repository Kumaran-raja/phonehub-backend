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
import { autoDeleteUnverifiedUsers } from "./utils/autoDeleteUnverifiedUsers";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ------- 1) CORS GUARD (must be first) -------
const allowedOrigins = [
  "https://jazzy-meerkat-7f46d1.netlify.app",
  "http://localhost:5173",
];
// if you use Netlify preview deploys, keep *.netlify.app enabled
const allowNetlifyPreview = (origin?: string) =>
  origin?.startsWith("https://") && origin.endsWith(".netlify.app");

app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;

  if (origin && (allowedOrigins.includes(origin) || allowNetlifyPreview(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.setHeader("Vary", "Origin"); // avoid cache mixups

  if (req.method === "OPTIONS") return res.sendStatus(204); // preflight OK
  next();
});
// ---------------------------------------------

// 2) normal middlewares
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(express.json());

// 3) (optional) also use cors() with same logic (belt & suspenders)
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin) || allowNetlifyPreview(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors()); // explicit preflight handler

// 4) quick origin logger (remove later)
app.use((req, _res, next) => {
  if (req.headers.origin) console.log("Origin:", req.headers.origin, req.method, req.path);
  next();
});

// 5) DB + scheduled job
connectDB().then(async () => {
  console.log("🕒 Starting auto-delete for unverified users...");
  await autoDeleteUnverifiedUsers();
  setInterval(autoDeleteUnverifiedUsers, 10 * 60 * 1000);
});

// 6) routes
app.use("/api/auth", authRoutes);
app.use("/api/auction", auctionRoutes);
app.use("/api/fixedprice", fixedPriceRoutes);
app.use("/api/bulk", bulkRoutes);

// 7) stats route (unchanged)
app.get("/api/stats", async (_req, res) => {
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

// 8) start
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
