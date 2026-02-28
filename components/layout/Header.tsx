import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-blue-700">
          Anjana Dalal Academy
        </Link>
        <p className="text-sm text-gray-500 mt-1">
          CBSE Learning Made Simple — Class 3 to 7
        </p>
      </div>
    </header>
  );
}
