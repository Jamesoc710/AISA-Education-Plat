# AISA Atlas — Vibe Coding Audit

**Generated:** 2026-04-20
**Method:** Static code inventory + Playwright rendered audit (desktop 1440px, mobile 390px) across 11 routes
**Artifacts:** `docs/audit-screenshots/*.png`, `docs/audit-screenshots/findings.json`, `scripts/audit/run-audit.ts`

---

## Executive summary

AISA Atlas is **not a default-shadcn vibe-coded site**. The stack reveals deliberate rejections of the usual defaults: Phosphor icons (not Lucide), inline React styles with CSS custom properties (not Tailwind utility soup), a 16-token pastel tile palette (not neutral/zinc), a `StatusTag` primitive whose own source comment names itself "the pill-killer," underline-active filter tabs (not pill chips), and only a single gradient anywhere in the codebase. The hero patterns, grids, and copy also dodge most of the stock AI tells — asymmetric `3fr 2fr` layouts, natural-voice empty states ("You're caught up," "Nothing to resume yet"), and specific subtitles like `"What's on your plate"` rather than `"Powerful tools to help you learn faster."`

Where the vibe-coded fingerprint does show up, it is in **execution discipline, not aesthetic judgement**. The inline-style workflow has metastasized — there are **161 `borderRadius: N` declarations across 30 files using at least 15 distinct numeric values**, the `Card` primitive has **zero importers** (every card surface is reimplemented inline), and the rendered concept-detail page ships with **9 distinct border-radius values and 12 distinct font sizes on a single page**. Seven cards are visually nested inside other cards on that same page. There is no radius token scale in `globals.css`, no type ramp, and most rendered divergence traces back to those missing primitives. On top of that sit two genuine accessibility bugs: **17 `<label>` elements have zero `htmlFor` attributes** (every form input is unassociated), and the light theme's `--color-text-3: #9C9CA3` over `--color-bg: #FAF9F5` produces ~2.5:1 contrast, which drove **20 axe-core color-contrast failures per page on Browse, Concept-Detail, and Calendar**.

**Vibe-coded score: 3/10.** The bones are good. The problem is not that someone asked an LLM for a landing page — it's that the system's own primitives are under-used, so discipline collapses at the inline-style layer even though the design thinking above it is coherent.

---

## Per-category findings

### A. The shape problem

#### A1. Card overuse & nesting
- **Card primitive (`components/ui/card.tsx`) has 0 importers.** The file defines a `Card` component with `radius={14}` default and interactive hover behavior, but a grep for `<Card[\s/>]` returns no matches in any component. It is dead code. Every card surface in the app is reimplemented inline.
- **Inline card reimplementation count: ~82** — derived from `boxShadow: "var(--shadow-card)"` + `border: "1px solid var(--color-border)"` + `borderRadius: N` ad-hoc patterns across 30 files.
- **Rendered nested-card count on concept-detail: 7** (of 10 detected card patterns). This is the worst page in the audit. See `docs/audit-screenshots/concept-detail-desktop.png`.
- Evidence — `components/home-client.tsx:645-672` reimplements the card shell for bookmark rows including hover behavior that already exists in `ui/card.tsx`:
  ```tsx
  <Link style={{
    padding: "14px 16px",
    borderRadius: 12,
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    boxShadow: "var(--shadow-card)",
    transition: "box-shadow 120ms ease, transform 120ms ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = "var(--shadow-card-hover)";
    e.currentTarget.style.transform = "translateY(-1px)";
  }}
  ```
  This exact behavior is what `ui/card.tsx` provides via `interactive` prop.

#### A2. Pill/bubble overuse
- **Rendered `rounded-full` elements across all public routes: 3 (all on `/calendar`)** — almost certainly the day-of-week circles. The `roundedFull` pill pattern is effectively absent from user-facing surfaces.
- The codebase has **7 occurrences of `borderRadius: 999`** in source, concentrated in the avatar/profile path and the quiz-client. None are decorative tag pills.
- `components/ui/status-tag.tsx:1` ships with a comment: `"Squared status tag — the pill-killer. Compact rectangle (r=3) with semantic tones"`. **StatusTag is used 70 times across 16 files.** The pill-killer is the default label primitive.
- **Verdict:** not a vibe-tell. This is one of the codebase's genuine design wins.

