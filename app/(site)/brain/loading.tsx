// Skeleton shown while /brain (the Brain Screen) loads.
// Mirrors the brain image + 3 pillar tiles below it.

export default function BrainLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-md mx-auto animate-pulse">
        {/* Greeting line */}
        <div className="h-5 bg-slate-200 rounded w-40 mx-auto mb-6" />

        {/* Brain image placeholder */}
        <div className="relative mx-auto mb-8 aspect-square max-w-xs">
          <div className="w-full h-full rounded-full bg-slate-200" />
          {/* 3 lobe dots */}
          <div className="absolute top-[15%] left-[20%] w-14 h-14 rounded-full bg-purple-200" />
          <div className="absolute top-[40%] right-[10%] w-14 h-14 rounded-full bg-green-200" />
          <div className="absolute bottom-[20%] left-[35%] w-14 h-14 rounded-full bg-orange-200" />
        </div>

        {/* 3 pillar tiles */}
        <div className="space-y-3">
          {[
            'bg-purple-100',
            'bg-green-100',
            'bg-orange-100',
          ].map((bg, i) => (
            <div
              key={i}
              className={`${bg} rounded-2xl p-5 flex items-center gap-4`}
            >
              <div className="w-12 h-12 rounded-xl bg-white/60 shrink-0" />
              <div className="flex-1">
                <div className="h-5 bg-white/60 rounded w-28 mb-2" />
                <div className="h-3 bg-white/40 rounded w-44" />
              </div>
              <div className="w-5 h-5 bg-white/60 rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
