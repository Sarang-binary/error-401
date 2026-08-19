import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUi } from "./ui";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isW3c, toggle, cls } = useUi();

  return (
    <nav
      aria-label="Main navigation"
      className={`sticky top-0 z-20 border-b px-4 py-3 backdrop-blur-md sm:px-6 ${
        isW3c
          ? "border-b-2 border-black bg-white"
          : "border-white/15 bg-slate-900/70"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className={`text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${cls.text}`}
          >
            <span
              className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: isW3c ? "#000" : "#f59e0b" }}
            />
            Burnout Analyzer
          </Link>

          <span
            className={`hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-block ${
              isW3c
                ? "border-2 border-black text-black"
                : "border border-white/20 bg-white/10 text-white/80"
            }`}
          >
            {user.university} · {user.campus}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isW3c}
            aria-label="Toggle W3C accessibility mode"
            onClick={toggle}
            className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              isW3c ? "bg-black" : "bg-white/20"
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                isW3c ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
          <span className={`hidden text-xs md:inline ${cls.muted}`}>
            {isW3c ? "Accessibility mode" : "Design mode"}
          </span>

          <div className={`hidden text-right sm:block`}>
            <p className={`text-xs font-semibold leading-tight ${cls.text}`}>{user.name}</p>
            <p className={`text-[11px] uppercase tracking-wide ${cls.muted}`}>{user.role}</p>
          </div>

          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            className={`${cls.btnGhost} text-sm`}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}