import { useUi } from "../ui";

export default function SummaryGrid({ data }) {
  const { cls, isW3c } = useUi();
  const summary = data.summary ?? [];
  const totalHours = summary.reduce((a, s) => a + s.teaching_hours, 0);

  return (
    <section className={cls.card} aria-label="Teaching hours summary">
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-semibold uppercase tracking-wide ${cls.muted}`}>
          Teaching Hours by Department
        </h2>
        <span className={`text-xs font-bold ${cls.muted}`}>
          {Math.round(totalHours * 10) / 10}h total
        </span>
      </div>

      {summary.length === 0 && <p className={`mt-4 text-sm ${cls.muted}`}>No department data.</p>}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {summary.map((s) => {
          const pct = totalHours ? Math.round((s.teaching_hours / totalHours) * 100) : 0;
          return (
            <div
              key={s.department}
              className={`rounded-xl p-4 ${isW3c ? "border-2 border-black bg-white" : "border border-white/15 bg-white/5"}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className={`text-sm font-bold ${cls.text}`}>{s.department}</h3>
                <span className={`text-xs ${cls.muted}`}>
                  {s.faculty_count} faculty · avg {s.avg_hours}h
                </span>
              </div>
              <p className={`mt-1 text-2xl font-extrabold ${cls.text}`}>
                {s.teaching_hours}
                <span className={`ml-1 text-sm font-medium ${cls.muted}`}>hrs / week</span>
              </p>
              <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${s.department} share of teaching hours`}
                className={`mt-2 h-2 w-full overflow-hidden rounded-full ${isW3c ? "bg-neutral-300" : "bg-white/15"}`}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: isW3c ? "#000" : "#818cf8",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className={`mt-4 border-t pt-3 ${isW3c ? "border-black" : "border-white/10"}`}>
        <h3 className={`text-sm font-bold ${cls.text}`}>Per-faculty load</h3>
        <ul className={`mt-2 space-y-1.5 text-sm ${cls.muted}`}>
          {(data.workload ?? [])
            .slice()
            .sort((a, b) => b.teaching_hours - a.teaching_hours)
            .slice(0, 5)
            .map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{w.name}</span>
                <span className="font-semibold text-white/90">{w.teaching_hours}h</span>
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}