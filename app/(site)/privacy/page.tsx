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

          <h2>5. Children&apos;s Privacy</h2>
          <p>
            CogniLift is designed for students of all ages, including children under 13. We collect only the minimum
            information necessary for the service to function. If you are a parent or guardian and believe your child
            has provided personal information without your consent, please contact us and we will delete it promptly.
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
