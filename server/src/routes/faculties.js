import { Router } from "express";
import { authenticate, requireRole } from "../authMiddleware.js";
import { ClassSession, Deadline, Duty, Faculty, RiskScore, Suggestion, docToApi } from "../models/data.js";

const router = Router();

router.use(authenticate);

router.get("/me", async (req, res, next) => {
  try {
    if (!req.user.facultyId) {
      return res.status(400).json({ error: "Only faculty accounts have personal metrics." });
    }
    return res.json(await detail(req.user.facultyId));
  } catch (err) {
    next(err);
  }
});

router.get("/", requireRole("hod", "admin", "guest"), async (req, res, next) => {
  try {
    const docs = await Faculty.find({}).sort({ department: 1, name: 1 }).lean();
    const riskByFid = new Map(
      (await RiskScore.find({}).lean()).map((r) => [r.faculty_id, r])
    );
    res.json(
      docs.map((d) => ({
        id: d._id.toString(),
        name: d.name,
        email: d.email,
        department: d.department,
        designation: d.designation,
        university: d.university || null,
        campus: d.campus || null,
        contract_hours: d.contract_hours ?? 40,
        fte: d.fte ?? 1.0,
        risk_score: riskByFid.get(d._id.toString())?.score ?? null,
        risk_level: riskByFid.get(d._id.toString())?.level ?? "Unknown",
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (
      req.user.role !== "hod" &&
      req.user.role !== "admin" &&
      req.user.role !== "guest" &&
      req.user.facultyId !== req.params.id
    ) {
      return res.status(403).json({
        error: "Forbidden: faculty accounts can only view their own metrics.",
      });
    }
    const detailData = await detail(req.params.id);
    if (!detailData) {
      return res.status(404).json({ error: "Faculty not found." });
    }
    res.json(detailData);
  } catch (err) {
    next(err);
  }
});

async function detail(id) {
  let doc;
  try {
    doc = await Faculty.findById(id).lean();
  } catch {
    return null;
  }
  if (!doc) return null;

  const fid = doc._id.toString();
  const [sess, dut, dl, risk, sug] = await Promise.all([
    ClassSession.find({ faculty_id: fid }).sort({ day: 1, start_time: 1 }).lean(),
    Duty.find({ faculty_id: fid }).lean(),
    Deadline.find({ faculty_id: fid }).lean(),
    RiskScore.findOne({ faculty_id: fid }).lean(),
    Suggestion.find({ faculty_id: fid }).sort({ impact_points: -1 }).lean(),
  ]);

  return {
    id: fid,
    name: doc.name,
    email: doc.email,
    department: doc.department,
    designation: doc.designation,
    university: doc.university || null,
    campus: doc.campus || null,
    contract_hours: doc.contract_hours ?? 40,
    fte: doc.fte ?? 1.0,
    schedule: sess.map(docToApi),
    duties: dut.map(docToApi),
    deadlines: dl.map((d) => ({
      ...docToApi(d),
      due_date: new Date(d.due_date).toISOString(),
    })),
    risk: risk
      ? {
          faculty_id: risk.faculty_id,
          score: risk.score,
          level: risk.level,
          factors: risk.factors,
          computed_at: new Date(risk.computed_at).toISOString(),
        }
      : null,
    suggestions: sug.map(docToApi),
  };
}

export default router;