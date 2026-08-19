import { Router } from "express";
import { College, Faculty } from "../models/data.js";

const router = Router();

router.get("/meta", async (req, res, next) => {
  try {
    const [collegeDocs, facultyDocs] = await Promise.all([
      College.find({}, { name: 1, colleges: 1 }).lean(),
      Faculty.find(
        { university: { $ne: null }, campus: { $ne: null } },
        { university: 1, campus: 1, department: 1 }
      ).lean(),
    ]);

    const byUni = new Map();
    for (const c of collegeDocs) {
      if (!c.name) continue;
      const campuses = new Map();
      for (const name of c.colleges || []) {
        if (name) campuses.set(name, new Set());
      }
      byUni.set(c.name, campuses);
    }
    for (const d of facultyDocs) {
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