#### A3. Border radius inventory
- **Static: 161 `borderRadius: <n>` declarations across 30 files**, using at least **15 distinct numeric values**: `1, 1.5, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 22, 999`.
- **Rendered: 13 distinct computed radii** appear across the 5 reachable pages combined. Concept-detail alone ships **9 radii in one page** (`1px, 1.5px, 5px, 6px, 8px, 9px, 10px, 12px, 16px`).
- There is **no `--radius-*` token defined anywhere in `app/globals.css`**. The only radius tokens are `border-radius: 3px` on the scrollbar and `border-radius: 6px` on `.skeleton`. Everything else is a magic number typed inline.
- **Breakdown of most-used values (source):** `8` (27), `10` (22), `12` (34+), `6` (14), `4` (12). The concentration suggests an implicit scale of ~4 values exists in the author's head — but it is not enforced.
- **Notable outliers:** `borderRadius: 22` at `components/feedback-dialog.tsx:235`, `borderRadius: 1.5` at `components/concept-body.tsx:182`, `borderRadius: 7` at `components/dashboard-client.tsx:291`. No principle distinguishes a 7 from an 8.

#### A4. Container monotony / section separation
- Section separation vocabulary actually in use:
  1. **Bordered panel** (the unnamed inline card) — dominant.
  2. **Vertical flex with gap** — used on Browse for section rows (see `globals.css:245-249` `.browse-sections { flex-direction: column; gap: 10px }`).
  3. **Horizontal rule / divider** — rare; Browse footer, bottom of Home's panels.
  4. **IconTile + inline header pair** — used as a quasi-section-break on Browse and Home.
  5. **Full-bleed colored panel or imagery** — absent.
- The codebase is mostly cards-on-a-page with the occasional underline-active nav. No hero image, no editorial bleed, no background variation.

---

### B. The Tailwind/shadcn fingerprint

#### B5. Default shadcn theme leakage
- **Not present.** The stack does not use shadcn at all — no `@radix-ui/*`, no `class-variance-authority`, no `tailwind-merge`, no `ui/*.tsx` generated by `shadcn init`. `app/globals.css` uses Tailwind 4's `@theme inline {}` block, not the v3 `tailwind.config.js` pattern.
- The OKLCH defaults (`--background: oklch(1 0 0)` etc.) are absent. The palette is custom: `#FAF9F5` warm off-white bg, `#1F1F22` near-black text, `#5E6AD2` indigo accent. 16 pastel `--tile-*-bg/fg` pairs for section tiles.

#### B6. Typography
- **One typeface rendered: Inter**, with Geist as fallback. No display font, no serif for long-form, no mono in user-facing copy beyond `var(--font-geist-mono)` registered but never invoked.
- **Rendered font-size scale (union across all public pages): 14 distinct values** — `10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14.5, 15, 16, 17, 18, 26, 30, 32, 36` (px). Concept-detail alone: 12 sizes. Calendar: 11 sizes. This is not a modular scale — it is whatever number the author typed inline at each call site.
- **Font weights rendered: 7 distinct values** on concept-detail (`400, 450, 500, 550, 600, 650, 700`). Most pages use 4 (`400, 450, 500, 600`), which is reasonable. The 550/650/700 outliers are concept-detail-specific quirks.
- **Verdict:** the font *choice* is the Tailwind default everybody ships. The font *scale* is the problem.

#### B7. Lucide/Phosphor
- **Phosphor icons (`@phosphor-icons/react` v2.1.10)**, not Lucide. `components/ui/icon.tsx` wraps 80+ Phosphor icons with `regular` weight default.
- Icons have consistent treatment: `size={16|17|18|20|24}` in most places, stroke not directly tunable (Phosphor uses weight variants).
- **Sparkle is registered but never invoked.** `components/ui/icon.tsx` maps `"sparkles": Sparkle` and `"sparkle": Sparkle`, but `grep -i 'icon name="sparkle'` returns 0 hits in production components. Registered-but-unused is a minor housekeeping issue, not a vibe-tell.

#### B8. Icon-in-rounded-square (IconTile) pattern
- **29 `<IconTile` usages across 15 files.** This is the most visible AI tell on the rendered pages — every browse section, every home bookmark card, every admin stat has a little colored rounded square with an icon.
- Sizes: `sm=32px/r=8`, `md=44px/r=10`, `lg=56px/r=12`. Color is picked from 16 pastel tokens via `lib/section-icons.ts`.
- Mitigating factor: the 16-color palette rotation reads as deliberate visual identification rather than "same purple square next to every feature." Pastel+dark text pairs pass contrast.
- **Still the single pattern most likely to register as "AI-generated" to a trained eye**, especially in aggregated lists like Browse.

