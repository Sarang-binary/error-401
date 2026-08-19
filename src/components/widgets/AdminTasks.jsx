import { useState } from "react";
import { useUi } from "../ui";

export default function AdminTasks({ data }) {
  const { cls, isW3c } = useUi();
  const tasks = data.pending_tasks ?? [];
  const [done, setDone] = useState(() => new Set());

  function toggle(id) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totalHours = tasks.reduce((a, t) => a + t.hours_per_week, 0);

  return (
    <section className={cls.card} aria-label="Pending administrative tasks">
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-semibold uppercase tracking-wide ${cls.muted}`}>
          Pending Admin Tasks
        </h2>
        <span className={`text-xs font-bold ${cls.muted}`}>
          {tasks.length} open · {Math.round(totalHours * 10) / 10}h/wk
        </span>
      </div>

      {tasks.length === 0 ? (
        <p className={`mt-4 text-sm ${cls.muted}`}>No pending administrative duties.</p>
      ) : (
        <ul className={`mt-3 divide-y ${isW3c ? "divide-black" : "divide-white/10"}`}>
          {tasks.map((t) => {
            const isDone = done.has(t.id);
            return (
              <li key={t.id} className="flex items-start gap-3 py-2.5">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggle(t.id)}
                  aria-label={`Mark task complete: ${t.title}`}
                  className={`mt-1 h-4 w-4 shrink-0 accent-black ${isW3c ? "border-2 border-black" : ""}`}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      isDone ? (isW3c ? "line-through text-neutral-500" : "line-through text-white/40") : cls.text
                    }`}
                  >
                    {t.title}
                  </p>
                  <p className={`text-xs ${cls.muted}`}>
                    {t.faculty_name} · {t.category}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                    isW3c ? "border-2 border-black text-black" : "bg-white/10 text-white/80"
                  }`}
                >
                  {t.hours_per_week}h/wk
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}