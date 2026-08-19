import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(SERVER_DIR, ".env") });

const BACKEND_DIR = path.resolve(SERVER_DIR, "..", "backend");
dotenv.config({ path: path.join(BACKEND_DIR, ".env"), override: false });

export const config = {
  port: Number(process.env.PORT) || 8000,
  mongoUrl: process.env.MONGO_URL || process.env.MONGODB_URI,
  dbName: process.env.DB_NAME || "burnout_analyzer",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS) || 7,
  corsOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
  corsAllowAll: process.env.CORS_ALLOW_ALL !== "false",
};

if (!config.mongoUrl) {
  console.error("MONGO_URL/MONGODB_URI is missing. Ensure backend/.env exists with the connection string.");
  process.exit(1);
}
if (!config.jwtSecret) {
  console.error("JWT_SECRET is missing. Create server/.env with a random JWT_SECRET.");
  process.exit(1);
}