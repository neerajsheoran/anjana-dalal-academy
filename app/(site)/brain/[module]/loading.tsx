// Skeleton shown while /brain/[module] loads (Memory / Focus / Thinking page).
// Mirrors the module header + list of activity cards.

export default function ModuleLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-md mx-auto animate-pulse">
        {/* Back link */}
        <div className="h-4 bg-slate-200 rounded w-20 mb-4" />

        {/* Module header */}
        <div className="bg-slate-100 rounded-2xl p-6 mb-6 text-center">
          <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto mb-3" />
          <div className="h-6 bg-slate-200 rounded w-32 mx-auto mb-2" />
          <div className="h-3 bg-slate-200 rounded w-56 mx-auto" />
        </div>

        {/* "Activities for X" label */}
        <div className="h-3 bg-slate-200 rounded w-40 mb-3 ml-1" />

        {/* Activity card list */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-xl shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-32 mb-1.5" />
                <div className="h-3 bg-slate-200 rounded w-44" />
              </div>
              <div className="w-7 h-7 bg-slate-200 rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
