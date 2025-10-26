import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { tokenBlocklist } from "./tokenBlocklist";

const SECRET = process.env.JWT_SECRET_KEY || "fallback_secret";

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(403).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Token malformed" });

  // Check if token is invalidated
  if (tokenBlocklist.has(token)) return res.status(401).json({ message: "Token invalidated" });

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Unauthorized" });
    (req as any).user = decoded;
    next();
  });
};

// Role-based middleware
export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(user.role)) return res.status(403).json({ message: "Access denied" });
    next();
  };
};