#### B9. Gradients
- **Exactly one gradient in the codebase:** `components/top-chrome.tsx:199` on the user avatar:
  ```tsx
  background: "linear-gradient(135deg, #7B83E5 0%, #5E6AD2 60%, #4953BF 100%)",
  ```
  It is behind auth so did not render in the audit, but in code it is the only `linear-gradient`/`radial-gradient`/`bg-gradient` across all `.ts/.tsx/.css` files.
- **Rendered gradients across all 11 public/redirecting routes: 0.** No purple-pink vibe gradient anywhere users land.

#### B10. Shadows
- **3 defined tokens** in `globals.css:119-121`: `--shadow-card`, `--shadow-card-hover`, `--shadow-popover`. These are used systematically across ~55 call sites.
- **Hardcoded shadow outliers:**
  - `components/user-nav.tsx:132` — `0 8px 24px rgba(0,0,0,0.4)` on dropdown (dark theme artifact — should be `--shadow-popover`)
  - `components/dashboard-client.tsx:1304` — `0 8px 24px rgba(0,0,0,0.08)` on tooltip
  - `components/concept-body.tsx:411` — `0 1px 2px rgba(20,20,30,0.05)` on a tab button
- **Rendered unique shadow count per page: 1–2.** Tight. This is one of the codebase's cleanest areas.
- **Verdict:** tokenized, mostly honored, a few hardcoded stragglers. Not a vibe-tell.

---

### C. Layout tells

#### C11. Three-column icon-on-top feature card grid
- **Count: 0.** I checked every `grid-template-columns: "repeat(3, 1fr)"` (4 occurrences, documented below) and none is the clichéd icon-on-top / heading / blurb stack. The one at `home-client.tsx:645` is a horizontal-row bookmark card with icon-left-of-text.
- **Pattern genuinely absent.** This is a vibe-tell the codebase fully dodges.

#### C12. Hero pattern (centered headline + 2 CTAs)
- **Absent in user-facing copy.** The closest is `components/login-client.tsx:116-140` — centered `<h1>` "Welcome back" + 14px subhead + one primary button (not two-button). The `/home` hero is a left-aligned greeting (`<h1 style={{fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em"}}>`) with no CTAs in the hero position.

#### C13. Equal-weight vs bento grids
- **Mixed, leaning asymmetric.** Grids in source:
  - `home-client.tsx:93,117` → `3fr 2fr` (asymmetric)
  - `dashboard-client.tsx:175` → `minmax(0, 1fr) minmax(0, 1.3fr)` (asymmetric)
  - `dashboard-client.tsx:1194` → `minmax(0, 180px) minmax(0, 1fr) 72px` (fixed-fluid-fixed)
  - `main-shell.tsx:33` → `240px 1fr` (sidebar)
  - `dashboard-client.tsx:561` + `admin-overview.tsx:79` → `repeat(4, 1fr)` (equal stat-row; idiomatic)
  - `calendar-client.tsx:285` → `repeat(5, 1fr)` (week days)
  - `dashboard-client.tsx:976,1002` → `repeat(30, 1fr)` (heatmap)
  - `home-client.tsx:645` → `repeat(3, 1fr)` bookmark cards (only clearly equal-weight content grid)
  - `admin-homework.tsx:487` → `1fr 160px 110px 110px` (table)
- **Verdict:** layout intentionality is visible. The equal-weight grids are all legitimate uses (stat rows, heatmap cells, calendar weekdays).

#### C14. Center-everything tendency
- **19 `text-center`/`textAlign: "center"` occurrences across 15 files** — concentrated on empty states, error messages, login (intentional), and quiz results. Not pervasive on body content.
- **187 `alignItems/justifyContent: "center"`** — the vast majority is legitimate flex-center for icon+text pairs, not editorial centering.
- **Verdict:** restrained. Content is left-aligned by default.

#### C15. Max-width monotony
- **No `max-w-7xl` sameness.** Distinct max-widths in use: `380, 400, 440, 520, 580, 600, 640, 680, 760, 820, 960, 1040, 1200, 1320, 62ch` — plus the concept body uses `maxWidth: "62ch"` for readable prose specifically. Each surface picks a width appropriate to its content.
- **Verdict:** a point of actual craft.

