import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import EditableName from "@/components/profile/EditableName";
import PasswordReset from "@/components/profile/PasswordReset";
import ChildrenSection from "@/components/profile/ChildrenSection";
import PinSection from "@/components/profile/PinSection";


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
  const user = await getUser();
  const [quizHistory, progressStats, quizStats, bookmarks] = await Promise.all([
    getQuizHistory(user.uid),
    getProgressStats(user.uid),
    getQuizStats(user.uid),
    getBookmarks(user.uid),
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
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Avatar + name */}
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            {initial}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{name || "—"}</h1>
          <p className="text-gray-500 text-sm mt-1">{email}</p>
        </div>

        {/* Dashboard shortcut */}
        <Link
          href="/dashboard"
          className="block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl shadow-md p-5 mb-6 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl shrink-0">
              📊
            </div>
            <div className="flex-1 min-w-0 text-white">
              <p className="text-base font-bold leading-tight">Parent Dashboard</p>
              <p className="text-xs text-white/85 mt-0.5">
                See your kids&rsquo; brain training progress, scores, and insights
              </p>
            </div>
            <span className="text-2xl text-white/80 shrink-0">→</span>
          </div>
        </Link>

        {/* Account details */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Account Details
          </h2>
          <div className="space-y-4">
            <EditableName currentName={name} />
            <Row label="Email" value={email} />
            <Row label="Sign-in Method" value={provider} />
            {isEmailProvider && <PasswordReset email={email} />}
            <Row label="Member Since" value={memberSince} />
            <Row label="User ID" value={uid} mono />
          </div>
        </div>

        {/* Parent PIN management */}
        <PinSection hasPinInitial={typeof user.profile?.childPinHash === "string" && user.profile.childPinHash.length > 0} />

        {/* Brain training: child profiles */}
        <ChildrenSection hasPinInitial={typeof user.profile?.childPinHash === "string" && user.profile.childPinHash.length > 0} />

        {/* Subscription */}
        <SubscriptionSection profile={user.profile} role={role} />

        {/* Learning Stats — only render if the parent themselves has legacy
            academic activity. Most post-pivot parents will have zero here
            (kids in kid mode generate brain attempts under children/, not these
            parent-level fields). Section is rebranded so it's clear this is
            the parent's OWN history, not their kid's. */}
        {(progressStats.chaptersRead > 0 || quizStats.quizzesTaken > 0) && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Your Own Learning History
            </h2>
            <p className="text-[11px] text-gray-400 mb-4">
              From quizzes/chapters you tried before adding child profiles. For
              your kids&rsquo; progress, see the dashboard.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{progressStats.chaptersRead}</p>
                <p className="text-xs text-gray-500 mt-1">Chapters Read</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{progressStats.chaptersCompleted}</p>
                <p className="text-xs text-gray-500 mt-1">Chapters Completed</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{quizStats.quizzesTaken}</p>
                <p className="text-xs text-gray-500 mt-1">Quizzes Taken</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">{quizStats.avgScore}%</p>
                <p className="text-xs text-gray-500 mt-1">Average Score</p>
              </div>
            </div>

            {progressStats.bySubject.size > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Subject Progress</p>
                {Array.from(progressStats.bySubject.entries()).map(([subj, data]) => {
                  const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
                  return (
                    <div key={subj}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700 capitalize">{subj}</span>
                        <span className="text-gray-400">{data.completed}/{data.total} completed</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
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
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Bookmarked Chapters
            </h2>
            <div className="space-y-2">
              {bookmarks.map((b) => {
                const classLabel = b.classId.replace("class-", "Class ");
                const subjectLabel = b.subject === "maths" ? "Maths" : "Science";
                const subjectColor = b.subject === "maths" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600";
                return (
                  <Link
                    key={b.chapterId}
                    href={`/class/${b.classId}/${b.subject}/${b.chapterId}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate">
                        {b.chapterTitle}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${subjectColor}`}>
                          {subjectLabel}
                        </span>
                        <span className="text-xs text-gray-400">{classLabel}</span>
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
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Your Past Quiz Attempts
            </h2>
            <div className="space-y-3">
              {quizHistory.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="min-w-0 mr-4">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {attempt.chapterTitles.join(", ") || attempt.classId}
                    </p>
                    <p className="text-xs text-gray-400">
                      {attempt.subject} · {attempt.difficulty} · {attempt.timestamp}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-blue-600">
                      {attempt.percentage}%
                    </p>
                    <p className="text-xs text-gray-400">
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
    <div className="flex justify-between items-start gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span
        className={`text-sm text-gray-800 text-right break-all ${
          mono ? "font-mono text-xs text-gray-400" : "font-medium"
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
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
        Subscription
      </h2>
      <div className="space-y-4">
        <Row label="Role" value={role} />
        <div className="flex justify-between items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm text-gray-500 shrink-0">Status</span>
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
          className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
        >
          {status === 'expired' ? 'Renew Subscription' : 'Subscribe Now'}
        </Link>
      )}
    </div>
  );
}
