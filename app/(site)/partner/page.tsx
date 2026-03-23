import PartnerForm from '@/components/partner/PartnerForm';

export default function PartnerPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-indigo-200 text-sm font-semibold uppercase tracking-widest mb-3">
            Partner Program
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Become a Partner
          </h1>
          <p className="text-indigo-100 text-lg max-w-xl mx-auto">
            Help students across India learn better. Refer families to
            CogniLift and grow with us.
          </p>
        </div>
      </section>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          How it works
        </h2>
        <p className="text-gray-400 text-center text-sm mb-10">
          Three simple steps to get started
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Step
            number="1"
            title="Apply"
            description="Fill in the form below with your details. We'll review your application within 48 hours."
          />
          <Step
            number="2"
            title="Get Approved"
            description="Once approved, you'll get partner access with your own referral tools and dashboard."
          />
          <Step
            number="3"
            title="Share & Earn"
            description="Share CogniLift with students and families. Earn commission on every referral."
          />
        </div>

        {/* Benefits */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Why partner with us?
        </h2>
        <p className="text-gray-400 text-center text-sm mb-10">
          Benefits of joining the partner program
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          <Benefit
            title="Commission on Referrals"
            description="Earn a percentage on every student subscription you bring in."
          />
          <Benefit
            title="Quality Content"
            description="NCERT-aligned content for Classes 1-12, with worksheets and quizzes already built."
          />
          <Benefit
            title="Growing Platform"
            description="Be part of a platform that's actively expanding — more subjects, classes, and features."
          />
          <Benefit
            title="Support & Training"
            description="Get onboarding support and marketing materials to help you succeed."
          />
        </div>

        {/* Application Form */}
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
            Apply Now
          </h2>
          <p className="text-gray-400 text-center text-sm mb-8">
            Fill in your details and we&apos;ll get back to you
          </p>

          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <PartnerForm />
          </div>
        </div>
      </div>
    </main>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xl flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function Benefit({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-base font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