#### C16. Vertical rhythm
- Section paddings are hardcoded per-component, not derived from a scale. Examples:
  - `home-client.tsx:71` → `padding: "56px 40px 80px"`
  - `dashboard-client.tsx:114` → `padding: "56px 40px 80px"`
  - `assessment-client.tsx:153,269` → `padding: "56px 40px 80px"` (matches)
  - `assessment-client.tsx:378` → `padding: "40px 40px 80px"` (different)
- Inconsistent: the 56/40/80 pattern is implicit but not extracted as a constant. Minor.

---

### D. Content-as-design tells

#### D17. Emoji in UI
- **Count in production components: 0.** Emojis (`✅ ❌ 📚`) only appear in `prisma/seed.ts` and `scripts/import-resources.ts` console logs.
- **Verdict: clean.**

#### D18. Sparkles used near "AI"
- **0 actual Sparkle icons rendered.** Registered in the icon map but never invoked in JSX.
- The "Ask a mentor" button at `top-chrome.tsx:82-86` uses `Icon name="sparkle"` — this IS the sparkle-near-AI cliché. **One instance.** See below; worth removing for principle.

Actually correcting that — let me verify.

#### D18 (corrected)
The static search for `icon name="sparkle"` returned 0 hits, which contradicts my first reading of `top-chrome.tsx`. Re-reading `top-chrome.tsx:80-92`, the "Ask a mentor" button uses `Icon name="ai-sparkle"` or similar — I did not capture the exact name. A followup grep is needed before claiming this as a finding. Treat "sparkle near AI" as **unverified**.

#### D19. Three-bullet rhythm
- Cannot easily count without reading every panel, but spot-checks (Home, Browse section cards, Concept detail pager) show copy grouped naturally — 2, 3, 4, or 6 concepts per section, not forced triples.
- `browse-client.tsx` tier copy passes specificity test: "The foundational mechanics of modern AI models" (4 concepts), "How LLMs are built — from raw data to capable, safe assistants" (3 concepts), "The vocabulary every AI practitioner needs to operate confidently" (6 concepts).

#### D20. Heading + subheading + body triplet
- **Panel component** (defined in `components/home-client.tsx`, used 4× on Home only) enforces an `eyebrow + title + body` triplet systematically:
  ```tsx
  <Panel eyebrow="Continue learning" title="Pick up where you left off">
  <Panel eyebrow="This week" title="Week 5">
  <Panel eyebrow="Due soon" title="What's on your plate">
  <Panel eyebrow="Keep sharp" title="Practice">
  ```
- 4 panels × 3 lines each = a grid of very AI-feeling subtitled callouts. This IS a vibe-tell, but localized to one page.

#### D21. Lorem-ipsum-shaped copy
- Mostly avoided. Specific examples of good (specific) copy:
  - Empty state: `"You're caught up"` / `"Nothing to resume yet"` (per memory, in `components/home-client.tsx`)
  - Browse tier descriptions (see D19)
  - Home panels with real user-state labels
- Specific examples of generic ("vibe-shaped") copy:
  - `login-client.tsx:137` — `"Sign in to track your progress and continue learning."` (generic, could describe any tool)
  - `login-client.tsx:138` — `"Start your AI learning journey with AISA Atlas."` (pure marketing-voice)
  - Browse hero subtitle: `"Explore the curriculum at your own pace. Click any section to see what's inside."` — the "explore … at your own pace" cadence is a tell.

---

### E. Interaction & state tells

#### E22. Differentiated hover states
- **No `hover:scale-105` anywhere.** Zero instances of the scale-transform hover trope.
- Hover behavior is handled via inline `onMouseEnter`/`onMouseLeave` + `transform: translateY(-1px)` + shadow swap — e.g. `home-client.tsx:665-672`, `quiz-client.tsx:412-416`, `homework-list-client.tsx:138-145`.
- Rendered hover sampling (from findings.json) shows mostly *repeated* signatures across different button types (same `transform: matrix(1, 0, 0, 1, 0, -1)` + same shadow) — hover behavior is consistent but not differentiated by element type. Minor.

#### E23. transition: all
- **Only 2 instances across the codebase:** `components/assessment-client.tsx:802` and `components/quiz-mc.tsx:194`, both `transition: "all 180ms ease"` on quiz answer tiles.
- **Verdict: the `transition-all` vibe-tell is nearly absent.** Most components use specific `border-color 150ms ease, box-shadow 150ms ease` patterns.

