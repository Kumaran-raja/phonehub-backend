import { AppDataSource } from "../config/db";
import { User } from "../models/userModel";

const userRepo = AppDataSource.getRepository(User);

/**
 * Automatically remove unverified users whose OTP expired > 10 min ago.
 */
export const autoDeleteUnverifiedUsers = async () => {
  const now = new Date();

  try {
    const expiredUsers = await userRepo
      .createQueryBuilder("user")
      .where("user.isVerified = :verified", { verified: false })
      .andWhere("user.emailOtpExpires IS NOT NULL")
      .andWhere("user.emailOtpExpires < :now", { now })
      .getMany();

    if (expiredUsers.length > 0) {
      console.log(`🧹 Deleting ${expiredUsers.length} unverified expired users...`);
      await userRepo.remove(expiredUsers);
    }
  } catch (err) {
    console.error("Auto cleanup error:", err);
  }
};
