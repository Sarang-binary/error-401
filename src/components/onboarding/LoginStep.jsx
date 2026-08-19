import { useState } from "react";

const inputCls =
  "w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400";

const ROLES = [
  { value: "teacher", label: "Teacher", hint: "Faculty member" },
  { value: "hod", label: "Principal / HOD", hint: "School principal or college HOD" },
];

export default function LoginStep({
  university,
  campus,
  busy,
  error,
  onLogin,
  onBack,
  onSwitchToRegister,
}) {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function validate() {
    if (!role) return "Select whether you are a Teacher or Principal/HOD.";
    if (!email.trim() || !password) return "Username/email and password are required.";
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      onLogin({ error: problem });
      return;
    }
    onLogin({ email: email.trim(), password, role, university, campus });
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Faculty / HOD Login</h2>
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
                  name="login-role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => setRole(r.value)}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold text-white">{r.label}</span>
                <span className="block text-xs text-white/60">{r.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-white/80">
            Username or Email
          </label>
          <input
            id="login-email"
            type="text"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error && !email ? "true" : "false"}
            className={inputCls}
            placeholder="you@university.edu"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-white/80">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error && !password ? "true" : "false"}
              className={`${inputCls} pr-16`}
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
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-white/60 underline underline-offset-2 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          ← Change college
        </button>
        {onSwitchToRegister && (
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-sm font-medium text-indigo-300 underline underline-offset-2 hover:text-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            New here? Create a account
          </button>
        )}
      </div>
    </div>
  );
}