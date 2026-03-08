import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";

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
  const quizHistory = await getQuizHistory(user.uid);

  const name = user.name || "—";
  const email = user.email || "—";
  const initial = (user.name || user.email || "U")[0].toUpperCase();
  const provider = user.firebase?.sign_in_provider === "google.com" ? "Google" : "Email & Password";
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
          <h1 className="text-2xl font-bold text-gray-800">{name}</h1>
          <p className="text-gray-500 text-sm mt-1">{email}</p>
        </div>

        {/* Account details */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Account Details
          </h2>
          <div className="space-y-4">
            <Row label="Full Name" value={name} />
            <Row label="Email" value={email} />
            <Row label="Sign-in Method" value={provider} />
            <Row label="Member Since" value={memberSince} />
            <Row label="User ID" value={uid} mono />
          </div>
        </div>

        {/* Subscription (placeholder) */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Subscription
          </h2>
          <div className="space-y-4">
            <Row label="Role" value={role} />
            <Row label="Subscribed Class" value="—" />
            <Row label="Valid Until" value="—" />
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Subscriptions will be available soon.
          </p>
        </div>

        {/* Quiz History */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Quiz History
          </h2>
          {quizHistory.length === 0 ? (
            <p className="text-sm text-gray-400">
              No quiz attempts yet. Take a quiz to see your scores here.
            </p>
          ) : (
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
          )}
        </div>

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
