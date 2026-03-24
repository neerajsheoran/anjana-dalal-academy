export default function SystemFlows() {
  return (
    <div className="space-y-6">
      {/* Student Signup */}
      <FlowCard
        title="Student Signup"
        steps={[
          "Student visits the site and clicks Sign In",
          "Signs in with Google or Email/Password",
          "System creates user doc in Firestore with role = 'student' and emailVerified status",
          "If email/password signup: Firebase sends email verification link automatically",
          "Free trial starts (configurable days from Platform Config)",
          "Welcome email sent to student",
          "Student gets full access during trial period",
        ]}
        email="Welcome email with trial info"
      />

      {/* Subscription & Payment */}
      <FlowCard
        title="Subscription & Payment"
        steps={[
          "Student's trial expires (or they choose to subscribe early)",
          "Student clicks Subscribe and optionally enters a referral code",
          "If referral code is valid: discount is applied to price",
          "Razorpay payment page opens, student completes payment",
          "System verifies payment signature and creates subscription record",
          "User's subscription status updated to 'active' for 1 year",
          "Referral code usage counter incremented",
          "Subscription confirmation email sent to student",
        ]}
        email="Subscription confirmed email with amount and validity"
      />

      {/* Referral & Commission */}
      <FlowCard
        title="Referral & Commission"
        steps={[
          "Student uses an advisor's referral code while subscribing",
          "Student gets a discount (configured in Platform Config)",
          "Commission is calculated on the paid amount (% from Platform Config)",
          "Commission record saved with the subscription (commissionPaid = false)",
          "Advisor receives email notification about the new commission earned",
          "Commission appears as 'Pending' on advisor's dashboard",
        ]}
        email="Commission earned email to advisor with student name and amount"
      />

      {/* Advisor Onboarding */}
      <FlowCard
        title="Advisor Onboarding"
        steps={[
          "Person visits /advisor and fills the application form (name, email, phone, city, reason)",
          "Application saved in Firestore as 'pending'",
          "Admin sees the application in Advisors tab under 'Pending Applications'",
          "Admin clicks Approve or Reject",
          "If approved: a unique referral code (ADV-XXXXX) is generated",
          "When the approved person signs in with Google (same email), they get role = 'partner'",
          "Advisor sees their dashboard at /advisor/dashboard with referral code",
          "Advisor provides bank details (Account Holder, Bank Name, Account No., IFSC, PAN)",
          "Advisor verifies email (Firebase sends verification link on signup; resend available from dashboard)",
          "Admin manually verifies advisor's phone number (calls/WhatsApp, then marks verified in admin panel)",
        ]}
      />

      {/* Advisor Dashboard */}
      <FlowCard
        title="Advisor Dashboard"
        steps={[
          "Advisor logs in and goes to /advisor/dashboard",
          "Sees stats: Total Referrals, Total Earnings, Pending Payout, Paid Out",
          "Sees verification status: Email (Verified/Not Verified with resend option) and Mobile (Verified/Pending admin verification)",
          "Sees their referral code with copy button",
          "Sees bank details section (read-only, editable on click)",
          "Sees referral history table: Date, Student Name, Amount, Commission, Status (Paid/Pending with date)",
          "Sees payout history: past payouts processed by admin",
        ]}
      />

      {/* Admin Payout */}
      <FlowCard
        title="Admin Payout Process"
        steps={[
          "Admin goes to Advisors tab and clicks on an advisor row to expand",
          "Sees verification status: Email (auto-synced from Firebase) and Phone (with Mark Verified/Unverified toggle)",
          "Sees advisor's bank details (Account Holder, Bank, Account, IFSC, PAN)",
          "Sees individual referral history with commission amounts",
          "Sees total unpaid/pending amount",
          "Admin transfers money manually to advisor's bank account",
          "Admin clicks 'Mark Paid' to record the payout",
          "All pending commissions for that advisor are marked as paid with timestamp",
          "Payout record created in Firestore",
          "Advisor receives payout processed email",
        ]}
        email="Payout processed email to advisor with amount and date"
      />

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
            description="Audit trail of admin actions — role changes, payouts, subscription extensions."
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

function FlowCard({
  title,
  steps,
  email,
}: {
  title: string;
  steps: string[];
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
            <span className="text-gray-600 pt-0.5">{step}</span>
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
