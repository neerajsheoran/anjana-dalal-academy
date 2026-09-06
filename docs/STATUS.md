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
