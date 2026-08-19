import { LEVEL_COLORS } from "./colors";

export function RiskBadge({ level }) {
  const color = LEVEL_COLORS[level] || "#64748b";
  return (
    <span
      className="badge"
      style={{ backgroundColor: `${color}1a`, color, border: `1px solid ${color}44` }}
    >
      {level}
    </span>
  );
}