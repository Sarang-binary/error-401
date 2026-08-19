import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import metaRoutes from "./routes/meta.js";
import facultyRoutes from "./routes/faculties.js";
import dashboardRoutes from "./routes/dashboard.js";
import recomputeRoutes from "./routes/recompute.js";

const app = express();

app.use(
  cors(
    config.corsAllowAll
      ? { origin: true, credentials: true }
      : { origin: config.corsOrigins, credentials: true }
  )
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ app: "Faculty Burnout Risk & Workload Analyzer API", docs: "/api/health" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "unreachable",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", metaRoutes);
app.use("/api/faculties", facultyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/recompute", recomputeRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// eslint-disable-next-line no-unused-vars -- Express error middleware requires 4 args
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

async function main() {
  await mongoose.connect(config.mongoUrl, {
    dbName: config.dbName,
    serverSelectionTimeoutMS: 8000,
  });
  console.log(`Mongo connected: ${config.dbName}`);
  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error("Startup failed:", err.message);
  process.exit(1);
});