import Link from 'next/link';

const CLASS_CARDS = [
  {
    id: 'class-3',
    label: 'Class 3',
    icon: '🌱',
    desc: 'Start your learning journey',
    from: 'from-orange-400',
    to: 'to-orange-600',
  },
  {
    id: 'class-4',
    label: 'Class 4',
    icon: '⭐',
    desc: 'Explore and discover new ideas',
    from: 'from-pink-400',
    to: 'to-rose-600',
  },
  {
    id: 'class-5',
    label: 'Class 5',
    icon: '🚀',
    desc: 'Reach for bigger concepts',
    from: 'from-amber-400',
    to: 'to-yellow-600',
  },
  {
    id: 'class-6',
    label: 'Class 6',
    icon: '📘',
    desc: 'Build strong foundations',
    from: 'from-blue-500',
    to: 'to-blue-700',
  },
  {
    id: 'class-7',
    label: 'Class 7',
    icon: '🔭',
    desc: 'Expand your horizons',
    from: 'from-teal-500',
    to: 'to-cyan-700',
  },
];

export default function ClassesPage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-blue-200 hover:text-white text-sm mb-4 transition-colors">
            ← Back to Home
          </Link>
          <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
            📘
          </div>
          <h1 className="text-3xl font-bold mb-2">Browse by Class</h1>
          <p className="text-blue-100 text-base">Select your class to explore subjects and chapters</p>
        </div>
      </section>

      {/* Class cards */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CLASS_CARDS.map((cls) => (
            <Link
              key={cls.id}
              href={`/class/${cls.id}`}
              className={`group bg-gradient-to-br ${cls.from} ${cls.to} rounded-2xl p-8 shadow-lg flex flex-col items-center text-center hover:shadow-xl hover:scale-[1.02] transition-all duration-200`}
            >
              <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                {cls.icon}
              </div>
              <h3 className="text-white text-2xl font-bold mb-1">{cls.label}</h3>
              <p className="text-white/75 text-sm">{cls.desc}</p>
              <span className="mt-5 text-white/50 text-xs font-medium">Tap to explore →</span>
            </Link>
          ))}
        </div>
      </div>

    </main>
  );
}
