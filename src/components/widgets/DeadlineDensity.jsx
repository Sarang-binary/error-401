import { useUi } from "../ui";

const MAX_EFFORT = 20;

export default function DeadlineDensity({ data }) {
  const { cls, isW3c } = useUi();
  const days = data.deadline_density ?? [];
  const total = days.reduce((a, d) => a + d.count, 0);
  const peak = Math.max(1, ...days.map((d) => d.effort_hours));

  return (
    <section className={cls.card} aria-label="Deadline density tracker">
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-semibold uppercase tracking-wide ${cls.muted}`}>
          Deadline Density · next 14 days
        </h2>
        <span className={`text-xs font-bold ${cls.muted}`}>{total} upcoming</span>
      </div>

      {total === 0 ? (
        <p className={`mt-4 text-sm ${cls.muted}`}>No deadlines in the next two weeks.</p>
      ) : (
        <div className="mt-4">
          <div className="flex h-24 items-end gap-1.5" role="img" aria-label="Deadline density bar chart">
            {days.map((d) => {
              const h = d.count ? Math.round((d.effort_hours / Math.max(peak, MAX_EFFORT)) * 100) : 0;
              return (
                <div
                  key={d.date}
                  className="group relative flex-1"
                  title={`${d.label}: ${d.count} deadline(s), ${d.effort_hours}h effort`}
                >
                  <div
                    role="img"
                    aria-label={`${d.label}: ${d.count} deadline(s)`}
                    className={`w-full rounded-t transition-all duration-300 ${
                      d.count > 0
                        ? isW3c
                          ? "bg-black"
                          : d.effort_hours >= 15
                            ? "bg-red-500"
                            : d.effort_hours >= 8
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                        : isW3c
                          ? "bg-neutral-300"
                          : "bg-white/10"
                    }`}
                    style={{ height: `${Math.max(d.count ? 8 : 2, h)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className={`mt-2 flex justify-between text-[10px] ${cls.muted}`}>
            <span>{days[0]?.label}</span>
            <span>{days[days.length - 1]?.label}</span>
          </div>
        </div>
      )}

      <ul className={`mt-4 space-y-1.5 text-sm ${cls.muted}`}>
        {days
          .filter((d) => d.count > 0)
          .slice(0, 3)
          .map((d) => (
            <li key={d.date} className="flex items-center justify-between gap-2">
              <span>{d.label}</span>
              <span className={`font-semibold ${cls.text}`}>
                {d.count} × {d.effort_hours}h
              </span>
            </li>
          ))}
      </ul>
    </section>
  );
}