import Link from "next/link";

const CLASSES = [
  { id: "class-3", label: "Class 3" },
  { id: "class-4", label: "Class 4" },
  { id: "class-5", label: "Class 5" },
  { id: "class-6", label: "Class 6" },
  { id: "class-7", label: "Class 7" },
];

const SUBJECTS = [
  {
    id: "maths",
    label: "Mathematics",
    icon: "📐",
    desc: "Numbers, algebra, geometry and more",
    bg: "bg-blue-50",
    border: "border-blue-200",
    hover: "hover:bg-blue-100 hover:border-blue-400",
    text: "text-blue-800",
    sub: "text-blue-500",
  },
  {
    id: "science",
    label: "Science",
    icon: "🔬",
    desc: "Plants, animals, matter, and the world around us",
    bg: "bg-green-50",
    border: "border-green-200",
    hover: "hover:bg-green-100 hover:border-green-400",
    text: "text-green-800",
    sub: "text-green-500",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-3">
            Class 3 to Class 7 · CBSE · NCERT
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Learn CBSE the Easy Way
          </h2>
          <p className="text-blue-100 text-lg max-w-xl mx-auto mb-8">
            Simple explanations, real-life Indian examples, and 3-level
            worksheets — designed for every average student.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/class/class-6"
              className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-full hover:bg-blue-50 transition-colors"
            >
              Start with Class 6
            </Link>
            <Link
              href="/subject/science"
              className="border border-blue-300 text-white font-semibold px-6 py-3 rounded-full hover:bg-blue-700 transition-colors"
            >
              Browse by Subject
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Browse by Class */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Browse by Class
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {CLASSES.map((cls) => (
              <Link
                key={cls.id}
                href={`/class/${cls.id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 text-center font-semibold text-gray-700 hover:border-blue-500 hover:text-blue-700 hover:shadow-sm transition-all"
              >
                {cls.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Browse by Subject */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Browse by Subject
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SUBJECTS.map((subject) => (
              <Link
                key={subject.id}
                href={`/subject/${subject.id}`}
                className={`${subject.bg} border ${subject.border} ${subject.hover} rounded-xl p-6 flex items-center gap-4 transition-all`}
              >
                <span className="text-4xl">{subject.icon}</span>
                <div>
                  <p className={`text-lg font-semibold ${subject.text}`}>
                    {subject.label}
                  </p>
                  <p className={`text-sm mt-0.5 ${subject.sub}`}>
                    {subject.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
