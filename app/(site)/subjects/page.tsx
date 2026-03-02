import Link from 'next/link';

const SUBJECT_CARDS = [
  {
    id: 'science',
    label: 'Science',
    icon: '🔬',
    desc: 'Plants, animals, matter, temperature, magnets, and the world around us',
    from: 'from-emerald-500',
    to: 'to-green-700',
  },
  {
    id: 'maths',
    label: 'Mathematics',
    icon: '📐',
    desc: 'Numbers, fractions, algebra, geometry, and problem solving',
    from: 'from-blue-500',
    to: 'to-blue-700',
  },
];

export default function SubjectsPage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-600 to-green-800 text-white py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-green-200 hover:text-white text-sm mb-4 transition-colors">
            ← Back to Home
          </Link>
          <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
            🔬
          </div>
          <h1 className="text-3xl font-bold mb-2">Browse by Subject</h1>
          <p className="text-green-100 text-base">Choose a subject, then pick your class to find chapters</p>
        </div>
      </section>

      {/* Subject cards */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {SUBJECT_CARDS.map((sub) => (
            <Link
              key={sub.id}
              href={`/subject/${sub.id}`}
              className={`group bg-gradient-to-br ${sub.from} ${sub.to} rounded-2xl p-10 shadow-lg flex flex-col items-center text-center hover:shadow-xl hover:scale-[1.02] transition-all duration-200`}
            >
              <div className="w-20 h-20 bg-white/25 rounded-full flex items-center justify-center text-5xl mb-5 group-hover:scale-110 transition-transform duration-200">
                {sub.icon}
              </div>
              <h3 className="text-white text-2xl font-bold mb-2">{sub.label}</h3>
              <p className="text-white/75 text-sm leading-relaxed">{sub.desc}</p>
              <span className="mt-6 text-white/50 text-xs font-medium">Tap to explore →</span>
            </Link>
          ))}
        </div>
      </div>

    </main>
  );
}
