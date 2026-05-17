// Skeleton shown while /kids (the profile picker) loads.

export default function KidsLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-10 px-4">
      <div className="max-w-md mx-auto animate-pulse">
        {/* Heading */}
        <div className="text-center mb-8">
          <div className="h-6 bg-purple-200 rounded w-60 mx-auto mb-2" />
          <div className="h-4 bg-purple-100 rounded w-48 mx-auto" />
        </div>

        {/* Child cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 p-5 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-purple-100 mx-auto mb-3" />
              <div className="h-4 bg-slate-200 rounded w-20 mx-auto mb-1.5" />
              <div className="h-3 bg-slate-200 rounded w-16 mx-auto" />
            </div>
          ))}
        </div>

        {/* Parent mode card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-28 mb-1.5" />
            <div className="h-3 bg-slate-200 rounded w-44" />
          </div>
        </div>
      </div>
    </main>
  );
}
