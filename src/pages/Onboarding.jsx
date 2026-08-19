import { useEffect, useReducer } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import UniversityStep from "../components/onboarding/UniversityStep";
import CampusStep from "../components/onboarding/CampusStep";
import LoginStep from "../components/onboarding/LoginStep";
import RegisterStep from "../components/onboarding/RegisterStep";

const initialState = {
  step: 0,
  mode: "entry",
  universities: [],
  selectedUniversity: null,
  selectedCampus: null,
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
    case "MODE_SIGNIN":
      return { ...state, mode: "signin", step: 1, error: null };
    case "MODE_REGISTER":
      return { ...state, mode: "register", step: 1, error: null };
    case "GUEST_BUSY":
      return { ...state, busy: true, error: null };
    case "GUEST_FAILED":
      return { ...state, busy: false, error: action.error };
    case "SELECT_UNIVERSITY":
      return {
        ...state,
        selectedUniversity: action.university,
        selectedCampus: null,
        step: 2,
        error: null,
      };
    case "SELECT_CAMPUS":
      return { ...state, selectedCampus: action.campus, step: 3, error: null };
    case "BACK":
      return { ...state, step: Math.max(1, state.step - 1), error: null };
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
  const { login, register, guest } = useAuth();

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

  function handleUniversitySelect(university) {
    if (university.campuses.length === 0) {
      dispatch({
        type: "LOAD_FAILED",
        error: `No campuses found for ${university.name}. Please contact your administrator.`,
      });
      return;
    }
    dispatch({ type: "SELECT_UNIVERSITY", university: university.name });
  }

  function handleCampusSelect(campus) {
    dispatch({ type: "SELECT_CAMPUS", campus });
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

  function handleGuest() {
    dispatch({ type: "GUEST_BUSY" });
    guest().catch((err) => {
      dispatch({ type: "GUEST_FAILED", error: err.message });
    });
  }

  const currentUniversity = state.universities.find((u) => u.name === state.selectedUniversity);
  const steps = ["University", "Campus", state.mode === "register" ? "Details" : "Login"];

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
              {state.step === 0
                ? "Sign in, create an account, or explore as a guest"
                : "Complete the steps to get started"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md sm:p-8">
            {state.step === 0 ? (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "MODE_SIGNIN" })}
                  className="rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "MODE_REGISTER" })}
                  className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                >
                  Create account
                </button>
                <button
                  type="button"
                  onClick={handleGuest}
                  disabled={state.busy}
                  className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 font-semibold text-white/80 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                >
                  {state.busy ? "Entering site…" : "Skip the login and enter the site"}
                </button>
                {state.error && (
                  <p role="alert" className="mt-1 text-center text-sm text-rose-300">
                    {state.error}
                  </p>
                )}
              </div>
            ) : (
              <>
                <ol className="mb-6 flex items-center gap-2" aria-label="Onboarding progress">
                  {steps.map((label, i) => {
                    const done = i < state.step - 1;
                    const current = i === state.step - 1;
                    return (
                      <li key={label} className="flex flex-1 items-center gap-2">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            done
                              ? "bg-emerald-400 text-emerald-950"
                              : current
                                ? "bg-indigo-400 text-indigo-950"
                                : "bg-white/10 text-white/50"
                          }`}
                        >
                          {done ? "✓" : i + 1}
                        </span>
                        <span
                          className={`text-xs font-medium ${current ? "text-white" : "text-white/50"}`}
                        >
                          {label}
                        </span>
                        {i < steps.length - 1 && (
                          <span aria-hidden="true" className="h-px flex-1 bg-white/20" />
                        )}
                      </li>
                    );
                  })}
                </ol>

                {state.step === 1 && (
                  <UniversityStep
                    universities={state.universities}
                    selected={state.selectedUniversity}
                    onSelect={handleUniversitySelect}
                    error={state.error}
                    loading={state.loading}
                  />
                )}
                {state.step === 2 && (
                  <CampusStep
                    university={state.selectedUniversity}
                    campuses={currentUniversity ? currentUniversity.campuses : []}
                    selected={state.selectedCampus}
                    onSelect={handleCampusSelect}
                    onBack={() => dispatch({ type: "BACK" })}
                    error={state.error}
                  />
                )}
                {state.step === 3 && state.mode === "signin" && (
                  <LoginStep
                    university={state.selectedUniversity}
                    campus={state.selectedCampus}
                    busy={state.busy}
                    error={state.error}
                    onLogin={handleLogin}
                    onBack={() => dispatch({ type: "BACK" })}
                  />
                )}
                {state.step === 3 && state.mode === "register" && (
                  <RegisterStep
                    university={state.selectedUniversity}
                    campus={state.selectedCampus}
                    busy={state.busy}
                    error={state.error}
                    onRegister={handleRegister}
                    onBack={() => dispatch({ type: "BACK" })}
                  />
                )}
              </>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-white/40">
            No account yet?{" "}
            <button
              type="button"
              onClick={() => dispatch({ type: "MODE_REGISTER" })}
              className="font-medium text-indigo-300 underline-offset-2 hover:underline"
            >
              Create one for free
            </button>{" "}
            · or{" "}
            <button
              type="button"
              onClick={handleGuest}
              disabled={state.busy}
              className="font-medium text-indigo-300 underline-offset-2 hover:underline disabled:opacity-60"
            >
              skip the login and enter the site
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}