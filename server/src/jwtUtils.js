import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "./config.js";

export function signToken(payload, expiresIn = config.jwtExpiresIn) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function newSessionId() {
  return crypto.randomUUID();
}