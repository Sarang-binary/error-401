export default function CampusStep({ university, campuses, selected, onSelect, onBack, error }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Select your campus</h2>
      <p className="mt-1 text-sm text-white/60">
        Campuses for <span className="font-semibold text-white">{university}</span>
      </p>

      {campuses.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2" role="group" aria-label="Campuses">
          {campuses.map((c) => {
            const active = selected === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onSelect(c)}
                aria-pressed={active}
                className={`rounded-xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  active
                    ? "border-indigo-300 bg-indigo-400/30"
                    : "border-white/20 bg-white/10 hover:bg-white/20"
                }`}
              >
                <span className="block font-semibold text-white">{c}</span>
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p className="mt-5 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mt-6 text-sm text-white/60 underline underline-offset-2 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        ← Change university
      </button>
    </div>
  );
}