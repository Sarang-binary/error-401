import { useEffect, useReducer } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import LoginStep from "../components/onboarding/LoginStep";
import RegisterStep from "../components/onboarding/RegisterStep";

const initialState = {
  universities: [],
  selectedUniversity: "",
  selectedCampus: "",
  mode: null,
  loading: false,
  error: null,
  busy: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "LOADING":
      return { ...state, loading: true, error: null };
    case "LOADED":
      return { ...state, loading: false, universities: action.universities };
    case "LOAD_FAILED":
      return { ...state, loading: false, error: action.error };
    case "SELECT_UNIVERSITY":
      return {
        ...state,
        selectedUniversity: action.university,
        selectedCampus: "",
        mode: null,
        error: null,
      };
    case "SELECT_CAMPUS":
      return { ...state, selectedCampus: action.campus, error: null };
    case "MODE_SIGNIN":
      return { ...state, mode: "signin", error: null };
    case "MODE_REGISTER":
      return { ...state, mode: "register", error: null };
    case "BACK":
      return { ...state, mode: null, error: null };
    case "FORM_ERROR":
      return { ...state, error: action.error, busy: false };
    case "FORM_BUSY":
      return { ...state, busy: true, error: null };
    default:
      return state;
  }
}

export default function Onboarding() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { login, register } = useAuth();

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "LOADING" });
    api
      .meta()
      .then((data) => {
        if (!cancelled) dispatch({ type: "LOADED", universities: data.universities });
      })
      .catch((err) => {
        if (!cancelled) dispatch({ type: "LOAD_FAILED", error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleUniversityChange(e) {
    dispatch({ type: "SELECT_UNIVERSITY", university: e.target.value });
  }

  function handleCampusChange(e) {
    dispatch({ type: "SELECT_CAMPUS", campus: e.target.value });
  }

  function handleLogin(payload) {
    if (payload.error) {
      dispatch({ type: "FORM_ERROR", error: payload.error });
      return;
    }
    dispatch({ type: "FORM_BUSY" });
    login(payload).catch((err) => {
      dispatch({ type: "FORM_ERROR", error: err.message });
    });
  }

  function handleRegister(payload) {
    if (payload.error) {
      dispatch({ type: "FORM_ERROR", error: payload.error });
      return;
    }
    dispatch({ type: "FORM_BUSY" });
    register(payload).catch((err) => {
      dispatch({ type: "FORM_ERROR", error: err.message });
    });
  }

  const currentUniversity = state.universities.find(
    (u) => u.name === state.selectedUniversity
  );
  const campuses = currentUniversity ? currentUniversity.campuses : [];
  const ready = !!state.selectedUniversity && !!state.selectedCampus;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl"
      />

      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white">
              Faculty Burnout Risk &amp; Workload Analyzer
            </h1>
            <p className="mt-2 text-sm text-white/60">
              {state.mode
                ? `${state.selectedUniversity} · ${state.selectedCampus}`
                : "Pick your university and college to get started"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md sm:p-8">
            {!state.mode && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="pick-university"
                    className="mb-1 block text-sm font-medium text-white/80"
                  >
                    University
                  </label>
                  <select
                    id="pick-university"
                    value={state.selectedUniversity}
                    onChange={handleUniversityChange}
                    disabled={state.loading}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-wait disabled:opacity-60"
                  >
                    <option value="" disabled className="bg-slate-900">
                      {state.loading ? "Loading universities…" : "Pick University Name"}
                    </option>
                    {state.universities.map((u) => (
                      <option key={u.name} value={u.name} className="bg-slate-900">
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="pick-campus"
                    className="mb-1 block text-sm font-medium text-white/80"
                  >
                    College
                  </label>
                  <select
                    id="pick-campus"
                    value={state.selectedCampus}
                    onChange={handleCampusChange}
                    disabled={!state.selectedUniversity}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="" disabled className="bg-slate-900">
                      {!state.selectedUniversity
                        ? "Pick college name"
                        : campuses.length === 0
                          ? "No colleges found"
                          : "Pick college name"}
                    </option>
                    {campuses.map((c) => (
                      <option key={c.name} value={c.name} className="bg-slate-900">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {state.error && (
                  <p role="alert" className="mt-1 text-center text-sm text-rose-300">
                    {state.error}
                  </p>
                )}

                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => dispatch({ type: "MODE_SIGNIN" })}
                    className="rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => dispatch({ type: "MODE_REGISTER" })}
                    className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                  >
                    Create a account
                  </button>
                </div>
              </div>
            )}

            {state.mode === "signin" && (
              <LoginStep
                university={state.selectedUniversity}
                campus={state.selectedCampus}
                busy={state.busy}
                error={state.error}
                onLogin={handleLogin}
                onBack={() => dispatch({ type: "BACK" })}
                onSwitchToRegister={() => dispatch({ type: "MODE_REGISTER" })}
              />
            )}
            {state.mode === "register" && (
              <RegisterStep
                university={state.selectedUniversity}
                campus={state.selectedCampus}
                busy={state.busy}
                error={state.error}
                onRegister={handleRegister}
                onBack={() => dispatch({ type: "BACK" })}
              />
            )}
          </div>

          <p className="mt-6 text-center text-xs text-white/40">
            Main demo account: <span className="text-white/70">sarang@gmail.com</span> /{" "}
            <span className="text-white/70">sarang</span> (Principal/HOD · works with any university
            and college) · No guest access — signing in is required
          </p>
        </div>
      </div>
    </div>
  );
}