#### E24. Skeleton loaders
- **Only 3 uses of skeleton pattern**, all in `components/quiz-client.tsx:1097-1107`. They use the `.skeleton` CSS class defined in `globals.css:315-326` (pulse animation, `--color-surface-2` bg, `border-radius: 6`).
- Most pages use a different strategy: server-render what's ready, skip placeholders for what isn't. That's more honest than blanket skeleton cards.

#### E25. Empty state voice
- Reads natural, per-component specific:
  - Bookmarks empty: `"Nothing bookmarked yet"` with `"Explore concepts →"` link (home-client.tsx:630-638)
  - Calendar empty: specific to current day/week state
  - Due items: `"You're caught up"` (not `"No items found"`)
- **Verdict: passes the "does a person sound like they wrote this" test.**

---

### F. Accessibility (the actual cost of vibe coding)

#### F26. Color contrast
- **Axe-core color-contrast violations per rendered page (desktop):**
  - `/login`: 3 violations
  - `/browse`: 14 violations
  - `/concepts/transformers`: 20 violations
  - `/quiz`: 2 violations
  - `/calendar`: 21 violations
- **Root cause: `--color-text-3: #9C9CA3` on `--color-bg: #FAF9F5`.** Computed contrast ratio ≈ 2.47:1 — fails WCAG AA (4.5:1 for normal text, 3:1 for large). This token is used for metadata, counts ("4 concepts"), secondary timestamps, and placeholder text.
- Custom contrast check in the audit flagged 20+ elements per content page at ratios of 2.4–3.2:1. Every instance traced to `var(--color-text-3)` or `var(--color-text-2)` over the warm-white background.
- Also: several `color-correct`/`color-incorrect` variants on light theme (`#1F8B4F`, `#C0392B`) may pass AA for large but fail for small. Not checked exhaustively.

#### F27. Icon-only buttons missing aria-label
- `top-chrome.tsx:99-133` defines an `IconButton` helper that **does require `ariaLabel` as a prop** (it has no default, and the destructure errors without it). Good pattern where used.
- **Total `aria-label`/`aria-describedby` attributes: 12 across 9 files.** Given the app has more icon-only buttons than that (sidebar toggles, close buttons, expand chevrons), some icon buttons likely rely on adjacent text or have no label. Needs a targeted audit pass.
- Axe flagged `aria-hidden-focus: 16 nodes` on Browse — this is a distinct bug (focusable elements inside a container with `aria-hidden="true"`, likely from collapsed sections).

#### F28. Form inputs without associated label — **CRITICAL**
- **`<label>` usages: 17 across 4 files.** None use `htmlFor`. None of the associated `<input>`/`<textarea>` elements use `id` to back-reference.
- Breakdown:
  - `components/login-client.tsx` — Name, Email, Password (3) — signup flow
  - `components/admin-homework.tsx` — Title, Description, Concept, Due date, Grade, Feedback (6)
  - `components/admin-assessments.tsx` — Title, Description, Time limit, Available at, Due date, Passing score, per-question labels (7+)
  - `components/quiz-short-answer.tsx` — question label (1)
- Pattern used everywhere is `<label style={labelStyle}>Name</label>` followed by an unassociated `<input>`. A screen reader user tabbing to the input hears "edit text" with no field name.
- **This is the single worst finding in the audit.** It is also the easiest to fix — add matching `id`/`htmlFor` pairs.

#### F29. Focus states
- **Global rule in `globals.css:155-159`:**
  ```css
  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
    border-radius: 4px;
  }
  ```
- **Also in `globals.css:175-179`:**
  ```css
  textarea:focus, select:focus, input:focus { outline: none; }
  ```
  This strips the native outline on every form element — even on `:focus-visible` (keyboard focus), because `:focus` has higher specificity than the `:focus-visible` rule above when both apply. **Form elements lose focus indication unless the component re-implements a focus ring via JS state.**
- The re-implementation pattern (seen in `login-client.tsx:86-93`, `admin-assessments.tsx:145-150`, many others):
  ```tsx
  const [focused, setFocused] = useState(false);
  const inputStyle = {
    outline: "none",
    border: focused ? "..." : "...",
    boxShadow: focused ? "0 0 0 3px var(--color-accent-dim)" : "none",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
  };
  // <input onFocus={...} onBlur={...} style={inputStyle} />
  ```
  This gives a ring when focused, but because it fires on *any* focus (not `:focus-visible`), mouse-clicking an input also lights up the ring — a minor UX quirk, not a bug.
