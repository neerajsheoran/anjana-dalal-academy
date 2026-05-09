export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Privacy Policy</h1>
        <div className="prose prose-slate prose-sm max-w-none">
          <p className="text-sm text-gray-400 mb-6">Last updated: 1 May 2026</p>

          <h2>1. Information We Collect</h2>
          <p>When you use CogniLift, we collect:</p>
          <ul>
            <li><strong>Account information:</strong> Name, email address, and login method (Google or email/password)</li>
            <li><strong>Usage data:</strong> Chapters visited, quiz scores, worksheet progress, and bookmarks</li>
            <li><strong>Payment information:</strong> Processed securely by Razorpay — we do not store card details</li>
            <li><strong>Support requests:</strong> Messages and ticket history</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use your data to:</p>
          <ul>
            <li>Provide and improve the learning experience</li>
            <li>Track your progress and quiz scores</li>
            <li>Send account-related emails (verification, password reset, subscription confirmation)</li>
            <li>Respond to support requests</li>
            <li>Prevent fraud and abuse</li>
          </ul>

          <h2>3. What We Do Not Do</h2>
          <ul>
            <li>We do <strong>not</strong> sell your personal data to third parties</li>
            <li>We do <strong>not</strong> show advertisements</li>
            <li>We do <strong>not</strong> share your data with other students, parents, or schools unless you explicitly opt in</li>
          </ul>

          <h2>4. Data Storage and Security</h2>
          <p>
            Your data is stored securely using Google Firebase (Firestore and Firebase Authentication), hosted on
            Google Cloud infrastructure. We use HTTPS encryption for all data in transit and follow industry-standard
            security practices.
          </p>

          <h2>5. Children&apos;s Data and Parental Consent</h2>
          <p>
            CogniLift offers brain training for kids aged 5–15 through a{' '}
            <strong>parent-owned account model</strong>. Children do <strong>not</strong> create
            their own accounts. The parent or legal guardian (18 or older) holds the account
            and is the data controller for their child&apos;s data, in line with India&apos;s
            Digital Personal Data Protection Act (DPDP).
          </p>
          <p>For each child profile created under a parent account, we store only:</p>
          <ul>
            <li>First name (no surname)</li>
            <li>Age</li>
            <li>Activity attempts and brain-training scores (Phase 2 onward)</li>
            <li>A timestamp confirming the parent&apos;s consent at profile creation</li>
          </ul>
          <p>We do <strong>not</strong> collect or store:</p>
          <ul>
            <li>Photographs or images of children</li>
            <li>School name, class, or contact information for children</li>
            <li>Behavioural profiles for any purpose other than brain training</li>
            <li>Any data that is shared with third parties or used for advertising</li>
          </ul>
          <p>
            Profile switching is gated by a 4-digit Parent PIN set on first child profile
            creation. This prevents the child from changing settings, switching profiles, or
            accessing payment screens.
          </p>
          <p>
            <strong>Your rights as parent or guardian:</strong>
          </p>
          <ul>
            <li>
              <strong>Right to access:</strong> view all data stored about your child via your
              profile dashboard
            </li>
            <li>
              <strong>Right to delete:</strong> remove a child&apos;s profile (and all their
              attempts/scores) at any time from your profile dashboard
            </li>
            <li>
              <strong>Right to withdraw consent:</strong> deleting the profile is treated as
              full withdrawal of consent
            </li>
          </ul>
          <p>
            If you believe a child&apos;s profile has been created without verified parental
            consent, contact us at{' '}
            <a href="mailto:support@cognilift.in">support@cognilift.in</a> and we will delete
            it within 30 days.
          </p>

          <h2>6. Cookies</h2>
          <p>
            We use a session cookie to keep you logged in. We do not use tracking cookies, advertising cookies, or
            third-party analytics that track individual users.
          </p>

          <h2>7. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul>
            <li><strong>Google Firebase:</strong> Authentication and data storage</li>
            <li><strong>Razorpay:</strong> Payment processing</li>
            <li><strong>Resend:</strong> Transactional emails</li>
            <li><strong>Vercel:</strong> Website hosting</li>
          </ul>
          <p>Each service has its own privacy policy governing their handling of your data.</p>

          <h2>8. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Withdraw consent at any time by deleting your account</li>
          </ul>

          <h2>9. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. If you delete your account or request deletion,
            we remove your personal data within 30 days. Anonymized support tickets may be retained for service improvement.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. We will notify users of significant changes via email or
            an in-app notice.
          </p>

          <h2>11. Contact</h2>
          <p>
            For privacy-related questions or data requests, contact us at{' '}
            <a href="mailto:support@cognilift.in">support@cognilift.in</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
