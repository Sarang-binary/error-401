import { analyzeSchedule, parseTm } from "./risk.js";

const BREAK_THRESHOLD = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function generateSuggestions(facultyId, sessions, duties, deadlines, score) {
  const suggestions = [];
  const sch = analyzeSchedule(sessions);

  const byDay = new Map();
  for (const s of sessions) {
    if (!byDay.has(s.day)) byDay.set(s.day, []);
    byDay.get(s.day).push(s);
  }

  for (const [day, daySessions] of byDay) {
    daySessions.sort((a, b) => parseTm(a.start_time) - parseTm(b.start_time));
    for (let i = 1; i < daySessions.length; i++) {
      const prev = daySessions[i - 1];
      const cur = daySessions[i];
      const gap = (parseTm(cur.start_time) - parseTm(prev.end_time)) / 60;
      if (gap > 0 && gap <= BREAK_THRESHOLD) {
        suggestions.push({
          faculty_id: facultyId,
          type: "swap_class",
          title: `Tight back-to-back classes on ${day}`,
          detail: `'${prev.course_code}' ends at ${prev.end_time} and '${cur.course_code}' starts at ${cur.start_time} (${Math.round(gap)} min gap). Consider swapping the later class to another day or slot.`,
          impact_points: Math.min(15.0, (BREAK_THRESHOLD - gap) * 0.6),
        });
      }
    }
  }

  if (sch.max_consecutive_hours > 4) {
    suggestions.push({
      faculty_id: facultyId,
      type: "add_break",
      title: "Long consecutive teaching block",
      detail: `Maximum consecutive teaching is ${sch.max_consecutive_hours}h. Insert a 30+ minute recovery break by shifting one class.`,
      impact_points: 10.0,
    });
  }

  if (duties.length > 0) {
    const heavy = duties.reduce((max, d) => (Number(d.hours_per_week) > Number(max.hours_per_week) ? d : max), duties[0]);
    if (Number(heavy.hours_per_week) >= 6) {
      suggestions.push({
        faculty_id: facultyId,
        type: "rebalance_duty",
        title: `Reassign '${heavy.title}' duty`,
        detail: `This duty consumes ${heavy.hours_per_week}h/week (${heavy.category}). Move it to a colleague with a lighter load.`,
        impact_points: Number(heavy.hours_per_week) * 3,
      });
    }
  }

  if (deadlines.length > 0) {
    const soon = deadlines.reduce((min, d) => (new Date(d.due_date) < new Date(min.due_date) ? d : min), deadlines[0]);
    const days = Math.max(0, Math.floor((new Date(soon.due_date) - Date.now()) / DAY_MS));
    if (days <= 7) {
      suggestions.push({
        faculty_id: facultyId,
        type: "shift_deadline",
        title: `Deadline pressure: '${soon.title}'`,
        detail: `Due in ${days} days (${soon.effort_hours}h effort). Extend or redistribute part of the work.`,
        impact_points: 5.0,
      });
    }
  }

  if (suggestions.length === 0 && score < 30) {
    suggestions.push({
      faculty_id: facultyId,
      type: "add_break",
      title: "Workload is balanced",
      detail: "No adjustment needed right now. Continue monitoring monthly.",
      impact_points: 0.0,
    });
  }

  return suggestions;
}