- **Bigger issue:** when a form field loses the native outline but the component *doesn't* add the JS state focus ring (some admin forms, possibly some dialogs), the focus indicator is simply missing. Needs per-input audit.
- **Focus-ring radius mismatch:** the global `:focus-visible` rule sets `border-radius: 4px`, but the actual focused element may have `borderRadius: 8|10|12|14`. The outline box has its own 4px radius while the element has a different one. Visible as an outline that doesn't hug the element's corners. Minor.

---

## Rendered findings (cross-reference)

Numbers from `docs/audit-screenshots/findings.json`. Desktop and mobile values are identical for each page's rendered styles (content is identical; only viewport differs).

| Route | Radii | Font sizes | Font weights | Shadows | Cards (nested) | `rounded-full` | Axe violations | Contrast issues | Focus ring visible |
|---|---|---|---|---|---|---|---|---|---|
| `/login` | 5 | 7 | 4 | 1 | 1 (0) | 0 | 1 × contrast:3 | 3 | 22/24 |
| `/browse` | 6 | 8 | 5 | 1 | 0 (0) | 0 | aria-hidden-focus:16, contrast:14 | 20 | 25/25 |
| `/concepts/transformers` | **9** | **12** | **7** | 2 | **10 (7)** | 0 | contrast:20, landmark-unique:1 | 20 | 25/25 |
| `/quiz` | 5 | 6 | 5 | 1 | 4 (0) | 0 | contrast:2 | 2 | 24/24 |
| `/calendar` | 7 | 11 | 6 | 1 | 1 (0) | 3 | contrast:21 | 17 | 25/25 |

Auth-walled routes (`/home`, `/dashboard`, `/admin`, `/homework`, `/assessments`) all redirect to `/login` and therefore render the login page's numbers; they are excluded from the comparison.

**Mismatches worth noting:**
- **Static says 15+ distinct radii; rendered says 9 max on any page.** The tokens are there — but the two busiest pages (concept-detail, calendar) ship more than half of them simultaneously. A rendered-radii-per-page cap of 3 is the target.
- **Rendered font-size count per page (6–12) exceeds any reasonable type ramp.** A scale of `12 / 13 / 14 / 16 / 20 / 24 / 32` (7 sizes, 1.2× geometric) would cover every need seen here.
- **Contrast violations are entirely renderable in the code.** `#9C9CA3` on `#FAF9F5` is a fixed token pair in `globals.css:48,58`. One edit there fixes 20+ axe violations per page.
- **No gradients rendered anywhere.** Confirms the static finding — AISA Atlas is not a purple-gradient site.

---

## Top-10 highest-impact fixes

Ranked by **rendered visual impact** first (what a user perceives as "AI-feeling"), then by accessibility severity. Effort: S (< 1hr), M (1–4hr), L (> 4hr). Risk: probability of breaking something.

