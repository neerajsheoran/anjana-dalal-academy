# CogniLift / Anjana Dalal Academy

CBSE learning platform for Classes 1–10 (Indian market, INR pricing) combined with a
brain-training section for kids aged 5–15. Next.js App Router, content-as-files, Firebase
for all user state.

Repo name is `anjana-dalal-academy`; the npm package and product name are `cognilift`.

## Commands

```bash
npm run dev      # next dev, bound to localhost explicitly (see package.json)
npm run build    # next build — run before committing anything non-trivial
npm run lint     # eslint
```

Scripts in `scripts/` are one-off maintenance tools (`.mjs`/`.ts`), not part of the build.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind v4** (`@tailwindcss/postcss`, no `tailwind.config.js` — config is in CSS)
- **Firebase** — Auth + Firestore. Client SDK in `lib/firebase.ts`, Admin SDK in `lib/firebase-admin.ts`
- **Keystatic** — CMS over the MDX files (`keystatic.config.ts`, mounted at `/keystatic`)
- **next-mdx-remote** + `remark-gfm` for chapter rendering
- **Razorpay** for payments (not Stripe — Indian market), **Resend** for email
- Deploys to **Vercel**

Env vars are documented in `.env.example`. Keystatic falls back to local filesystem mode
when the GitHub vars are absent.

## Content architecture

290 chapters live as files under `content/`, not in a database:

```
content/<classId>/<subjectId>/[<book>/]<chapter-slug>/
    index.mdx        # the chapter itself (frontmatter + body)
    discussion.mdx   # dialogue-format walkthrough
    review.mdx       # recap
    worksheet.json   # questions, grouped by topic then easy/medium/hard
```

- `classId` is `class-1` … `class-10`; `subjectId` is `maths` | `science` | `social-science`.
- The optional `<book>` level exists only where the NCERT source is split across physical
  books — currently Class 10 Social Science (History / Geography / Political Science /
  Economics). Flat subjects skip it. See `BookInfo` in `lib/types.ts`.
- Images live in `public/content-images/<classId>/...` and are referenced from MDX by bare
  filename (`![Alt](where-does-science-begin.png)`). They are served statically — do **not**
  route them through an API handler; that was reverted deliberately (commit 4500179) because
  it bundled the whole image set into the serverless function.

### chapterKey vs chapterId — the rule that matters most

Every chapter has two identifiers:

- **`chapterId`** — the URL slug. **Cosmetic. It can and does change** (e.g. when NCERT ships
  a new edition and chapters get renamed).
- **`chapterKey`** — a UUID v4 in the MDX frontmatter. **Stable forever.**

**Anything persisted in Firestore — quiz attempts, progress, bookmarks — must reference
`chapterKey`, never `chapterId`.** Otherwise a slug rename silently orphans user history.

When you *do* change a slug, add the old → new mapping to `lib/slug-redirects.ts`. The chapter
route consults that map before calling `notFound()` and issues a 301. Entries are kept forever.

Lookup helpers live in `lib/content.ts`: `getChapterByKey()`, `getChapter()`,
`getChapterInBook()`, `chapterUrl()`, `chapterContentPath()`.

### Discussion dialogue voices

`discussion.mdx` is written as a two-person dialogue. The speaker pair depends on class and
subject — this is a deliberate, partially-completed migration, so **match the surrounding
files rather than assuming**:

| Scope | Voice |
|---|---|
| Science, Classes 6–10 | **Meera / Arjun** (two friends investigating) — fully rolled out |
| Maths, all classes (1–10) | **Mother / Child** — not yet migrated |
| Social Science, Classes 6–8 | **Mother / Child** |
| Class 10 Social Science | **Mother / Child** (deliberate exception), with some legacy Mentor/Student |
| All subjects, Classes 1–5 | **Mother / Child** — stays this way by design |

## Routing

Two parallel entry points into the same content, both under `app/(site)/`:

- `class/[classId]/[subject]/[chapter]/` — class-first browsing
- `subject/[subjectId]/[classId]/[chapter]/` — subject-first browsing

Brain training sits at `brain/[module]/[activity]/`. Admin is `admin/`, partner-facing pages
are under `advisor/` (see naming note below).

## Firestore collections

`users` (with `children` and `children/{id}/attempts` as subcollections), `attempts`, `quizAttempts`, `progress`,
`bookmarks`, `subscriptions`, `referralCodes`, `notifications`, `supportRequests`,
`extensionRequests`, `answerFlags`, `partnerApplications`, `payouts`, `adminLogs`, `counters`.

### Roles and access

Roles seen in code: `admin`, `content-author`, `partner`, `teacher`, `student`.
`ContentAuthorPermissions` in `lib/types.ts` gates what a content author can see in admin.

Content gating is separate from roles — `ContentAccessLevel` is
`anonymous | trial | subscribed | expired | admin`, resolved by
`getContentAccessLevel(uid)` in `lib/subscription.ts`; use `hasFullAccess(level)` rather than
comparing strings at call sites.

### Child profiles (DPDP compliance)

Parent-owned account model: **kids never have their own Firebase Auth account.** Child
profiles are documents under the parent's user, first-name only (data minimisation), with
`consentGiven` required true at creation and PIN-protected profile switching (`lib/pin.ts`,
`lib/active-child.ts`). Do not add a child login path or collect a child's last name.

## Brain training

Three modules — **Memory**, **Focus**, **Thinking** (`lib/brain-modules.ts`). 14 activities
are registered in `BRAIN_ACTIVITIES`, each with a `minAge` that hides it from younger kids.
One React component per activity in `components/brain/` (e.g. `MemoryMatchActivity.tsx`).

Supporting logic: `lib/adaptive.ts` (difficulty adaptation), `lib/scoring.ts`,
`lib/daily-mission.ts`, `lib/achievements.ts`, `lib/insights.ts`, `lib/age-group.ts`,
`lib/brain-tiers.ts`.

To add an activity: register it in `BRAIN_ACTIVITIES`, add the component in
`components/brain/`, and copy the structure of an existing activity of the same module.

## Conventions

- **Define shapes in `lib/types.ts` first.** It is the central interface file and is heavily
  commented; new features add their types there before implementation.
- **User-facing copy says "Partner", never "Advisor".** The routes, files, and API paths still
  say `advisor` — that's Phase 1 (labels only). Don't write new user-visible "advisor" copy,
  and don't mass-rename the routes without being asked.
- Answer grading is layered (`lib/answer-matcher.ts`): case, punctuation, context-word
  repetition, and single-character typos are already handled. Only add
  `acceptedAlternatives` to a question for *semantic* variation — synonym, regional spelling,
  unit format.
- `next.config.ts` sets `Cross-Origin-Opener-Policy: same-origin-allow-popups` — required for
  Firebase popup auth. Don't tighten it.

## Working agreements

- **Discuss before implementing.** Default to recommendations and options for anything
  non-trivial; go straight to code only for pre-approved or one-line changes.
- **Never `git push` without explicit confirmation.** Committing locally is fine — pushing
  deploys to production via Vercel.

## Known content gaps

Missing source images, tracked but unresolved:

- Class 5 Science Ch 2 (Journey of a River) — 3 broken refs, no source files; Ch 10 has none
- Class 7 Science Ch 6 (Adolescence) — no source folder
- Class 8 Science Ch 10 (Light, Mirrors, and Lenses) — 3 unfilled placeholder refs
