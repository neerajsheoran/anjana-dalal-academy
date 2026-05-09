export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Terms of Service</h1>
        <div className="prose prose-slate prose-sm max-w-none">
          <p className="text-sm text-gray-400 mb-6">Last updated: 1 May 2026</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By creating an account or using CogniLift (&quot;the Platform&quot;), you agree to these Terms of Service.
            If you are under 18 years of age, your parent or legal guardian must agree to these terms on your behalf.
          </p>

          <h2>2. Account Registration</h2>
          <p>
            You must provide accurate information during registration. You are responsible for maintaining the
            confidentiality of your account credentials. One account per person — sharing accounts is not permitted.
          </p>

          <h2>3. Use of Content</h2>
          <p>
            All content on CogniLift — including notes, worksheets, quizzes, images, and discussion material — is
            original and created for educational purposes. You may use it for personal learning only. You may not:
          </p>
          <ul>
            <li>Copy, redistribute, or republish any content from the Platform</li>
            <li>Use content for commercial purposes without written permission</li>
            <li>Scrape, download, or systematically extract content</li>
          </ul>

          <h2>4. Subscriptions and Payments</h2>
          <p>
            Free trial access is provided for a limited period after registration. After the trial ends, a paid
            subscription is required to access all content. Payments are processed through Razorpay. Subscription
            fees are non-refundable unless required by applicable law.
          </p>

          <h2>5. Free Content</h2>
          <p>
            The first two chapters of every subject in every class are available free of charge, without requiring
            login or subscription. This free access may be modified at our discretion.
          </p>

          <h2>6. Partner Program</h2>
          <p>
            Partners are independent referrers. CogniLift reserves the right to approve or reject partner
            applications and to modify commission structures with reasonable notice.
          </p>

          <h2>7. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Platform for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to other accounts or systems</li>
            <li>Upload harmful content, spam, or malware</li>
            <li>Misrepresent your identity or role (e.g., claiming to be a teacher for free access)</li>
          </ul>

          <h2>8. Termination</h2>
          <p>
            We may suspend or terminate your account if you violate these terms. You may delete your account at
            any time by contacting support.
          </p>

          <h2>9. Disclaimer</h2>
          <p>
            CogniLift is an independent educational platform. It is not affiliated with, endorsed by, or associated
            with NCERT, CBSE, or any government body. Content is created based on publicly available curriculum guidelines.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the Platform after changes constitutes
            acceptance of the revised terms.
          </p>

          <h2>11. Contact</h2>
          <p>
            For questions about these terms, contact us at{' '}
            <a href="mailto:support@cognilift.in">support@cognilift.in</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