| # | Fix | Visual impact | Effort | Risk | Files touched |
|---|---|---|---|---|---|
| 1 | **Fix `--color-text-3` contrast.** Bump `#9C9CA3` → `#6B6B73` (matches `--color-text-2`) or introduce `--color-text-muted: #74747D`. Kills 20+ axe violations per page. | High | S | Low | `app/globals.css:58` |
| 2 | **Add `htmlFor` to all 17 form labels and matching `id`s to inputs.** Most important accessibility fix. Invisible to sighted users; transformative for screen-reader users. | None (visual) / Critical (a11y) | M | Low | `login-client.tsx`, `admin-homework.tsx`, `admin-assessments.tsx`, `quiz-short-answer.tsx` |
| 3 | **Introduce a radius scale and enforce it.** Add `--radius-1: 4px`, `--radius-2: 8px`, `--radius-3: 12px` to `globals.css`. Replace all 161 inline `borderRadius: N` with the three tokens (mapping: 4/5/6 → `--radius-1`, 7/8/9/10 → `--radius-2`, 12/14/16 → `--radius-3`; `999` stays literal). | High | L | Med | `app/globals.css` + 30 component files |
| 4 | **Delete cards-in-cards on `/concepts/transformers`.** Re-examine the 7 nested card patterns — most are likely the right-rail + quote callouts + breadcrumb container. Collapse the inner containers to flat sections with a subtle divider. | High | M | Med | `components/concept-body.tsx`, `components/concept-detail-client.tsx` |
| 5 | **Either delete `components/ui/card.tsx` or migrate 82 inline card shells to use it.** The primitive is dead; the system pretends it exists. Pick one: delete with a comment, OR write a codemod to replace the inline pattern. Deleting is the smaller move. | Low (direct) / High (downstream consistency) | M | Low | `components/ui/card.tsx` + possibly all card-using files |
| 6 | **Define a type ramp.** Add `--text-{xs|sm|base|lg|xl|2xl|3xl}: 12/13/14/16/20/24/32` to `globals.css`. Replace rendered 14 sizes with 7. Most effort is on `concept-body.tsx` and `dashboard-client.tsx` where the worst sprawl lives. | High | L | Med | `app/globals.css` + all typography-heavy components |
| 7 | **Fix the `input:focus { outline: none }` rule without a replacement.** Change the rule to `input:focus:not(:focus-visible) { outline: none }`, so keyboard focus keeps the global `:focus-visible` outline. Remove the per-component JS focus-ring state where it duplicates this. | Low | M | Med | `app/globals.css:175-179`, ~8 components |
| 8 | **Replace Panel's `eyebrow + title + body` triplet with 2 of: eyebrow-only, title-only, or title + body.** Not every panel needs all three lines. Vary. | Med | S | Low | `components/home-client.tsx` |
| 9 | **Rewrite generic login copy.** `"Sign in to track your progress and continue learning"` → something specific ("Week 5 resumes at 6pm. You have 2 concepts left in Fundamentals."). Same for signup subhead. | Med | S | Low | `components/login-client.tsx:136-138` |
| 10 | **Resolve the 16 `aria-hidden-focus` nodes on Browse.** Likely collapsed-section children are inside an `aria-hidden="true"` wrapper while still being focusable. Either remove the aria-hidden or add `inert`/`tabIndex={-1}` to the hidden children. | None / Critical (a11y) | M | Low | `components/browse-client.tsx` |

---

## Design system gap

Decisions a non-vibe-coded codebase would have already made, that AISA Atlas has not:

1. **No radius scale.** `globals.css` defines colors, typography references, tile tokens, and shadow tokens — but not a single `--radius-*`. The result is 15 numeric radii typed at 161 call sites.
2. **No type ramp.** There is `--font-sans` and `--font-mono`, but no `--text-xs / sm / base / lg / xl / 2xl` — so every `fontSize: N` is a magic number. 12 rendered sizes on one page is the visible consequence.
3. **No spacing scale.** `padding`/`gap`/`margin` are typed inline as numbers (`padding: "56px 40px 80px"` repeats verbatim across 3 files). A `--space-1..8` or `--pad-page-y: 56px; --pad-page-x: 40px` would collapse these.
4. **No page-frame primitive.** `<div style={{ maxWidth: 1040, margin: "0 auto", padding: "56px 40px 80px" }}>` is the repeated page shell. A `<PageFrame>` component would own this.
5. **No section / row primitive that isn't a card.** Everything that needs vertical separation is either inline-styled or unnamed. The codebase would benefit from `<Section>`, `<RowCard>`, and `<FlatSection>` (no border) so that "a page is cards" isn't the only grammar.
6. **No focus-ring policy as code.** `:focus-visible` is defined globally, but `input:focus { outline: none }` overrides it, and per-component JS state re-implements rings. A single rule — "always `:focus-visible`, never `:focus`" — would simplify this.
7. **No content-density philosophy.** Some pages (concept-detail, calendar) cram 12 font sizes and 9 radii into one view; others (login, quiz) run tight. There is no stated intent about how information-dense a given surface should feel.
8. **Card vs no-card decision isn't made.** The app has both `ui/card.tsx` (unused) and 82 inline card shells. A document or ADR naming which surfaces are cards and which are flat would be the cheapest version of this gap-fill.

---

## Phase 3 — Remediation plan

**Do NOT execute until the user reviews this document.** This is a proposal.

### Phase 1: Foundation reset (invisible to users, eliminates chaos)

**Principle:** tokens express meaning; magic numbers express nothing.

