import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useUi, scoreStatus } from "../components/ui";
import Navbar from "../components/Navbar";

export default function FacultyDetail({ id: propId }) {
  const params = useParams();
  const { user } = useAuth();
  const { cls, isW3c } = useUi();
  const id = propId || params.id;
  const isSelf = user.role === "faculty" && user.facultyId === id;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getFaculty(id)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className={cls.bg}>
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className={`${cls.card} max-w-lg`} role="alert">
            <h2 className={`text-lg font-bold ${cls.text}`}>Error</h2>
            <p className={`mt-2 text-sm ${cls.muted}`}>{error}</p>
            {user.role !== "faculty" && (
              <Link to="/" className={`mt-4 inline-block ${cls.btn}`}>
                Back to dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cls.bg}>
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className={cls.muted} role="status">
            Loading faculty…
          </p>
        </div>
      </div>
    );
  }

  const risk = data.risk?.factors;
  const score = data.risk?.score;
  const status = scoreStatus(score);

  return (
    <div className={cls.bg}>
      <Navbar />
      <div className={`mx-auto max-w-6xl px-4 py-8 ${cls.body}`}>
        {user.role !== "faculty" && (
          <Link to="/" className={`mb-4 inline-block text-sm ${cls.muted} hover:underline`}>
            ← Back to dashboard
          </Link>
        )}

        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-extrabold ${cls.text}`}>{data.name}</h1>
            <p className={`mt-1 text-sm ${cls.muted}`}>
              {data.designation} · {data.department} · {data.contract_hours * data.fte}h contract
              {isSelf && " · This is you"}
            </p>
          </div>
          {score != null && (
            <div
              className={`flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 ${cls.text}`}
              style={{ borderColor: status.solid }}
              aria-label={`Risk score ${score}`}
            >
              <span className="text-2xl font-extrabold">{score}</span>
              <span className={`text-[10px] uppercase tracking-wide ${cls.muted}`}>risk score</span>
            </div>
          )}
        </header>

        {data.risk && (
          <section className={`mt-6 ${cls.card}`} aria-label="Risk breakdown">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.chip}`}>
                {data.risk.level}
              </span>
              <span className={`text-xs ${cls.muted}`}>
                computed {new Date(data.risk.computed_at).toLocaleString()}
              </span>
            </div>

            <div
              role="progressbar"
              aria-valuenow={Math.round(score)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Risk score"
              className={`mt-4 h-3 w-full overflow-hidden rounded-full ${isW3c ? "bg-neutral-300" : "bg-white/15"}`}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(score, 100)}%`, background: status.solid }}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [`${risk.total_hours}h`, "total weekly load"],
                [`${risk.load_ratio}x`, "load vs contract"],
                [`${risk.consecutive_blocks}`, "tight back-to-backs"],
                [`${risk.max_consecutive_hours}h`, "longest block"],
                [`${risk.min_break_minutes}m`, "shortest break"],
                [`${risk.duties_hours}h`, `duties (${risk.duties_count})`],
                [`${risk.deadlines_days}`, "deadlines ≤14d"],
                [`${risk.deadline_pressure}`, "deadline pressure"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className={`rounded-xl p-3 text-center ${
                    isW3c ? "border-2 border-black" : "border border-white/15 bg-white/5"
                  }`}
                >
                  <p className={`text-lg font-extrabold ${cls.text}`}>{value}</p>
                  <p className={`mt-0.5 text-xs ${cls.muted}`}>{label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section className={cls.card} aria-label="Weekly schedule">
            <h2 className={`text-sm font-semibold uppercase tracking-wide ${cls.muted}`}>
              Weekly schedule
            </h2>
            <ul className={`mt-3 divide-y ${isW3c ? "divide-black" : "divide-white/10"}`}>
              {data.schedule.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className={`text-sm font-semibold ${cls.text}`}>
                      {c.course_code} · {c.course_name}
                    </p>
                    <p className={`text-xs ${cls.muted}`}>
                      {c.day} {c.start_time}–{c.end_time} · {c.credits} credits
                    </p>
                  </div>
                </li>
              ))}
              {data.schedule.length === 0 && (
                <li className={`py-2.5 text-sm ${cls.muted}`}>No classes</li>
              )}
            </ul>

            <h2 className={`mt-6 text-sm font-semibold uppercase tracking-wide ${cls.muted}`}>
              Duties
            </h2>
            <ul className={`mt-2 space-y-1.5 text-sm ${cls.muted}`}>
              {data.duties.map((d) => (
                <li key={d.id} className="flex justify-between gap-2">
                  <span>
                    {d.title} ({d.category})
                  </span>
                  <span className={`font-semibold ${cls.text}`}>{d.hours_per_week}h/wk</span>
                </li>
              ))}
              {data.duties.length === 0 && <li>No administrative duties</li>}
            </ul>

            <h2 className={`mt-6 text-sm font-semibold uppercase tracking-wide ${cls.muted}`}>
              Deadlines
            </h2>
            <ul className={`mt-2 space-y-1.5 text-sm ${cls.muted}`}>
              {data.deadlines.map((d) => (
                <li key={d.id} className="flex justify-between gap-2">
                  <span>{d.title}</span>
                  <span className={`font-semibold ${cls.text}`}>
                    {new Date(d.due_date).toLocaleDateString()} · {d.effort_hours}h
                  </span>
                </li>
              ))}
              {data.deadlines.length === 0 && <li>No deadlines</li>}
            </ul>
          </section>

          <section className={cls.card} aria-label="Workload adjustment suggestions">
            <h2 className={`text-sm font-semibold uppercase tracking-wide ${cls.muted}`}>
              Workload adjustment suggestions
            </h2>
            {data.suggestions.length === 0 ? (
              <p className={`mt-4 text-sm ${cls.muted}`}>No suggestions — workload is balanced.</p>
            ) : (
              <ul className={`mt-3 divide-y ${isW3c ? "divide-black" : "divide-white/10"}`}>
                {data.suggestions.map((s) => (
                  <li key={s.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className={`text-sm font-bold ${cls.text}`}>{s.title}</p>
                      {s.impact_points > 0 && (
                        <span className={`shrink-0 text-sm font-bold ${isW3c ? "text-black" : "text-emerald-300"}`}>
                          −{s.impact_points.toFixed(1)} pts
                        </span>
                      )}
                    </div>
                    <p className={`mt-1 text-xs leading-relaxed ${cls.muted}`}>{s.detail}</p>
                    <span
                      className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        isW3c ? "border-2 border-black text-black" : "bg-white/10 text-white/70"
                      }`}
                    >
                      {s.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}