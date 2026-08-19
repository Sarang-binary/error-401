import { useUiMode } from "../context/UiModeContext";

export function useUi() {
  const { mode, isW3c, toggle } = useUiMode();

  const cls = isW3c
    ? {
        bg: "min-h-screen bg-white text-black",
        card: "rounded-xl border-2 border-black bg-white p-5 shadow-sm",
        text: "text-black",
        muted: "text-neutral-700",
        btn: "border-2 border-black bg-black px-4 py-2 rounded-lg font-semibold text-white hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black",
        btnGhost: "border-2 border-black px-4 py-2 rounded-lg font-semibold text-black hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black",
        input: "w-full border-2 border-black bg-white px-3 py-2 text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black",
        body: "text-base leading-relaxed",
      }
    : {
        bg: "min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900",
        card: "rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl backdrop-blur-md",
        text: "text-white",
        muted: "text-white/60",
        btn: "rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-wait disabled:opacity-50",
        btnGhost: "rounded-lg border border-white/25 bg-white/5 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300",
        input: "w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
        body: "text-base",
      };

  return { mode, isW3c, toggle, cls };
}

export const LEVEL_COLORS = {
  Low: { solid: "#16a34a", chip: "bg-emerald-500/90 text-white" },
  Moderate: { solid: "#f59e0b", chip: "bg-amber-500/90 text-white" },
  High: { solid: "#f97316", chip: "bg-orange-500/90 text-white" },
  Critical: { solid: "#dc2626", chip: "bg-red-600/90 text-white" },
};

export function scoreStatus(score) {
  if (score == null) return { level: "Unknown", chip: "bg-neutral-500/90 text-white" };
  if (score >= 70) return LEVEL_COLORS.Critical;
  if (score >= 50) return LEVEL_COLORS.High;
  if (score >= 30) return LEVEL_COLORS.Moderate;
  return LEVEL_COLORS.Low;
}