// Parent Dashboard — per-kid brain training overview.
// Server component: loads parent's children + selected child's full
// dashboard data, hands off to a client component for tab interaction.

import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  getParentUid,
  loadChildDashboard,
  loadDashboardChildren,
} from "@/lib/dashboard";
import { redirectIfInKidMode } from "@/lib/active-child";
import DashboardClient from "./DashboardClient";

interface SearchParams {
  kid?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Kid-mode sandbox: dashboard shows aggregated insights across ALL kids;
  // not appropriate for a kid in kid mode to view. Send them to /brain.
  await redirectIfInKidMode();

  const parentUid = await getParentUid();
  if (!parentUid) redirect("/login?from=/dashboard");

  const children = await loadDashboardChildren(parentUid);

  // No children yet → nudge them to /profile
  if (children.length === 0) {
    return <NoChildrenState />;
  }

  // Determine which kid to show — ?kid=… preferred, else first
  const params = await searchParams;
  const requestedId = params.kid || "";
  const selected =
    children.find((c) => c.id === requestedId) ?? children[0];

  const data = await loadChildDashboard(parentUid, selected);

  return (
    <DashboardClient
      children={children.map((c) => ({
        id: c.id,
        name: c.name,
        age: c.age,
        ageGroup: c.ageGroup,
      }))}
      selectedId={selected.id}
      data={data}
    />
  );
}

function NoChildrenState() {
  return (
    <main className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-md mx-auto bg-cream border border-warm-line rounded-2xl shadow-sm p-8 text-center">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4 text-5xl sm:text-6xl shadow-inner">
          🧒
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-base font-bold shadow-md">
            +
          </div>
        </div>
        <h1 className="text-xl font-bold text-ink mb-2">
          No child profiles yet
        </h1>
        <p className="text-sm text-ink-soft mb-6 leading-relaxed">
          Add a child profile first — once they start training, this dashboard
          will show their progress, scores, and personalised insights.
        </p>
        <a
          href="/family"
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
        >
          Add a child profile
          <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
        </a>
      </div>
    </main>
  );
}
