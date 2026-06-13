import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ChevronRight,
  User,
  CreditCard,
  History,
  Bookmark,
  BarChart3,
} from "lucide-react";
import EditableName from "@/components/profile/EditableName";
import PasswordReset from "@/components/profile/PasswordReset";
import { hasChildren, redirectIfInKidMode } from "@/lib/active-child";


async function getUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) redirect("/login");
  const decoded = await adminAuth.verifySessionCookie(session);

  let profile = null;
  try {
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    profile = userDoc.exists ? userDoc.data() : null;
  } catch {
    // Firestore unavailable — fall back to auth token data
  }

  return {
    uid: decoded.uid,
    name: decoded.name as string | undefined,
    email: decoded.email,
    firebase: decoded.firebase,
    iat: decoded.iat,
    profile,
  };
}

async function getProgressStats(uid: string) {
  try {
    const snapshot = await adminDb
      .collection("users")
      .doc(uid)
      .collection("progress")
      .get();

    let chaptersRead = 0;
    let chaptersCompleted = 0;
    const bySubject = new Map<string, { total: number; completed: number }>();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      chaptersRead++;
      const subj = (data.subject as string) || "other";
      if (!bySubject.has(subj)) bySubject.set(subj, { total: 0, completed: 0 });
      const entry = bySubject.get(subj)!;
      entry.total++;
      if (data.completed === true) {
        chaptersCompleted++;
        entry.completed++;
      }
    }

    return { chaptersRead, chaptersCompleted, bySubject };
  } catch {
    return { chaptersRead: 0, chaptersCompleted: 0, bySubject: new Map() };
  }
}

async function getQuizStats(uid: string) {
  try {
    const snapshot = await adminDb
      .collection("users")
      .doc(uid)
      .collection("quizAttempts")
      .get();

    let totalScore = 0;
    for (const doc of snapshot.docs) {
      totalScore += (doc.data().percentage as number) || 0;
    }
    const count = snapshot.size;
    return { quizzesTaken: count, avgScore: count > 0 ? Math.round(totalScore / count) : 0 };
  } catch {
    return { quizzesTaken: 0, avgScore: 0 };
  }
}

async function getBookmarks(uid: string) {
  try {
    const snapshot = await adminDb
      .collection("users")
      .doc(uid)
      .collection("bookmarks")
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        chapterId: d.chapterId as string,
        classId: d.classId as string,
        subject: d.subject as string,
        chapterTitle: (d.chapterTitle || d.chapterId) as string,
      };
    });
  } catch {
    return [];
  }
}

async function getQuizHistory(uid: string) {
  try {
    const snapshot = await adminDb
      .collection("users")
      .doc(uid)
      .collection("quizAttempts")
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();

    return snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        score: d.score as number,
        total: d.total as number,
        percentage: d.percentage as number,
        classId: d.classId as string,
        subject: d.subject as string,
        chapterTitles: (d.chapterTitles || []) as string[],
        difficulty: d.difficulty as string,
        timestamp: d.timestamp?.toDate
          ? d.timestamp.toDate().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—",
      };
    });
  } catch {
    return [];
  }
}

