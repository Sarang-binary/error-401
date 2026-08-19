import { Router } from "express";
import { authenticate, requireRole } from "../authMiddleware.js";
import { ClassSession, Deadline, Duty, Faculty, RiskScore } from "../models/data.js";
import { analyzeSchedule } from "../services/risk.js";

const router = Router();

router.use(authenticate, requireRole("hod", "admin", "guest"));

const ADMIN_DUTY_CATEGORIES = ["Administrative", "Exam", "Committee"];
const DAY_MS = 24 * 60 * 60 * 1000;

router.get("/", async (req, res, next) => {
  try {
    const [faculties, risks, classes, duties, deadlines] = await Promise.all([
      Faculty.find({}).sort({ department: 1, name: 1 }).lean(),
      RiskScore.find({}).lean(),
      ClassSession.find({}).lean(),
      Duty.find({}).lean(),
      Deadline.find({}).lean(),
    ]);

    const riskByFid = new Map(risks.map((r) => [r.faculty_id, r]));
    const classesByFid = new Map();
    for (const c of classes) {
      if (!classesByFid.has(c.faculty_id)) classesByFid.set(c.faculty_id, []);
      classesByFid.get(c.faculty_id).push(c);
    }
    const dutiesByFid = new Map();
    for (const d of duties) {
      if (!dutiesByFid.has(d.faculty_id)) dutiesByFid.set(d.faculty_id, []);
      dutiesByFid.get(d.faculty_id).push(d);
    }

    const counts = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
    let totalScore = 0;
    let n = 0;
    const deptScores = new Map();
    const deptSummary = new Map();
    const workload = [];
    const consecutiveClasses = [];
    const pendingTasks = [];

    for (const f of faculties) {
      const fid = f._id.toString();
      const risk = riskByFid.get(fid);
      const sess = classesByFid.get(fid) || [];
      const dut = dutiesByFid.get(fid) || [];
      const sch = analyzeSchedule(sess);
      const dept = f.department;

      if (risk) {
        counts[risk.level] = (counts[risk.level] || 0) + 1;
        totalScore += risk.score;
        n += 1;
        if (!deptScores.has(dept)) deptScores.set(dept, []);
        deptScores.get(dept).push(risk.score);
      }

      if (!deptSummary.has(dept)) {
        deptSummary.set(dept, { department: dept, faculty_count: 0, teaching_hours: 0 });
      }
      const s = deptSummary.get(dept);
      s.faculty_count += 1;
      s.teaching_hours += sch.total_hours;

      workload.push({
        id: fid,
        name: f.name,
        department: dept,
        risk_score: risk?.score ?? null,
        teaching_hours: sch.total_hours,
      });

      const byDay = new Map();
      for (const c of sess) {
        if (!byDay.has(c.day)) byDay.set(c.day, []);
        byDay.get(c.day).push(c);
      }
      for (const daySessions of byDay.values()) {
        daySessions.sort((a, b) => a.start_time.localeCompare(b.start_time));
        for (let i = 1; i < daySessions.length; i++) {
          const prev = daySessions[i - 1];
          const cur = daySessions[i];
          const gap = minutesBetween(prev.end_time, cur.start_time);
          if (gap > 0 && gap <= 30) {
            consecutiveClasses.push({
              id: `${fid}-${cur._id.toString()}`,
              faculty_id: fid,
              faculty_name: f.name,
              department: dept,
              day: cur.day,
              course_code: cur.course_code,
              course_name: cur.course_name,
              start_time: cur.start_time,
              end_time: cur.end_time,
              gap_minutes: gap,
            });
          }
        }
      }

      for (const d of dut) {
        if (ADMIN_DUTY_CATEGORIES.includes(d.category)) {
          pendingTasks.push({
            id: d._id.toString(),
            faculty_id: fid,
            faculty_name: f.name,
            title: d.title,
            category: d.category,
            hours_per_week: d.hours_per_week,
          });
        }
      }
    }

    const atRisk = workload
      .filter((w) => riskByFid.get(w.id) && ["High", "Critical"].includes(riskByFid.get(w.id).level))
      .map((w) => ({
        id: w.id,
        name: w.name,
        department: w.department,
        risk_score: w.risk_score,
        risk_level: riskByFid.get(w.id).level,
      }))
      .sort((a, b) => b.risk_score - a.risk_score);

    const summary = [...deptSummary.values()]
      .map((s) => ({
        ...s,
        teaching_hours: Math.round(s.teaching_hours * 10) / 10,
        avg_hours: s.faculty_count ? Math.round((s.teaching_hours / s.faculty_count) * 10) / 10 : 0,
      }))
      .sort((a, b) => a.department.localeCompare(b.department));

    res.json({
      risk_distribution: counts,
      average_score: n ? Math.round((totalScore / n) * 10) / 10 : 0,
      faculty_count: n,
      at_risk: atRisk,
      departments: [...deptScores.entries()]
        .map(([department, scores]) => ({
          department,
          avg_score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
          faculty: scores.length,
        }))
        .sort((a, b) => a.department.localeCompare(b.department)),
      summary,
      workload,
      consecutive_classes: consecutiveClasses.sort((a, b) => a.day.localeCompare(b.day) || a.gap_minutes - b.gap_minutes),
      deadline_density: buildDeadlineDensity(deadlines),
      pending_tasks: pendingTasks.sort((a, b) => b.hours_per_week - a.hours_per_week),
      computed_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

function minutesBetween(endTime, startTime) {
  const [eh, em] = endTime.split(":").map(Number);
  const [sh, sm] = startTime.split(":").map(Number);
  return (sh * 60 + sm) - (eh * 60 + em);
}

function buildDeadlineDensity(deadlines) {
  const now = new Date();
  const days = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(now.getTime() + i * DAY_MS);
    date.setHours(0, 0, 0, 0);
    days.push({
      date: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      count: 0,
      effort_hours: 0,
    });
  }
  for (const d of deadlines) {
    const due = new Date(d.due_date);
    due.setHours(0, 0, 0, 0);
    const dueKey = due.toISOString().slice(0, 10);
    const slot = days.find((x) => x.date === dueKey);
    if (slot) {
      slot.count += 1;
      slot.effort_hours += Number(d.effort_hours) || 0;
    }
  }
  return days.map((d) => ({ ...d, effort_hours: Math.round(d.effort_hours * 10) / 10 }));
}

export default router;