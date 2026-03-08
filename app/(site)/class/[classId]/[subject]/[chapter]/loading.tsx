export default function ChapterLoading() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Banner skeleton */}
      <div className="bg-gray-200 py-10 px-6">
        <div className="max-w-3xl mx-auto animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-48 mb-4" />
          <div className="h-8 bg-gray-300 rounded w-72" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-3xl mx-auto px-6 py-8 animate-pulse">
        {/* Tab bar */}
        <div className="flex gap-4 mb-8">
          <div className="h-9 bg-gray-200 rounded-lg w-24" />
          <div className="h-9 bg-gray-200 rounded-lg w-28" />
        </div>

        {/* Content lines */}
        <div className="space-y-4">
          <div className="h-5 bg-gray-200 rounded w-full" />
          <div className="h-5 bg-gray-200 rounded w-5/6" />
          <div className="h-5 bg-gray-200 rounded w-4/5" />
          <div className="h-5 bg-gray-200 rounded w-full" />
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-32 bg-gray-200 rounded-lg w-full mt-6" />
          <div className="h-5 bg-gray-200 rounded w-full mt-6" />
          <div className="h-5 bg-gray-200 rounded w-5/6" />
          <div className="h-5 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    </main>
  );
}
