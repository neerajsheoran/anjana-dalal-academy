export default function SystemFlows() {
  return (
    <div className="space-y-6">
      {/* Student Signup */}
      <FlowCard
        title="Student Signup"
        steps={[
          { actor: "Student", text: "Visits the site and clicks Sign In" },
          { actor: "Student", text: "Signs in with Google or Email/Password" },
          { actor: "System", text: "Creates user doc in Firestore with role = 'student' and emailVerified status" },
          { actor: "Firebase", text: "Sends email verification link automatically (email/password signup only)" },
          { actor: "System", text: "Free trial starts (configurable days from Platform Config)" },
          { actor: "System", text: "Sends welcome email to student" },
          { actor: "Student", text: "Gets full access during trial period" },
        ]}
        email="Welcome email with trial info"
      />

      {/* Subscription & Payment */}
      <FlowCard
        title="Subscription & Payment"
        steps={[
          { actor: "Student", text: "Trial expires (or they choose to subscribe early)" },
          { actor: "Student", text: "Clicks Subscribe and optionally enters a referral code" },
          { actor: "System", text: "If referral code is valid: discount is applied to price" },
          { actor: "Razorpay", text: "Payment page opens, student completes payment" },
          { actor: "System", text: "Verifies payment signature and creates subscription record" },
          { actor: "System", text: "Updates subscription status to 'active' for 1 year" },
          { actor: "System", text: "Increments referral code usage counter" },
          { actor: "System", text: "Sends subscription confirmation email to student" },
        ]}
        email="Subscription confirmed email with amount and validity"
      />

      {/* Referral & Commission */}
      <FlowCard
        title="Referral & Commission"
        steps={[
          { actor: "Student", text: "Uses an advisor's referral code while subscribing" },
          { actor: "System", text: "Applies discount to student (configured in Platform Config)" },
          { actor: "System", text: "Calculates commission on the paid amount (% from Platform Config)" },
          { actor: "System", text: "Saves commission record with the subscription (commissionPaid = false)" },
          { actor: "System", text: "Sends email notification to advisor about new commission earned" },
          { actor: "Advisor", text: "Sees commission as 'Pending' on their dashboard" },
        ]}
        email="Commission earned email to advisor with student name and amount"
      />

      {/* Advisor Onboarding */}
      <FlowCard
        title="Advisor Onboarding"
        steps={[
          { actor: "Advisor", text: "Visits /advisor and fills the application form (name, email, phone, city, reason)" },
          { actor: "System", text: "Saves application in Firestore as 'pending'" },
          { actor: "Admin", text: "Sees the application in Advisors tab under 'Pending Applications'" },
          { actor: "Admin", text: "Clicks Approve or Reject" },
          { actor: "System", text: "If approved: generates a unique referral code (ADV-XXXXX)" },
          { actor: "System", text: "When the approved person signs in (same email), they get role = 'partner'" },
          { actor: "Advisor", text: "Sees their dashboard at /advisor/dashboard with referral code" },
          { actor: "Advisor", text: "Provides bank details (Account Holder, Bank Name, Account No., IFSC, PAN)" },
          { actor: "Firebase", text: "Sends email verification link on signup; resend available from dashboard" },
          { actor: "Admin", text: "Manually verifies advisor's phone number (calls/WhatsApp, then marks verified in admin panel)" },
        ]}
      />

      {/* Advisor Dashboard */}
      <FlowCard
        title="Advisor Dashboard"
        steps={[
          { actor: "Advisor", text: "Logs in and goes to /advisor/dashboard" },
          { actor: "Advisor", text: "Sees stats: Total Referrals, Total Earnings, Pending Payout, Paid Out" },
          { actor: "Advisor", text: "Sees verification status: Email (Verified/Not Verified with resend option) and Mobile (Verified/Pending)" },
          { actor: "Advisor", text: "Sees their referral code with copy button" },
          { actor: "Advisor", text: "Sees bank details section (read-only, editable on click)" },
          { actor: "Advisor", text: "Sees referral history table: Date, Student Name, Amount, Commission, Status" },
          { actor: "Advisor", text: "Sees payout history: past payouts processed by admin" },
        ]}
      />

      {/* Admin Payout */}
      <FlowCard
        title="Admin Payout Process"
        steps={[
          { actor: "Admin", text: "Goes to Advisors tab and clicks on an advisor row to expand" },
          { actor: "Admin", text: "Sees verification status: Email (auto-synced) and Phone (with Mark Verified/Unverified toggle)" },
          { actor: "Admin", text: "Sees advisor's bank details (Account Holder, Bank, Account, IFSC, PAN)" },
          { actor: "Admin", text: "Sees individual referral history with commission amounts" },
          { actor: "Admin", text: "Sees total unpaid/pending amount" },
          { actor: "Admin", text: "Transfers money manually to advisor's bank account" },
          { actor: "Admin", text: "Clicks 'Mark Paid' to record the payout" },
          { actor: "System", text: "Marks all pending commissions for that advisor as paid with timestamp" },
          { actor: "System", text: "Creates payout record in Firestore" },
          { actor: "System", text: "Sends payout processed email to advisor" },
        ]}
        email="Payout processed email to advisor with amount and date"
      />

      {/* Adding New Chapter */}
      <FlowCard
        title="Adding a New Chapter (Content)"
        steps={[
          { actor: "Admin", text: "Adds the Content Author as a collaborator on the GitHub repository" },
          { actor: "Content Author", text: "Goes to /keystatic on the live site → redirected to GitHub login → signs in with their GitHub account" },
          { actor: "Content Author", text: "Selects the correct collection — e.g., 'Class 6 Science Notes'" },
          { actor: "Content Author", text: "Clicks 'Create' → enters chapter slug (e.g., chapter-3-fibre-to-fabric), title, description, and order number" },
          { actor: "Content Author", text: "Writes the chapter notes using the visual MDX editor (headings, paragraphs, images)" },
          { actor: "Content Author", text: "(Optional) Goes to 'Worksheets' collection → creates worksheet with same slug, adds topics with MCQ / Fill / Short / Long questions by difficulty" },
          { actor: "System", text: "Practice buttons appear automatically next to chapter headings — the topic name in the worksheet must match (or closely overlap with) the ## heading in the notes. E.g., if notes have '## Fractions on a Number Line', name the worksheet topic 'Fractions on a Number Line' to get a Practice link" },
          { actor: "Content Author", text: "(Optional) Goes to 'Discussions' collection → creates Mother-Child dialogue with same slug" },
          { actor: "Content Author", text: "Clicks Save → Keystatic auto-creates a content branch (e.g., content/chapter-3-fibre-to-fabric) on GitHub" },
          { actor: "Content Author", text: "Can save multiple times (each save = a commit on the same branch), logout, and come back later — branch persists on GitHub" },
          { actor: "Content Author", text: "When all chapters are done → clicks 'Create Pull Request' in Keystatic" },
          { actor: "System", text: "Each author gets their own branch — no conflicts since they work on different class/subject folders" },
          { actor: "Content Author", text: "Goes to GitHub → clicks 'Merge pull request' to publish (or Admin merges if review is needed)" },
          { actor: "System", text: "Chapters are auto-discovered from the filesystem at build time — no code changes needed" },
          { actor: "System", text: "Vercel auto-deploys from master — chapter goes live on the site" },
        ]}
      />

      {/* Actor Legend */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Actor Legend
        </h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(actorStyles).map(([actor, style]) => (
            <span key={actor} className={`text-xs font-medium px-2 py-0.5 rounded ${style}`}>
              {actor}
            </span>
          ))}
        </div>
      </div>

      {/* Email Triggers */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Email Triggers Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase">
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Sent To</th>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">From</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="px-3 py-2 font-medium text-gray-700">Welcome</td>
                <td className="px-3 py-2 text-gray-500">New user</td>
                <td className="px-3 py-2 text-gray-500">First sign-in (account creation)</td>
                <td className="px-3 py-2 text-gray-400">noreply@cognilift.in</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="px-3 py-2 font-medium text-gray-700">Subscription Confirmed</td>
                <td className="px-3 py-2 text-gray-500">Student</td>
                <td className="px-3 py-2 text-gray-500">Payment verified successfully</td>
                <td className="px-3 py-2 text-gray-400">noreply@cognilift.in</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="px-3 py-2 font-medium text-gray-700">Commission Earned</td>
                <td className="px-3 py-2 text-gray-500">Advisor</td>
                <td className="px-3 py-2 text-gray-500">Referred student completes payment</td>
                <td className="px-3 py-2 text-gray-400">noreply@cognilift.in</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="px-3 py-2 font-medium text-gray-700">Payout Processed</td>
                <td className="px-3 py-2 text-gray-500">Advisor</td>
                <td className="px-3 py-2 text-gray-500">Admin clicks &quot;Mark Paid&quot;</td>
                <td className="px-3 py-2 text-gray-400">noreply@cognilift.in</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-gray-700">Email Verification</td>
                <td className="px-3 py-2 text-gray-500">Any user (email/password signup)</td>
                <td className="px-3 py-2 text-gray-500">Signup or &quot;Resend&quot; from advisor dashboard</td>
                <td className="px-3 py-2 text-gray-400">Firebase (noreply@project.firebaseapp.com)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Firestore Collections */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Firestore Collections
        </h3>
        <div className="space-y-3 text-sm">
          <CollectionRow
            name="users"
            description="All user accounts — students, advisors, admins. Stores profile, role, subscription status, bank details, emailVerified (synced from Firebase Auth), phoneVerified (set by admin)."
          />
          <CollectionRow
            name="subscriptions"
            description="Payment records. Each subscription links to a user, stores Razorpay IDs, referral info, commission amount, and paid status."
          />
          <CollectionRow
            name="referralCodes"
            description="Advisor referral codes (e.g., ADV-AB12X). Links to advisor UID, tracks total uses and active status."
          />
          <CollectionRow
            name="partnerApplications"
            description="Advisor applications. Stores name, email, phone, city, reason, status (pending/approved/rejected)."
          />
          <CollectionRow
            name="payouts"
            description="Payout records when admin marks commissions as paid. Links to advisor, stores amount, subscription IDs, and timestamps."
          />
          <CollectionRow
            name="platformConfig"
            description="Single doc (default) with trial days, yearly price, commission %, and referral discount %."
          />
          <CollectionRow
            name="adminLogs"
            description="Audit trail of admin actions — role changes, payouts, subscription extensions, phone verification."
          />
        </div>
      </div>

      {/* User Roles */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
          User Roles
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 py-2 border-b border-gray-50">
            <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded shrink-0">student</span>
            <p className="text-gray-500">Default role. Can access content during trial or active subscription.</p>
          </div>
          <div className="flex items-start gap-3 py-2 border-b border-gray-50">
            <span className="text-xs font-medium bg-purple-50 text-purple-600 px-2 py-0.5 rounded shrink-0">partner</span>
            <p className="text-gray-500">Advisor role (displayed as &quot;Advisor&quot; in UI). Can access advisor dashboard, share referral codes, earn commissions.</p>
          </div>
          <div className="flex items-start gap-3 py-2 border-b border-gray-50">
            <span className="text-xs font-medium bg-green-50 text-green-600 px-2 py-0.5 rounded shrink-0">teacher</span>
            <p className="text-gray-500">Teacher role. Full content access, no subscription required.</p>
          </div>
          <div className="flex items-start gap-3 py-2">
            <span className="text-xs font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded shrink-0">admin</span>
            <p className="text-gray-500">Full access. Can manage users, view all data, process payouts, change platform config.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const actorStyles: Record<string, string> = {
  Student: "bg-blue-50 text-blue-700",
  Admin: "bg-red-50 text-red-700",
  Advisor: "bg-purple-50 text-purple-700",
  System: "bg-gray-100 text-gray-700",
  "Content Author": "bg-teal-50 text-teal-700",
  Firebase: "bg-amber-50 text-amber-700",
  Razorpay: "bg-green-50 text-green-700",
};

interface Step {
  actor: string;
  text: string;
}

function FlowCard({
  title,
  steps,
  email,
}: {
  title: string;
  steps: Step[];
  email?: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
        {title}
      </h3>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className="shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <div className="flex items-start gap-2 pt-0.5">
              <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 ${actorStyles[step.actor] || actorStyles.System}`}>
                {step.actor}
              </span>
              <span className="text-gray-600">{step.text}</span>
            </div>
          </li>
        ))}
      </ol>
      {email && (
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          {email}
        </div>
      )}
    </div>
  );
}

function CollectionRow({ name, description }: { name: string; description: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <code className="shrink-0 text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{name}</code>
      <p className="text-gray-500">{description}</p>
    </div>
  );
}