export default async function ProfilePage() {
  // Kid-mode sandbox: if a child profile is active, a curious kid shouldn't
  // be able to land on parent settings by typing /profile in the URL.
  await redirectIfInKidMode();
  const user = await getUser();
  const [quizHistory, progressStats, quizStats, bookmarks, parentHasChildren] = await Promise.all([
    getQuizHistory(user.uid),
    getProgressStats(user.uid),
    getQuizStats(user.uid),
    getBookmarks(user.uid),
    hasChildren(),
  ]);

  const name = (user.profile?.name as string) || user.name || "";
  const email = user.email || "—";
  const initial = (name || user.email || "U")[0].toUpperCase();
  const provider = user.firebase?.sign_in_provider === "google.com" ? "Google" : "Email & Password";
  const isEmailProvider = provider === "Email & Password";
  const uid = user.uid;
  const role = user.profile?.role
    ? user.profile.role.charAt(0).toUpperCase() + user.profile.role.slice(1)
    : "Student";

  const memberSince = user.profile?.createdAt?.toDate
    ? new Date(user.profile.createdAt.toDate()).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <main className="min-h-screen bg-white py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Avatar + name */}
        <div className="bg-white border border-cool-line rounded-2xl shadow-sm p-8 text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            {initial}
          </div>
          <h1 className="text-2xl font-bold text-ink">{name || "—"}</h1>
          <p className="text-ink-soft text-sm mt-1">{email}</p>
        </div>

        {/* Dashboard shortcut */}
        <Link
          href="/dashboard"
          className="block bg-white hover:border-brand rounded-2xl shadow-sm hover:shadow-md border border-cool-line p-4 mb-6 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cream border border-warm-line flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-6 h-6 text-brand" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold leading-tight text-ink">Parent Dashboard</p>
              <p className="text-xs text-ink-soft mt-0.5">
                See your kids&rsquo; brain training progress, scores, and insights
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-ink-light shrink-0" strokeWidth={2} />
          </div>
        </Link>

        {/* Account details */}
        <div className="bg-white border border-cool-line rounded-2xl shadow-sm p-6 mb-6">
          <SectionHeading icon={User} title="Account Details" />
          <div className="space-y-4">
            <EditableName currentName={name} />
            <Row label="Email" value={email} />
            <Row label="Sign-in Method" value={provider} />
            {isEmailProvider && <PasswordReset email={email} />}
            <Row label="Member Since" value={memberSince} />
            <Row label="User ID" value={uid} mono />
          </div>
        </div>

        {/* PIN + Children moved to /family (2026-06-13). Profile keeps
            its account/password/subscription scope; family-setup
            (PIN + kids) lives on its own page so the PIN is always
            editable, even with zero kids. */}
        <Link
          href="/family"
          className="block bg-white border border-cool-line hover:border-brand hover:shadow-sm rounded-2xl p-5 mb-6 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
              <span className="text-2xl">🧒</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-widest mb-0.5">
                Family
              </p>
              <p className="text-base font-bold text-ink leading-snug">
                {parentHasChildren ? "Manage PIN + children" : "Set PIN + add a child"}
              </p>
              <p className="text-xs text-ink-soft mt-0.5">
                Parent PIN and your children&rsquo;s profiles.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-ink-soft shrink-0" strokeWidth={2.5} />
          </div>
        </Link>

        {/* Subscription */}
        <SubscriptionSection profile={user.profile} role={role} />

        {/* Learning Stats — only render if the parent themselves has legacy
            academic activity. Most post-pivot parents will have zero here
            (kids in kid mode generate brain attempts under children/, not these
            parent-level fields). Section is rebranded so it's clear this is
            the parent's OWN history, not their kid's. */}
        {(progressStats.chaptersRead > 0 || quizStats.quizzesTaken > 0) && (
          <div className="bg-white border border-cool-line rounded-2xl shadow-sm p-6 mb-6">
            <SectionHeading icon={BarChart3} title="Your Own Learning History" />
            <p className="text-[11px] text-ink-light mb-4">
              From quizzes/chapters you tried before adding child profiles. For
              your kids&rsquo; progress, see the dashboard.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-cream border border-warm-line rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-brand">{progressStats.chaptersRead}</p>
                <p className="text-xs text-ink-soft mt-1">Chapters Read</p>
              </div>
              <div className="bg-cream border border-warm-line rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-brand">{progressStats.chaptersCompleted}</p>
                <p className="text-xs text-ink-soft mt-1">Chapters Completed</p>
              </div>
              <div className="bg-cream border border-warm-line rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-brand">{quizStats.quizzesTaken}</p>
                <p className="text-xs text-ink-soft mt-1">Quizzes Taken</p>
              </div>
              <div className="bg-cream border border-warm-line rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-brand">{quizStats.avgScore}%</p>
                <p className="text-xs text-ink-soft mt-1">Average Score</p>
              </div>
            </div>

            {progressStats.bySubject.size > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-bold text-ink-light uppercase tracking-wide">Subject Progress</p>
                {Array.from(progressStats.bySubject.entries()).map(([subj, data]) => {
                  const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
                  return (
                    <div key={subj}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-ink capitalize">{subj}</span>
                        <span className="text-ink-light">{data.completed}/{data.total} completed</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Bookmarked Chapters */}
        {bookmarks.length > 0 && (
          <div className="bg-white border border-cool-line rounded-2xl shadow-sm p-6 mb-6">
            <SectionHeading icon={Bookmark} title="Bookmarked Chapters" />
            <div className="space-y-2">
              {bookmarks.map((b) => {
                const classLabel = b.classId.replace("class-", "Class ");
                const subjectLabel = b.subject === "maths" ? "Maths" : "Science";
                return (
                  <Link
                    key={b.chapterId}
                    href={`/class/${b.classId}/${b.subject}/${b.chapterId}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream transition-colors group"
                  >
                    <Bookmark className="w-4 h-4 text-brand shrink-0" strokeWidth={2} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink group-hover:text-brand truncate">
                        {b.chapterTitle}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-cream border border-warm-line text-ink-soft">
                          {subjectLabel}
                        </span>
                        <span className="text-xs text-ink-light">{classLabel}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Quiz History — parent's own legacy quiz attempts. Hidden when empty
            so post-pivot parents don't see a noisy "no quizzes yet" block. */}
        {quizHistory.length > 0 && (
          <div className="bg-white border border-cool-line rounded-2xl shadow-sm p-6 mb-6">
            <SectionHeading icon={History} title="Your Past Quiz Attempts" />
            <div className="space-y-3">
              {quizHistory.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between py-2 border-b border-cool-line last:border-0"
                >
                  <div className="min-w-0 mr-4">
                    <p className="text-sm font-medium text-ink truncate">
                      {attempt.chapterTitles.join(", ") || attempt.classId}
                    </p>
                    <p className="text-xs text-ink-light">
                      {attempt.subject} · {attempt.difficulty} · {attempt.timestamp}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-brand">
                      {attempt.percentage}%
                    </p>
                    <p className="text-xs text-ink-light">
                      {attempt.score}/{attempt.total}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-brand" strokeWidth={2} />
      <h2 className="text-xs font-bold text-ink-soft uppercase tracking-widest">
        {title}
      </h2>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-cool-line last:border-0">
      <span className="text-sm text-ink-soft shrink-0">{label}</span>
      <span
        className={`text-sm text-ink text-right break-all ${
          mono ? "font-mono text-xs text-ink-light" : "font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SubscriptionSection({ profile, role }: { profile: any; role: string }) {
  const now = new Date();

  // Determine status
  let status: 'trial' | 'active' | 'expired' | 'none' = 'none';
  let validUntil = '—';

  if (profile?.adminExtendedUntil?.toDate?.() > now) {
    status = 'active';
    validUntil = new Date(profile.adminExtendedUntil.toDate()).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } else if (profile?.subscriptionEndsAt?.toDate?.() > now) {
    status = 'active';
    validUntil = new Date(profile.subscriptionEndsAt.toDate()).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } else if (profile?.trialEndsAt?.toDate?.() > now) {
    status = 'trial';
    validUntil = new Date(profile.trialEndsAt.toDate()).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } else if (profile?.trialEndsAt) {
    status = 'expired';
  }

  const badgeStyles: Record<string, string> = {
    trial: 'bg-amber-100 text-amber-700',
    active: 'bg-green-100 text-green-700',
    expired: 'bg-red-100 text-red-600',
    none: 'bg-gray-100 text-gray-500',
  };
  const badgeLabels: Record<string, string> = {
    trial: 'Free Trial',
    active: 'Active',
    expired: 'Expired',
    none: 'No Subscription',
  };

  return (
    <div className="bg-white border border-cool-line rounded-2xl shadow-sm p-6 mb-6">
      <SectionHeading icon={CreditCard} title="Subscription" />
      <div className="space-y-4">
        <Row label="Role" value={role} />
        <div className="flex justify-between items-start gap-4 py-2 border-b border-cool-line">
          <span className="text-sm text-ink-soft shrink-0">Status</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeStyles[status]}`}>
            {badgeLabels[status]}
          </span>
        </div>
        {status !== 'none' && (
          <Row label={status === 'trial' ? 'Trial Ends' : 'Valid Until'} value={validUntil} />
        )}
        <Row label="Access" value="All Classes (1-10)" />
      </div>
      {(status === 'trial' || status === 'expired' || status === 'none') && (
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 mt-4 bg-brand hover:bg-brand-hover text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
        >
          {status === 'expired' ? 'Renew Subscription' : 'Subscribe Now'}
          <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
        </Link>
      )}
    </div>
  );
}
