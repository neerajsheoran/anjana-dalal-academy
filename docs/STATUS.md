# Status — work in progress

Running scratchpad of *state*, not rules. Rules live in `CLAUDE.md`; this file
records where things were left off, what is half-finished, and what decisions are
still open.

**Update this at the end of a working session.** A chat transcript is not storage —
if it is only in the conversation, it is already lost.

Last updated: 2026-09-07

---

## Open decisions

### Cream + blue palette rebrand — UNDECIDED
`app/(site)/design/palette/page.tsx` is a hidden, unlinked route that renders
representative parent-mode surfaces in both the current palette and a proposed
cream + blue professional palette, side by side for comparison.

- **Status:** built, reviewed, but the decision was never recorded and has since
  been forgotten.
- **Next step:** open `/design/palette` in dev, pick one, then either ship the
  rebrand or delete the folder (the file's own header comment confirms nothing
  else references it).
- Do not let this sit undecided again — record the outcome here the same day.

---

## Stale / do not run

### `scripts/rename-class1-5.mjs` — BROKEN, do not run
Rewrites `title:` frontmatter for Classes 1–5 from a hardcoded path→title map.

Every path in its map is stale. Verified 2026-09-07:

| Script expects | Actually on disk |
|---|---|
| `class-1/maths/chapter-1-finding-the-furry-cat` | `chapter-1-position-play` |
| `class-1/maths/chapter-2-what-is-long-what-is-round` | `chapter-2-shape-fun` |
| `class-2/maths/chapter-1-a-day-at-the-beach` | *(no such folder)* |

Running it today is a no-op — every entry hits `SKIP (not found)`. It is kept only
as a record of the intended title wording. **Repoint the map at real folder names
before ever running it**, and confirm those titles are still wanted.

---

## Debug tools (safe, committed)

- `scripts/check-subscription.mjs` — look up a user by email, print subscription state.
- `scripts/delete-pin.mjs` — clear a parent PIN so `/profile` shows the empty-PIN flow.

Both use the same `FIREBASE_ADMIN_*` env vars as the app. They touch live data —
read the file before running.

---

## Known content gaps

Tracked in `CLAUDE.md` under "Known content gaps" (missing source images for
Class 5 Science, Class 7 Science Ch 6, Class 8 Science Ch 10). Unresolved.

---

## Landing page — reviewed 2026-09-07, fixes parked

Reviewed the anonymous (logged-out) landing page `app/(site)/page.tsx`.
Structure is sound — three pillars (Learn / Train / Apply), all reachable with no
auth wall, plus a live `PatternRecallDemo` as the hook. **Do not rebuild it.**
The following were agreed as worth doing but deferred; revisit before launch.

### 1. BUG — trial length contradicts itself (highest priority)
`app/(site)/page.tsx:200` hardcodes **"3-day free trial"**. Every other surface
reads `config.trialDays`, which defaults to **30**:

| Where | Value |
|---|---|
| `app/(site)/page.tsx:200` | "3-day" — hardcoded |
| `app/(site)/brain/BrainHome.tsx:193` | `config.trialDays` → 30 |
| `app/(site)/brain/daily/page.tsx:133` | `config.trialDays` → 30 |
| `lib/email.ts:28` (welcome email) | 30 |
| `app/api/auth/session/route.ts:50` (actually granted) | 30 |

A parent reads "3 days", signs up, and is emailed "30 days". Undersells the offer
10x and reads as sloppy. Fix: read `config.trialDays` like every other surface.

### 2. Content gaps in the anonymous pitch
- **No price anywhere on the landing page.** ₹999/year is the pitch for a parent
  comparing against tuition; making them find `/pricing` is a conversion leak.
- **Undersells the catalogue** — Learn card says "200+ chapters"; there are 290.
- **No trust signals** — no CBSE/NCERT alignment line, no testimonials, no counts.
- **Safety story is invisible** — parent-owned accounts, no child login, first-name
  only, PIN-protected switching, DPDP by design. A real differentiator, unmentioned.

