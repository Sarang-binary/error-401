import { Router } from "express";
import { Faculty } from "../models/data.js";

const router = Router();

router.get("/meta", async (req, res, next) => {
  try {
    const docs = await Faculty.find(
      { university: { $ne: null }, campus: { $ne: null } },
      { university: 1, campus: 1, department: 1 }
    ).lean();

    const byUni = new Map();
    for (const d of docs) {
      if (!d.university || !d.campus) continue;
      if (!byUni.has(d.university)) {
        byUni.set(d.university, new Map());
      }
      const campuses = byUni.get(d.university);
      if (!campuses.has(d.campus)) {
        campuses.set(d.campus, new Set());
      }
      if (d.department) campuses.get(d.campus).add(d.department);
    }

    const universities = [...byUni.entries()]
      .map(([name, campuses]) => ({
        name,
        campuses: [...campuses.entries()]
          .map(([campus, departments]) => ({
            name: campus,
            departments: [...departments].sort(),
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ universities });
  } catch (err) {
    next(err);
  }
});

router.get("/meta/departments", async (req, res, next) => {
  try {
    const { university, campus } = req.query;
    if (!university || !campus) {
      return res.status(400).json({ error: "university and campus query params are required." });
    }
    const departments = await Faculty.distinct("department", {
      university: String(university),
      campus: String(campus),
    });
    res.json({ departments: departments.filter(Boolean).sort() });
  } catch (err) {
    next(err);
  }
});

export default router;