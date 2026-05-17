// Advisor (Partner) section guard: hard-redirect to /brain when a child
// profile is active. The advisor surface is strictly parent / partner —
// a kid who types /advisor into the URL bar should be kicked back to
// their training screen.

import { redirectIfInKidMode } from "@/lib/active-child";

export default async function AdvisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfInKidMode();
  return <>{children}</>;
}
