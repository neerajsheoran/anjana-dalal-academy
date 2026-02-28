import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string; // no href = current page (not a link)
}

export default function Breadcrumb({
  items,
  light = false,
}: {
  items: BreadcrumbItem[];
  light?: boolean; // true = white text for use on dark/colored backgrounds
}) {
  return (
    <nav className={`text-sm mb-4 ${light ? "text-white/60" : "text-gray-400"}`}>
      {items.map((item, index) => (
        <span key={index}>
          {index > 0 && <span className="mx-2">›</span>}
          {item.href ? (
            <Link
              href={item.href}
              className={light ? "hover:text-white" : "hover:text-blue-600"}
            >
              {item.label}
            </Link>
          ) : (
            <span className={light ? "text-white font-medium" : "text-gray-700 font-medium"}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
