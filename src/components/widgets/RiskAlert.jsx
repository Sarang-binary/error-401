import { useUi, scoreStatus } from "../ui";

export default function RiskAlert({ data }) {
  const { cls, isW3c } = useUi();
  const status = scoreStatus(data.average_score);
  const atRiskCount = data.at_risk?.length ?? 0;

  const statusText =
    data.average_score == null
      ? "Unknown"
      : data.average_score >= 50
        ? "High risk"
        : data.average_score >= 30
          ? "Moderate risk"
          : "Low risk";

  const dot = isW3c ? "#000" : status.solid;

  return (
    <section className={cls.card} aria-label="Department burnout risk alert">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={`text-sm font-semibold uppercase tracking-wide ${cls.muted}`}>
            Department Burnout Risk
          </h2>
          <p className={`mt-2 text-3xl font-extrabold ${cls.text}`}>
            {data.average_score ?? "—"}
            <span className={`ml-2 text-base font-semibold ${cls.muted}`}>avg risk score</span>
          </p>
          <p className={`mt-1 text-sm ${cls.muted}`}>
            {atRiskCount} faculty at high or critical risk
          </p>
        </div>
        <div
          role="status"
          aria-label={`Risk status: ${statusText}`}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${status.chip}`}
        >
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} />
          {statusText}
        </div>
      </div>

      <div
        role="progressbar"
        aria-valuenow={Math.round(data.average_score || 0)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Average risk score"
        className={`mt-4 h-3 w-full overflow-hidden rounded-full ${isW3c ? "bg-neutral-300" : "bg-white/15"}`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(data.average_score ?? 0, 100)}%`,
            background: status.solid,
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Risk level distribution">
        {Object.entries(data.risk_distribution ?? {}).map(([level, count]) => (
          <span
            key={level}
            className={`rounded-full px-3 py-1 text-xs font-bold ${scoreStatusByLevel(level)}`}
          >
            {level}: {count}
          </span>
        ))}
      </div>
    </section>
  );
}

function scoreStatusByLevel(level) {
  const map = {
    Low: "bg-emerald-500/20 text-emerald-300",
    Moderate: "bg-amber-500/20 text-amber-300",
    High: "bg-orange-500/20 text-orange-300",
    Critical: "bg-red-600/20 text-red-300",
  };
  return map[level] || "bg-neutral-500/20 text-neutral-300";
}