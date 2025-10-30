import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const DB_ENGINE = process.env.DB_ENGINE?.toLowerCase();
const DB_HOST = process.env.DB_HOST;
const DB_PORT = Number(process.env.DB_PORT);
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_NAME = process.env.DB_NAME;

let type: "mysql" | "mariadb" | "postgres";
switch (DB_ENGINE) {
  case "mysql":
    type = "mysql";
    break;
  case "mariadb":
    type = "mariadb";
    break;
  case "postgres":
  case "postgresql":
    type = "postgres";
    break;
  default:
    throw new Error(`Unsupported DB_ENGINE: ${DB_ENGINE}`);
}

export const AppDataSource = new DataSource({
  type,
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  synchronize: true,
  logging: ["error"],
  entities: [path.join(__dirname, "../models/**/*.{ts,js}")],

  // SSL for Coolify or cloud MySQL
  ssl:
    type === "mysql"
      ? { rejectUnauthorized: false }
      : undefined,
});

export const connectDB = async () => {
  try {
    await AppDataSource.initialize();
    console.log(`✅ Connected to ${DB_ENGINE} database`);
  } catch (error) {
    console.error(`❌ Failed to connect to ${DB_ENGINE}`, error);
    process.exit(1);
  }
};
