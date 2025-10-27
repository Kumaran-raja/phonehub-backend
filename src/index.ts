import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import auctionRoutes from "./routes/auctionRoutes";
import fixedPriceRoutes from "./routes/fixedPriceRoutes";
import { connectDB } from "./config/db";
import bulkRoutes from "./routes/bulkRoutes";

import "reflect-metadata";
import path from "path";
dotenv.config();
const app: Application = express();
const PORT = process.env.PORT || 5000;
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(express.json());

const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow Postman or server-to-server
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // allows cookies / Authorization headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auction", auctionRoutes);
app.use("/api/fixedprice", fixedPriceRoutes);

app.use("/api/bulk", bulkRoutes);
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