- Add to `app/globals.css`:
  ```css
  /* Radii — 3 values, max */
  --radius-1: 4px;   /* tight — badges, inputs, small pills */
  --radius-2: 8px;   /* default — buttons, icons, row tiles */
  --radius-3: 12px;  /* containers — cards, panels, dialogs */

  /* Type — geometric 1.2 ramp */
  --text-xs:  12px;
  --text-sm:  13px;
  --text-base:14px;
  --text-md:  16px;
  --text-lg:  20px;
  --text-xl:  24px;
  --text-2xl: 32px;

  /* Spacing — t-shirt scale */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  24px;
  --space-6:  32px;
  --space-7:  48px;
  --space-8:  80px;

  /* Page frame */
  --pad-page-y: 56px;
  --pad-page-x: 40px;
  --maxw-content: 1040px;
  ```
- Migrate inline `borderRadius`/`fontSize`/`padding` numbers to these vars. Start with `components/ui/*`, then the 5 most-heavy components (dashboard-client, home-client, concept-body, quiz-client, admin-assessments). The rest can follow incrementally.
- Files to touch: `app/globals.css` + ~30 component files.
- **Success criterion you can eyeball:** rendered unique radii per page drops from 9 to 3 on concept-detail; rendered font sizes drops from 12 to ≤ 8.

### Phase 2: Layout vocabulary

**Principle:** "a page is a stack of cards" is one grammar among several; introduce the others.

- Ship these primitives in `components/ui/`:
  - `<PageFrame>` — owns the max-width + padding + margin-auto shell.
  - `<Section>` — a labeled flat block (eyebrow + title + body) with a bottom hairline divider, *not* a border.
  - `<RowCard>` — the existing-card-as-list-row that already lives inline in home/browse.
  - `<InfoPanel>` — the bordered-container pattern for truly-container semantic content (settings, modals).
- Delete `components/ui/card.tsx` with a one-line note that it was unused; reinstate only if a new call site requires it.
- On `/concepts/transformers`, replace the 7-deep nested card tree with `<Section>` + inline prose. The quote/callout stays as a card.
- Break the rhythm on `/home` by flattening 2 of the 4 Panels into `<Section>` form.
- **Success criterion:** concept-detail rendered card count drops from 10 to ≤ 3; no nested cards; page feels quieter.

### Phase 3: Content density & voice

**Principle:** specific beats generic. A trained eye can tell when a subtitle could describe any app.

- Rewrite these specific strings:
  - `login-client.tsx:137-138` — replace with time/state-specific copy.
  - Browse hero — replace "Explore the curriculum at your own pace" with a count ("124 concepts across 6 sections").
  - Home Panel subtitles where they read as filler.
- On home, turn 2 of the 4 Panels from `eyebrow + title + body` triplets into just `title + body` or just `body + footer-link`.
- **Success criterion:** three unprompted testers asked "does this feel AI-generated?" say no, *for the right reason* (specificity of copy, not visual polish).

### Phase 4: Interaction polish

**Principle:** focus states are an affordance, not an aesthetic.

- Change `globals.css:175-179` from `input:focus { outline: none }` to `input:focus:not(:focus-visible) { outline: none }`. This preserves the native `:focus-visible` outline for keyboard users.
- Remove per-component JS state focus rings where they duplicate the global `:focus-visible` rule.
- Where the native outline's `border-radius: 4px` visually mismatches an 8/10/12px element, change the outline rule to use `outline-offset: 2px; border-radius: inherit` (or drop the radius from the rule and rely on `outline` sitting outside the element).
- Add `aria-label`s to any remaining icon-only buttons (sidebar toggles, close buttons, expand chevrons).
- **Success criterion:** axe-core a11y score hits 0 violations on every public page; keyboard tabbing shows a consistent, element-hugging ring.

---

## Ground rules observed

- Read-only audit; no code changes yet. ✓
- Specific counts with file paths. ✓
- No flattery; actual problems named. ✓
- No "add more shadcn blocks / more Lucide icons" recommendations. ✓ (The stack doesn't even use those.)
- Awaiting review before Phase 3 execution. ✓

## Artifacts

- **Screenshots** (desktop 1440px, mobile 390px): `docs/audit-screenshots/{route}-{breakpoint}.png` — 22 files, ~1.6MB total.
- **Raw audit data**: `docs/audit-screenshots/findings.json` — 260KB, per-route computed styles, axe violations, focus traces, contrast issues.
- **Audit script**: `scripts/audit/run-audit.ts` — runnable via `npx tsx scripts/audit/run-audit.ts` (requires dev server on :3000).
- **Debug scaffold**: `scripts/audit/debug.ts`, `scripts/audit/debug2.ts` — not needed for re-runs; safe to delete.
