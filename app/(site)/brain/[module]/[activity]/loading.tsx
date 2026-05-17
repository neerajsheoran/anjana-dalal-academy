// Skeleton shown while /brain/[module]/[activity] loads.
// The activity wrapper does an adaptive-difficulty lookup (Firestore read),
// so this is the slowest of the brain navigations — a clean skeleton avoids
// the kid seeing a blank screen for a beat.

export default function ActivityLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-md mx-auto animate-pulse">
        {/* Top bar: Exit + Round indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-slate-200 rounded w-12" />
          <div className="h-3 bg-slate-200 rounded w-20" />
          <div className="w-12" />
        </div>

        {/* Instruction card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-200 mx-auto mb-3" />
          <div className="h-6 bg-slate-200 rounded w-40 mx-auto mb-2" />
          <div className="h-3 bg-slate-200 rounded w-32 mx-auto mb-4" />
          <div className="h-7 bg-slate-100 rounded-full w-44 mx-auto mb-5" />

          {/* Step list */}
          <div className="text-left space-y-3 mb-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 rounded" />
            ))}
          </div>

          {/* Start button */}
          <div className="h-12 bg-slate-300 rounded-xl" />
        </div>
      </div>
    </main>
  );
}
