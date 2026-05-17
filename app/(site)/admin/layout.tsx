// Admin section guard: hard-redirect to /brain when a child profile is
// active. The admin surface is strictly parent (and role-gated to admin
// roles elsewhere) — a kid who types /admin into the URL bar should be
// kicked back to their training screen.

import { redirectIfInKidMode } from "@/lib/active-child";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfInKidMode();
  return <>{children}</>;
}
