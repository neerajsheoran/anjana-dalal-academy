export default function TechnicalDecisions() {
  return (
    <div className="space-y-6">
      {/* Search Architecture */}
      <DecisionCard
        title="Global Search Architecture"
        decision="Static JSON index built at deploy time, with client-side filtering"
        alternatives={[
          { option: "Algolia / Elasticsearch", reason: "Overkill for ~200 chapters, adds cost and external dependency" },
          { option: "Server-side API search", reason: "Adds latency per keystroke; not needed for small dataset" },
          { option: "Database-stored index", reason: "Content is in MDX files, not DB — would need sync logic" },
        ]}
        details={[
          "API route /api/search-index runs at build time (force-static)",
          "Reads all MDX files, extracts title, ## headings, and 300-char text snippet",
          "Returns JSON array — one entry per chapter with classLabel, subjectLabel, url",
          "SearchModal loads this JSON on first open (lazy), then filters entirely on client",
          "Matches against: title, class label, subject label, h2 headings, snippet text",
          "Shows 'Section: {heading}' when a heading matches — helps users find specific topics",
          "Auto-regenerates on every deploy — no manual reindex needed",
        ]}
        schema={searchSchema}
      />

      {/* Content Auto-Discovery */}
      <DecisionCard
        title="Content Auto-Discovery"
        decision="Filesystem-based chapter detection — no database or manifest file"
        alternatives={[
          { option: "Database-stored content", reason: "Would need CMS sync, migration scripts, backup strategy" },
          { option: "Manual chapter registry", reason: "Easy to forget updating; auto-discovery is zero-maintenance" },
          { option: "Headless CMS API", reason: "Adds latency, vendor lock-in, and cost" },
        ]}
        details={[
          "Pattern: content/[classId]/[subject]/[chapterId]/index.mdx",
          "getAllChapters() scans the filesystem at build time",
          "YAML frontmatter provides title, description, and order number",
          "New chapters appear automatically after merge — no code changes needed",
          "Keystatic CMS provides visual editor for non-technical content authors",
          "Each content author works on their own Git branch — no conflicts",
          "Images stored alongside MDX: content/[classId]/[subject]/[chapterId]/content/",
        ]}
        schema={contentStructure}
      />

      {/* Access Control */}
      <DecisionCard
        title="Access Control Model"
        decision="5-tier access levels checked server-side on every page load"
        alternatives={[
          { option: "Client-side gating only", reason: "Easily bypassed; content would leak in page source" },
          { option: "Middleware-based auth", reason: "Edge runtime can't access Firestore; would need JWT claims" },
          { option: "Role-based only (no tiers)", reason: "Need granular trial/subscription/expired distinction" },
        ]}
        details={[
          "anonymous → not logged in, sees limited preview content",
          "trial → logged in, within free trial period (configurable days)",
          "subscribed → paid subscription active (1 year from payment)",
          "expired → trial or subscription ended, prompted to subscribe",
          "admin → full access, can manage everything",
          "Checked via getContentAccessLevel() which reads Firestore user doc",
          "Admin can extend any user's access via adminExtendedUntil override",
          "hasFullAccess() returns true for trial, subscribed, and admin tiers",
        ]}
        schema={accessTiers}
      />

      {/* Listen / TTS */}
      <DecisionCard
        title="Listen / Text-to-Speech System"
        decision="Browser's built-in Web Speech API with custom auto-scroll and highlighting"
        alternatives={[
          { option: "Google Cloud TTS API", reason: "Better voice quality but costs per character, needs backend proxy" },
          { option: "Pre-generated audio files", reason: "Storage heavy, hard to update when content changes" },
          { option: "Third-party TTS widget", reason: "Adds external dependency; less control over UX" },
        ]}
        details={[
          "Uses window.speechSynthesis — free, works offline, no API keys needed",
          "DOM TreeWalker collects text blocks (P, LI, H1-H6, TD elements)",
          "Each block is spoken as one utterance — pauses naturally between paragraphs",
          "Active block gets yellow background highlight + smooth scroll to center",
          "Speed control: 0.75x, 1x, 1.25x, 1.5x via dropdown, takes effect immediately",
          "speedChangingRef pattern prevents cancel() from resetting state during speed change",
          "Spacebar keyboard shortcut for pause/resume while listening",
          "Progress bar shows percentage through all blocks",
          "Available on both Notes and Discussion tabs",
        ]}
      />

      {/* Bookmark & Progress */}
      <DecisionCard
        title="Bookmark & Progress Tracking"
        decision="Firestore subcollections under each user document"
        alternatives={[
          { option: "Single array field on user doc", reason: "Firestore doc size limit (1MB); hard to query across users" },
          { option: "Separate top-level collection", reason: "Needs composite indexes; subcollection is cleaner for per-user data" },
          { option: "localStorage only", reason: "Lost on device switch or browser clear; no cross-device sync" },
        ]}
        details={[
          "users/{uid}/bookmarks/{chapterId} — stores classId, subject, chapterTitle, createdAt",
          "users/{uid}/progress/{chapterId} — stores completed (boolean), subject, lastReadAt",
          "users/{uid}/quizAttempts/{attemptId} — stores score, total, percentage, difficulty, timestamp",
          "Bookmark toggle button appears on every chapter banner (yellow when active)",
          "Progress tracker auto-fires when user scrolls to bottom of chapter content",
          "Profile page aggregates all three subcollections for stats display",
          "Quiz history shows last 20 attempts ordered by timestamp",
        ]}
        schema={firestoreSubcollections}
      />

      {/* Image Pipeline */}
      <DecisionCard
        title="Image Pipeline"
        decision="Keystatic stores images in Git; API route serves them with caching"
        alternatives={[
          { option: "Upload to cloud storage (S3/GCS)", reason: "Adds infra; images would be separate from content versioning" },
          { option: "Next.js public/ folder", reason: "Would bloat the repo root; hard to organize per-chapter" },
          { option: "External image CDN", reason: "Cost, vendor dependency; Git-stored images get free Vercel CDN" },
        ]}
        details={[
          "MDX files live in content/[class]/[subject]/[chapter]/index.mdx",
          "Image files live in public/content-images/[class]/[subject]/[chapter]/image.png",
          "MDX references images as relative paths: ![alt](filename.png)",
          "MdxImage component rewrites the ref to /content-images/[class]/[subject]/[chapter]/[filename]",
          "Served directly by Vercel CDN — no API route, no serverless invocation",
          "Automatic long-lived Cache-Control (immutable) via Next.js static asset handling",
          "Missing images are silently hidden (returns null) — allows placeholder references in content",
          "URL-encoded filenames (spaces → %20) are decoded for filesystem lookup",
        ]}
      />

      {/* Worksheet & Quiz System */}
      <DecisionCard
        title="Worksheet & Practice Quiz System"
        decision="JSON-based worksheets with topic-heading matching for inline practice buttons"
        alternatives={[
          { option: "Separate quiz page per chapter", reason: "Less integrated; users leave the reading flow" },
          { option: "Quiz questions in MDX", reason: "Hard to parse interactively; JSON is easier for quiz engine" },
          { option: "Database-stored questions", reason: "Would need sync with content; Git storage keeps them together" },
        ]}
        details={[
          "Worksheets stored as worksheet.json alongside chapter MDX",
          "Each worksheet has topics[] with MCQ, fill-in-blank, short, and long questions",
          "Topic names matched to ## headings in notes — Practice button appears next to matching heading",
          "3 difficulty levels: Easy, Medium, Hard — user selects before starting",
          "Quiz attempts saved to Firestore: users/{uid}/quizAttempts/{attemptId}",
          "Results show score, percentage, correct/wrong breakdown",
          "Profile page shows quiz history with average score across all attempts",
        ]}
      />

      {/* Code Health Audit */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Code Health Audit
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Areas identified as over-engineered, error-prone, or low-value. Tracked here for future cleanup.
        </p>
        <div className="space-y-3">
          {codeHealthItems.map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
              <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                item.severity === "high" ? "bg-red-50 text-red-600" :
                item.severity === "medium" ? "bg-amber-50 text-amber-600" :
                "bg-gray-100 text-gray-500"
              }`}>
                {item.severity.toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{item.file}</p>
                <p className="text-sm text-gray-500 mt-1">{item.issue}</p>
                {item.fixed && (
                  <span className="inline-block mt-1 text-[10px] font-semibold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                    FIXED
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Tech Stack
        </h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <StackItem category="Framework" items={["Next.js 16 (App Router)", "React 19", "TypeScript"]} />
          <StackItem category="Styling" items={["Tailwind CSS", "Tailwind Typography plugin"]} />
          <StackItem category="Content" items={["Keystatic CMS (Git-based)", "MDX via next-mdx-remote", "Remark GFM (tables, strikethrough)"]} />
          <StackItem category="Backend" items={["Firebase Admin SDK (Auth + Firestore)", "Firebase Client SDK (Google OAuth)"]} />
          <StackItem category="Payments" items={["Razorpay (INR payments)", "Server-side signature verification"]} />
          <StackItem category="Email" items={["Resend (transactional emails)", "Firebase Email Verification"]} />
          <StackItem category="Hosting" items={["Vercel (auto-deploy from Git)", "Vercel Edge Network (CDN)"]} />
          <StackItem category="Speech" items={["Web Speech API (browser-native)", "No external TTS service"]} />
        </div>
      </div>

      {/* Deployment Flow */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Deployment Pipeline
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            { label: "Git Push", color: "bg-gray-100 text-gray-700" },
            { label: "→", color: "text-gray-300" },
            { label: "Vercel Build", color: "bg-blue-50 text-blue-700" },
            { label: "→", color: "text-gray-300" },
            { label: "MDX Compiled", color: "bg-green-50 text-green-700" },
            { label: "→", color: "text-gray-300" },
            { label: "Search Index Generated", color: "bg-purple-50 text-purple-700" },
            { label: "→", color: "text-gray-300" },
            { label: "Static Pages Built", color: "bg-amber-50 text-amber-700" },
            { label: "→", color: "text-gray-300" },
            { label: "Live on CDN", color: "bg-green-100 text-green-800" },
          ].map((step, i) =>
            step.label === "→" ? (
              <span key={i} className={`text-lg ${step.color}`}>{step.label}</span>
            ) : (
              <span key={i} className={`text-xs font-medium px-2.5 py-1 rounded-lg ${step.color}`}>
                {step.label}
              </span>
            )
          )}
        </div>
        <div className="mt-4 space-y-2 text-sm text-gray-500">
          <p>Content authors merge PR on GitHub → Vercel auto-detects → full rebuild → live in ~2 minutes</p>
          <p>Search index, chapter list, and static pages all regenerate automatically on every deploy</p>
          <p>No manual deployment steps, no SSH, no server restarts</p>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Environment Variables
        </h3>
        <div className="space-y-2 text-sm">
          <EnvGroup name="Firebase (Client)" vars={["NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"]} />
          <EnvGroup name="Firebase (Admin)" vars={["FIREBASE_SERVICE_ACCOUNT_KEY (JSON)"]} />
          <EnvGroup name="Razorpay" vars={["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]} />
          <EnvGroup name="Resend" vars={["RESEND_API_KEY"]} />
          <EnvGroup name="App" vars={["NEXT_PUBLIC_BASE_URL"]} />
        </div>
        <p className="mt-3 text-xs text-gray-400">
          All env vars are set in Vercel dashboard → Settings → Environment Variables. Never committed to Git.
        </p>
      </div>
    </div>
  );
}

/* ── Code Health data ── */

const codeHealthItems: { title: string; file: string; severity: "high" | "medium" | "low"; issue: string; fixed?: boolean }[] = [
  {
    title: "TTS: Fragile manual ref management",
    file: "components/content/DiscussionAudio.tsx",
    severity: "high",
    issue: "Uses 5 manual refs, recursive speak patterns, and speedChangingRef hack to suppress errors during speed changes. Web Speech API is browser-inconsistent and these layers mask failures silently.",
  },
  {
    title: "BookmarkButton: Silent error swallowing",
    file: "components/content/BookmarkButton.tsx",
    severity: "medium",
    issue: "All fetch errors caught with empty .catch(() => {}). Network failures leave user with loading spinner forever, no error feedback or retry option.",
    fixed: true,
  },
  {
    title: "DiscussionChat: Fragile regex parser",
    file: "components/content/DiscussionChat.tsx",
    severity: "medium",
    issue: "Custom regex casts match[1] to 'Mother' | 'Child' without validation. Any content typo breaks the parser silently with no fallback.",
  },
  {
    title: "BankDetailsForm: 40% duplicated rendering",
    file: "components/advisor/BankDetailsForm.tsx",
    severity: "medium",
    issue: "287 lines with read-only and edit views rendering the same fields twice. One unified form with conditional field disabling would cut it in half.",
  },
  {
    title: "content.ts: Dual chapter discovery",
    file: "lib/content.ts",
    severity: "medium",
    issue: "Both CHAPTERS (immediate) and getAllChapters() (lazy cached) call discoverChapters(). Could theoretically diverge. Only one is needed.",
    fixed: true,
  },
  {
    title: "ChapterTabs: Fuzzy topic matching",
    file: "components/content/ChapterTabs.tsx",
    severity: "medium",
    issue: "Uses 3 matching strategies (exact, substring, word overlap) to link worksheet topics to headings. Papers over the real problem: topics and headings aren't explicitly linked in schema.",
  },
  {
    title: "Two-page quiz flow",
    file: "app/(site)/quiz-start/ + app/(site)/quiz/",
    severity: "low",
    issue: "/quiz-start → /quiz is two pages for no clear reason. Could be one page with wizard step.",
  },
  {
    title: "LottieIcon.tsx: Dead code",
    file: "components/LottieIcon.tsx",
    severity: "low",
    issue: "Imported nowhere in the codebase. Unused component.",
    fixed: true,
  },
  {
    title: "Email templates: Boilerplate duplication",
    file: "lib/email.ts",
    severity: "low",
    issue: "4 email functions duplicate HTML boilerplate (header, signature, styling). Adding a new email type means copying 20+ lines.",
  },
  {
    title: "SearchModal: Full index in memory",
    file: "components/layout/SearchModal.tsx",
    severity: "low",
    issue: "Loads all chapters into client memory. Fine for ~200 chapters but will degrade at 1000+. Consider server-side search if content grows significantly.",
  },
];

/* ── Schema display data ── */

const searchSchema = [
  { field: "id", type: "string", desc: "Chapter slug (e.g., chapter-1-knowing-our-numbers)" },
  { field: "title", type: "string", desc: "Chapter title from frontmatter" },
  { field: "classId", type: "string", desc: "e.g., class-6" },
  { field: "classLabel", type: "string", desc: "e.g., Class 6" },
  { field: "subject", type: "string", desc: "maths or science" },
  { field: "subjectLabel", type: "string", desc: "Mathematics or Science" },
  { field: "headings", type: "string[]", desc: "All ## headings extracted from MDX" },
  { field: "snippet", type: "string", desc: "First 300 chars of body text (markdown stripped)" },
  { field: "url", type: "string", desc: "/class/{classId}/{subject}/{chapterId}" },
];

const contentStructure = [
  { field: "content/", type: "dir", desc: "Root content directory" },
  { field: "  [classId]/", type: "dir", desc: "e.g., class-6, class-7, ... class-10" },
  { field: "    [subject]/", type: "dir", desc: "maths or science" },
  { field: "      [chapterId]/", type: "dir", desc: "e.g., chapter-1-knowing-our-numbers" },
  { field: "        index.mdx", type: "file", desc: "Chapter notes (YAML frontmatter + MDX body)" },
  { field: "        discussion.mdx", type: "file", desc: "Mother-child dialogue (optional)" },
  { field: "        worksheet.json", type: "file", desc: "Practice questions by topic (optional)" },
  { field: "        content/", type: "dir", desc: "Images referenced in MDX" },
];

const accessTiers = [
  { field: "anonymous", type: "tier", desc: "Not logged in — limited preview, prompted to sign in" },
  { field: "trial", type: "tier", desc: "Logged in, within free trial window (configurable days)" },
  { field: "subscribed", type: "tier", desc: "Paid subscription active (1 year validity)" },
  { field: "expired", type: "tier", desc: "Trial or subscription ended — prompted to subscribe" },
  { field: "admin", type: "tier", desc: "Full access to everything including admin dashboard" },
];

const firestoreSubcollections = [
  { field: "bookmarks/{chapterId}", type: "subcollection", desc: "classId, subject, chapterTitle, createdAt" },
  { field: "progress/{chapterId}", type: "subcollection", desc: "completed, subject, lastReadAt" },
  { field: "quizAttempts/{id}", type: "subcollection", desc: "score, total, percentage, difficulty, chapterTitles, timestamp" },
];

/* ── Sub-components ── */

interface Alternative {
  option: string;
  reason: string;
}

interface SchemaField {
  field: string;
  type: string;
  desc: string;
}

function DecisionCard({
  title,
  decision,
  alternatives,
  details,
  schema,
}: {
  title: string;
  decision: string;
  alternatives: Alternative[];
  details: string[];
  schema?: SchemaField[];
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">
        {title}
      </h3>
      <p className="text-sm font-semibold text-gray-800 mb-4 flex items-start gap-2">
        <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
          ✓
        </span>
        {decision}
      </p>

      {/* Why not alternatives */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Alternatives Considered
        </p>
        <div className="space-y-1.5">
          {alternatives.map((alt, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[10px]">
                ✕
              </span>
              <div>
                <span className="font-medium text-gray-600">{alt.option}</span>
                <span className="text-gray-400"> — {alt.reason}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          How It Works
        </p>
        <ul className="space-y-1.5">
          {details.map((detail, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-600">
              <span className="shrink-0 text-blue-400 mt-1">•</span>
              {detail}
            </li>
          ))}
        </ul>
      </div>

      {/* Schema table */}
      {schema && schema.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Schema / Structure
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase">
                  <th className="px-3 py-1.5">Field</th>
                  <th className="px-3 py-1.5">Type</th>
                  <th className="px-3 py-1.5">Description</th>
                </tr>
              </thead>
              <tbody>
                {schema.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-1.5 font-mono text-xs text-gray-700 whitespace-pre">{row.field}</td>
                    <td className="px-3 py-1.5 text-xs text-gray-400">{row.type}</td>
                    <td className="px-3 py-1.5 text-gray-500">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StackItem({ category, items }: { category: string; items: string[] }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{category}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-700">{item}</li>
        ))}
      </ul>
    </div>
  );
}

function EnvGroup({ name, vars }: { name: string; vars: string[] }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="shrink-0 text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
        {name}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {vars.map((v, i) => (
          <code key={i} className="text-xs font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
            {v}
          </code>
        ))}
      </div>
    </div>
  );
}
