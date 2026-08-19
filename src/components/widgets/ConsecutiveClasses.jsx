import { useUi } from "../ui";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function ConsecutiveClasses({ data }) {
  const { cls, isW3c } = useUi();
  const list = data.consecutive_classes ?? [];

  const sorted = list
    .slice()
    .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.gap_minutes - b.gap_minutes);

  return (
    <section className={cls.card} aria-label="Consecutive classes">
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-semibold uppercase tracking-wide ${cls.muted}`}>
          Consecutive Classes
        </h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            list.length > 0
              ? isW3c
                ? "bg-black text-white"
                : "bg-amber-500/20 text-amber-300"
              : isW3c
                ? "border-2 border-black text-black"
                : "bg-emerald-500/20 text-emerald-300"
          }`}
        >
          {list.length} flagged
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className={`mt-4 text-sm ${cls.muted}`}>
          No back-to-back sessions with a break under 30 minutes. Schedule looks healthy.
        </p>
      ) : (
        <ul className={`mt-3 divide-y ${isW3c ? "divide-black" : "divide-white/10"}`}>
          {sorted.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className={`truncate text-sm font-semibold ${cls.text}`}>
                  {c.course_code} · {c.course_name}
                </p>
                <p className={`truncate text-xs ${cls.muted}`}>
                  {c.day} {c.start_time}–{c.end_time} · {c.faculty_name} · {c.department}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                  c.gap_minutes <= 10
                    ? isW3c
                      ? "bg-black text-white"
                      : "bg-red-500/25 text-red-300"
                    : isW3c
                      ? "border-2 border-black text-black"
                      : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {c.gap_minutes}m gap
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}