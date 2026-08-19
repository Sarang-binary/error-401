import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../components/ui";
import Navbar from "../components/Navbar";
import RiskAlert from "../components/widgets/RiskAlert";
import SummaryGrid from "../components/widgets/SummaryGrid";
import ConsecutiveClasses from "../components/widgets/ConsecutiveClasses";
import DeadlineDensity from "../components/widgets/DeadlineDensity";
import AdminTasks from "../components/widgets/AdminTasks";
const WorkloadDensity = lazy(() => import("../components/three/WorkloadDensity"));
import FacultyDetail from "./FacultyDetail";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cls, isW3c } = useUi();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api.getDashboard());
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .getDashboard()
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onRecompute() {
    setBusy(true);
    try {
      await api.recompute();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (user.role === "faculty") {
    return <FacultyDetail id={user.facultyId} />;
  }

  if (error) {
    return (
      <div className={cls.bg}>
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className={`${cls.card} max-w-lg`} role="alert">
            <h2 className={`text-lg font-bold ${cls.text}`}>Cannot reach backend</h2>
            <p className={`mt-2 text-sm ${cls.muted}`}>{error}</p>
            <button type="button" onClick={load} className={`mt-4 ${cls.btn}`}>
              Retry
            </button>
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
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cls.bg}>
      <Navbar />
      <div className={`mx-auto max-w-6xl px-4 py-8 ${cls.body}`}>
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-extrabold ${cls.text}`}>
              HOD Dashboard
            </h1>
            <p className={`mt-1 text-sm ${cls.muted}`}>
              {data.faculty_count} faculty · last computed{" "}
              {new Date(data.computed_at).toLocaleString()}
            </p>
          </div>
          {user.role !== "guest" && (
            <button type="button" onClick={onRecompute} disabled={busy} className={cls.btn}>
              {busy ? "Computing…" : "Recompute risk scores"}
            </button>
          )}
        </header>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <RiskAlert data={data} />
          </div>
          <div className="lg:col-span-2">
            <SummaryGrid data={data} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <DeadlineDensity data={data} />
          <ConsecutiveClasses data={data} />
        </div>

        <div className="mt-5">
          <AdminTasks data={data} />
        </div>

        <div className="mt-5">
          <Suspense fallback={<p className={`${cls.card} ${cls.muted}`}>Loading 3D visualizer…</p>}>
            <WorkloadDensity data={data} />
          </Suspense>
        </div>

        <section className={`mt-5 ${cls.card}`} aria-label="At-risk faculty">
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-semibold uppercase tracking-wide ${cls.muted}`}>
              At-risk faculty (High / Critical)
            </h2>
            <span className={`text-xs font-bold ${cls.muted}`}>{data.at_risk.length} flagged</span>
          </div>

          {data.at_risk.length === 0 ? (
            <p className={`mt-4 text-sm ${cls.muted}`}>
              No faculty at risk — workload looks balanced.
            </p>
          ) : (
            <ul className={`mt-3 divide-y ${isW3c ? "divide-black" : "divide-white/10"}`}>
              {data.at_risk.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/faculty/${f.id}`)}
                    className={`flex w-full items-center justify-between gap-3 py-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      isW3c ? "hover:bg-neutral-200" : "hover:bg-white/5"
                    }`}
                    aria-label={`View ${f.name}'s detail page`}
                  >
                    <div>
                      <p className={`text-sm font-semibold ${cls.text}`}>{f.name}</p>
                      <p className={`text-xs ${cls.muted}`}>{f.department}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          f.risk_level === "Critical"
                            ? isW3c
                              ? "bg-black text-white"
                              : "bg-red-600/25 text-red-300"
                            : isW3c
                              ? "border-2 border-black text-black"
                              : "bg-orange-500/20 text-orange-300"
                        }`}
                      >
                        {f.risk_level}
                      </span>
                      <span className={`text-sm font-extrabold ${cls.text}`}>{f.risk_score}</span>
                      <span aria-hidden="true" className={cls.muted}>
                        →
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}