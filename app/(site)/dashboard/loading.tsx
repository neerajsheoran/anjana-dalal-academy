// Skeleton shown while /dashboard fetches insights + attempts.
// Mirrors DashboardClient's layout so the page doesn't jump on load.

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-cream py-10 px-4">
      <div className="max-w-5xl mx-auto animate-pulse">
        {/* Header */}
        <div className="mb-8">
          <div className="h-3 bg-warm-line rounded w-32 mb-2" />
          <div className="h-8 bg-warm-line rounded w-56 mb-2" />
          <div className="h-4 bg-warm-line rounded w-80" />
        </div>

        {/* Child picker tabs */}
        <div className="flex gap-2 mb-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-10 bg-warm-line rounded-xl w-32" />
          ))}
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl ring-1 ring-cool-line p-3"
            >
              <div className="h-5 w-5 bg-warm-line rounded mx-auto mb-2" />
              <div className="h-6 bg-warm-line rounded w-12 mx-auto mb-1" />
              <div className="h-3 bg-warm-line rounded w-16 mx-auto" />
            </div>
          ))}
        </div>

        {/* Insight cards */}
        <div className="bg-white rounded-2xl ring-1 ring-cool-line p-6 mb-6">
          <div className="h-4 bg-warm-line rounded w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-warm-line shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-warm-line rounded w-48 mb-1.5" />
                  <div className="h-3 bg-warm-line rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent attempts table */}
        <div className="bg-white rounded-2xl ring-1 ring-cool-line p-6">
          <div className="h-4 bg-warm-line rounded w-32 mb-4" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-cream rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
