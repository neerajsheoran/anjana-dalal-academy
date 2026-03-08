export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto animate-pulse">
        {/* Avatar + name */}
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-4" />
          <div className="h-7 bg-gray-200 rounded w-40 mx-auto mb-2" />
          <div className="h-4 bg-gray-200 rounded w-52 mx-auto" />
        </div>

        {/* Account details */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="h-4 bg-gray-200 rounded w-28 mb-4" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between py-2">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-36" />
              </div>
            ))}
          </div>
        </div>

        {/* Quiz history */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between py-2">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-48 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
                <div className="h-5 bg-gray-200 rounded w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
