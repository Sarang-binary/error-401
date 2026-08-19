export const LEVEL_COLORS = {
  Low: "#16a34a",
  Moderate: "#f59e0b",
  High: "#f97316",
  Critical: "#dc2626",
};

export function scoreColor(score) {
  if (score == null) return "#64748b";
  if (score >= 70) return LEVEL_COLORS.Critical;
  if (score >= 50) return LEVEL_COLORS.High;
  if (score >= 30) return LEVEL_COLORS.Moderate;
  return LEVEL_COLORS.Low;
}