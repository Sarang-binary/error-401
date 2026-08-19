import { useEffect, useState } from "react";
import { api } from "../../api";

const ROLES = [
  { value: "teacher", label: "Teacher", hint: "For faculty members" },
  { value: "hod", label: "Principal / HOD", hint: "Principal (schools) or HOD (college departments)" },
];

export default function RegisterStep({ university, campus, busy, error, onRegister, onBack }) {
  const [role, setRole] = useState("teacher");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState(null);
  const departmentsBusy = role === "teacher" && departments === null;

  useEffect(() => {
    if (role !== "teacher") return;
    let cancelled = false;
    api
      .departments(university, campus)
      .then((data) => {
        if (!cancelled) setDepartments(data.departments || []);
      })
      .catch(() => {
        if (!cancelled) setDepartments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [university, campus, role]);

  function validate() {
    if (!name.trim()) return "Full name is required.";
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Enter a valid email address.";
    }
    if (!password) return "Password is required.";
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return "Password must be at least 8 characters and include both letters and numbers.";
    }
    if (password !== confirm) return "Passwords do not match.";
    if (role === "teacher" && !department) return "Please choose your department.";
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      onRegister({ error: problem });
      return;
    }
    onRegister({
      university,
      campus,
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      department: role === "teacher" ? department : null,
    });
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Create your account</h2>
      <p className="mt-1 text-sm text-white/60">
        {university} · {campus}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-white/80">I am a…</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`cursor-pointer rounded-lg border px-3 py-2.5 transition ${
                  role === r.value
                    ? "border-indigo-400 bg-indigo-500/20"
                    : "border-white/20 bg-white/10 hover:bg-white/15"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => {
                    setRole(r.value);
                    setDepartment("");
                  }}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold text-white">{r.label}</span>
                <span className="block text-xs text-white/60">{r.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="reg-name" className="mb-1 block text-sm font-medium text-white/80">
            Full name
          </label>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            placeholder="Dr. Jane Doe"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="mb-1 block text-sm font-medium text-white/80">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            placeholder="you@university.edu"
          />
        </div>

        {role === "teacher" && (
          <div>
            <label htmlFor="reg-department" className="mb-1 block text-sm font-medium text-white/80">
              Department
            </label>
            {departments.length > 0 ? (
              <select
                id="reg-department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={departmentsBusy}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-wait disabled:opacity-60"
              >
                <option value="" disabled className="bg-slate-900">
                  {departmentsBusy ? "Loading departments…" : "Select department"}
                </option>
                {departments.map((d) => (
                  <option key={d} value={d} className="bg-slate-900">
                    {d}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="reg-department"
                type="text"
                autoComplete="organization"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                placeholder={
                  departmentsBusy ? "Loading departments…" : "Type your department name"
                }
              />
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reg-password" className="mb-1 block text-sm font-medium text-white/80">
              Password
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 pr-16 text-white placeholder-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={!password}
                className="absolute inset-y-0 right-2 px-2 text-xs font-semibold text-white/60 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
            <p className="mt-1 text-xs text-white/50">
              At least 8 characters, with letters and numbers
            </p>
          </div>
          <div>
            <label htmlFor="reg-confirm" className="mb-1 block text-sm font-medium text-white/80">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="reg-confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 pr-16 text-white placeholder-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                disabled={!confirm}
                className="absolute inset-y-0 right-2 px-2 text-xs font-semibold text-white/60 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <p
            className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-wait disabled:opacity-50"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="mt-5 text-sm text-white/60 underline underline-offset-2 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        ← Change campus
      </button>
    </div>
  );
}