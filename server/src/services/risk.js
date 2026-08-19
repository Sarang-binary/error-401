const MINUTES_PER_HOUR = 60;
const DAY_MS = 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * DAY_MS;

export function parseTm(value) {
  const [h, m] = String(value).split(":").map(Number);
  return h * 60 + m;
}

export function analyzeSchedule(sessions) {
  const byDay = new Map();
  for (const s of sessions) {
    if (!byDay.has(s.day)) byDay.set(s.day, []);
    byDay.get(s.day).push(s);
  }

  let totalHours = 0;
  let consecutiveBlocks = 0;
  let maxConsecutiveHours = 0;
  let minBreak = Infinity;
  const breaks = [];

  for (const daySessions of byDay.values()) {
    daySessions.sort((a, b) => parseTm(a.start_time) - parseTm(b.start_time));
    let runHours = 0;
    let prevEnd = null;
    for (const s of daySessions) {
      const start = parseTm(s.start_time);
      const end = parseTm(s.end_time);
      const hours = (end - start) / MINUTES_PER_HOUR;
      totalHours += hours;
      if (prevEnd !== null) {
        const gap = (start - prevEnd) / MINUTES_PER_HOUR;
        breaks.push(gap);
        if (gap <= 30) {
          consecutiveBlocks += 1;
          runHours += hours;
        } else {
          maxConsecutiveHours = Math.max(maxConsecutiveHours, runHours);
          runHours = hours;
        }
        minBreak = Math.min(minBreak, gap);
      } else {
        runHours += hours;
      }
      prevEnd = end;
    }
    maxConsecutiveHours = Math.max(maxConsecutiveHours, runHours);
  }

  if (breaks.length === 0) minBreak = 0;
  const avgBreak = breaks.length ? breaks.reduce((a, b) => a + b, 0) / breaks.length : 0;

  return {
    total_hours: round1(totalHours),
    consecutive_blocks: consecutiveBlocks,
    max_consecutive_hours: round1(maxConsecutiveHours),
    avg_break_minutes: round1(avgBreak),
    min_break_minutes: round1(minBreak),
  };
}

function round1(v) {
  return Math.round(v * 10) / 10;
}

function clamp(v) {
  return Math.max(0, Math.min(100, v));
}

export function levelFor(score) {
  if (score >= 70) return "Critical";
  if (score >= 50) return "High";
  if (score >= 30) return "Moderate";
  return "Low";
}

export function computeRisk(faculty, sessions, duties, deadlines) {
  const sch = analyzeSchedule(sessions);
  const dutiesHours = round1(duties.reduce((sum, d) => sum + (Number(d.hours_per_week) || 0), 0));

  const now = Date.now();
  const upcoming = deadlines.filter((d) => {
    const due = new Date(d.due_date).getTime();
    return now <= due && due <= now + FOURTEEN_DAYS_MS;
  });
  const deadlinePressure = round2(
    upcoming.reduce((sum, d) => {
      const days = Math.max(1, Math.floor((new Date(d.due_date).getTime() - now) / DAY_MS));
      return sum + (Number(d.effort_hours) || 0) / days;
    }, 0)
  );

  const totalHours = round1(sch.total_hours + dutiesHours);
  const contract = Number(faculty.contract_hours || 0) * Number(faculty.fte || 0);
  const loadRatio = contract ? round2(totalHours / contract) : 1.0;

  const loadScore = clamp((loadRatio - 1.0) * 150);
  const scheduleScore = clamp(
    sch.consecutive_blocks * 15 +
      Math.max(0, sch.max_consecutive_hours - 3.0) * 12 +
      Math.max(0, 30.0 - sch.min_break_minutes) * 1.5
  );
  const dutyScore = clamp(dutiesHours * 6 + duties.length * 4);
  const deadlineScore = clamp(deadlinePressure * 30);

  const score = clamp(
    loadScore * 0.3 + scheduleScore * 0.25 + dutyScore * 0.2 + deadlineScore * 0.15 + loadScore * 0.1
  );

  const factors = {
    total_hours: totalHours,
    contract_hours: round1(contract),
    load_ratio: loadRatio,
    consecutive_blocks: sch.consecutive_blocks,
    max_consecutive_hours: sch.max_consecutive_hours,
    avg_break_minutes: sch.avg_break_minutes,
    min_break_minutes: sch.min_break_minutes,
    duties_hours: dutiesHours,
    duties_count: duties.length,
    deadlines_days: upcoming.length,
    deadline_pressure: deadlinePressure,
  };

  return { score: round1(score), level: levelFor(score), factors };
}

function round2(v) {
  return Math.round(v * 100) / 100;
}