### 3. Structural
- **Apply pillar says "coming soon"** in the hero — a third of the top row is a
  promise, not a product. Consider demoting it below the fold until it ships.
- **"How it works" is brain-training-only** (5 steps of a brain session) but sits
  under a hero that is two-thirds academics. A parent who came for CBSE chapters
  finds nothing about chapters.

### 4. Chapter gating — no change needed
Free = `chapter.order <= 2` per subject per class
(`app/(site)/class/[classId]/[subject]/page.tsx:221`) — 50 free chapters of 290.
Generous enough to prove quality, good indexable SEO surface, and the lock badge
says "Sign up free" rather than anything about money. **Keep as is.**

### 5. CBSE/NCERT naming — cleared, safe to proceed
Checked 2026-09-07. Not legal advice; confirm with an Indian IP lawyer pre-launch.

- **Copyright — low risk.** Chapter prose is original (own characters, own Indian
  context), not adapted from NCERT. All 1,003 images under `public/content-images`
  are generated, not scanned. A syllabus itself is not copyrightable — topics and
  their sequence are facts, not expression. Chapter titles have already been moved
  off NCERT's own wording (see the stale rename script above).
- **Trademark — usable descriptively.** Naming a curriculum you align with is
  nominative fair use. The line is *endorsement*.
  - Safe: "Aligned with the CBSE curriculum", "Follows the NCERT syllabus",
    "For CBSE students, Classes 1–10", "Independently developed".
  - Avoid: "CBSE-approved / certified / authorised", "Official partner", and
    **never** the CBSE or NCERT logo, crest, or colours.
- Disclaimer already present in `components/layout/Footer.tsx:96` and
  `app/(site)/terms/page.tsx:69`. Keep it on every page.

---

## Domain launch — cognilift.in (in progress, started 2026-09-07)

Domain bought at **GoDaddy**. Vercel project already deployed on a `*.vercel.app`
URL. `lib/email.ts:7` already sends from `noreply@cognilift.in`, so Resend
verification is a prerequisite, not an afterthought — until it is green, welcome
emails silently fail.

### Done in-repo
- `lib/site.ts` — `SITE_URL`, single source of truth, reads `NEXT_PUBLIC_SITE_URL`
  and falls back to `https://cognilift.in`.
- `app/layout.tsx` — added `metadataBase` + Open Graph / Twitter defaults. Without
  `metadataBase` Next emits relative OG URLs and WhatsApp shares render with no
  preview card; parent-to-parent WhatsApp sharing is a primary channel here.
- `app/sitemap.ts` — ~333 URLs (11 static + 10 class + 22 class/subject + 290
  chapters). Lists only the class-first URL from `chapterUrl()`; the parallel
  `/subject/...` route is deliberately excluded to avoid duplicate content.
- `app/robots.ts` — blocks `/api`, `/admin`, `/keystatic`, `/design`, `/advisor`,
  and the per-user routes.
- `.env.example` — documents `NEXT_PUBLIC_SITE_URL`.

### External dashboards — NOT done, must be done by hand
1. **Vercel → Settings → Domains** — add `cognilift.in`. Prefer A/CNAME records
   over moving nameservers, so MX records stay under your control at GoDaddy.
   GoDaddy: `A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`.
   Confirm Vercel's current values rather than trusting these verbatim.
2. **Firebase → Authentication → Settings → Authorized domains** — add
   `cognilift.in`. **Login breaks entirely without this.** Keep the
   `Cross-Origin-Opener-Policy: same-origin-allow-popups` header in
   `next.config.ts` — popup auth depends on it.
3. **Resend → Domains** — verify `cognilift.in` (DKIM/SPF TXT records at GoDaddy).
4. **Razorpay → Webhooks** — repoint at `https://cognilift.in/...`.
5. **Vercel env** — set `NEXT_PUBLIC_SITE_URL=https://cognilift.in` in Production.
6. **Google Search Console** — verify the domain, submit `/sitemap.xml`.
