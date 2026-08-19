export default function UniversityStep({ universities, selected, onSelect, error, loading }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Select your university</h2>
      <p className="mt-1 text-sm text-white/60">Choose the university you belong to.</p>

      {loading && (
        <p className="mt-6 text-sm text-white/70" role="status">
          Loading universities…
        </p>
      )}

      {!loading && universities.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2" role="group" aria-label="Universities">
          {universities.map((u) => {
            const active = selected === u.name;
            return (
              <button
                key={u.name}
                type="button"
                onClick={() => onSelect(u)}
                aria-pressed={active}
                className={`rounded-xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  active
                    ? "border-indigo-300 bg-indigo-400/30"
                    : "border-white/20 bg-white/10 hover:bg-white/20"
                }`}
              >
                <span className="block font-semibold text-white">{u.name}</span>
                <span className="mt-1 block text-sm text-white/60">
                  {u.campuses.length} campus{u.campuses.length === 1 ? "" : "es"}
                </span>
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
    </div>
  );
}