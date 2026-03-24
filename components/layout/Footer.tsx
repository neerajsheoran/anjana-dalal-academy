import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.png" alt="CogniLift" className="h-14 w-14" />
              <h3 className="text-xl font-extrabold tracking-tight">
                <span className="text-blue-700">Cogni</span>
                <span className="text-orange-500">Lift</span>
              </h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Clear Concepts · Strong Foundations. CBSE content with easy
              explanations and real-life examples for every Indian student.
            </p>
          </div>

          {/* Browse by Class */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Browse by Class
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {["class-1", "class-2", "class-3", "class-4", "class-5", "class-6", "class-7", "class-8", "class-9", "class-10"].map((cls) => (
                <Link
                  key={cls}
                  href={`/class/${cls}`}
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors capitalize"
                >
                  {cls.replace("-", " ").replace("class", "Class")}
                </Link>
              ))}
            </div>
          </div>

          {/* Browse by Subject */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Browse by Subject
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/subject/science"
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Science
                </Link>
              </li>
              <li>
                <Link
                  href="/subject/maths"
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Mathematics
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-100 mt-8 pt-6 text-center space-y-2">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} CogniLift. All rights reserved.
          </p>
          <p className="text-[11px] text-gray-300 max-w-lg mx-auto leading-relaxed">
            This platform is independently developed and is not affiliated with, endorsed by, or associated with NCERT or CBSE.
            All content is original and created for educational purposes based on publicly available curriculum guidelines.
          </p>
        </div>
      </div>
    </footer>
  );
}
