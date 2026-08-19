import { Router } from "express";
import { authenticate, requireRole } from "../authMiddleware.js";
import { ClassSession, Deadline, Duty, Faculty, RiskScore, Suggestion } from "../models/data.js";
import { computeRisk } from "../services/risk.js";
import { generateSuggestions } from "../services/suggest.js";

const router = Router();

router.use(authenticate, requireRole("hod", "admin"));

router.post("/", async (req, res, next) => {
  try {
    const now = new Date();
    let processed = 0;

    const faculties = await Faculty.find({}).lean();
    for (const doc of faculties) {
      const fid = doc._id.toString();
      const [sess, dut, dl] = await Promise.all([
        ClassSession.find({ faculty_id: fid }).lean(),
        Duty.find({ faculty_id: fid }).lean(),
        Deadline.find({ faculty_id: fid }).lean(),
      ]);

      const { score, level, factors } = computeRisk(doc, sess, dut, dl);

      await RiskScore.findOneAndUpdate(
        { faculty_id: fid },
        { faculty_id: fid, score, level, factors, computed_at: now },
        { upsert: true, setDefaultsOnInsert: true }
      );

      const suggestions = generateSuggestions(fid, sess, dut, dl, score).map((s) => ({
        ...s,
        created_at: now,
      }));
      await Suggestion.deleteMany({ faculty_id: fid });
      if (suggestions.length > 0) {
        await Suggestion.insertMany(suggestions);
      }
      processed += 1;
    }

    res.json({ status: "ok", faculties_processed: processed });
  } catch (err) {
    next(err);
  }
});

export default router;