import { useState } from "react";

export default function LoginStep({ university, campus, busy, error, onLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function validate() {
    if (!email.trim() || !password) return "Email and password are required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Enter a valid email address.";
    }
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      onLogin({ error: problem });
      return;
    }
    onLogin({ email: email.trim(), password, university, campus });
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Faculty / HOD Login</h2>
      <p className="mt-1 text-sm text-white/60">
        {university} · {campus}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-white/80">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error && !email ? "true" : "false"}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            placeholder="you@university.edu"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-white/80">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error && !password ? "true" : "false"}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            placeholder="••••••••"
          />
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