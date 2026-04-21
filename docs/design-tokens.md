# Design tokens

Defined in `app/globals.css`. This doc is the authoritative mapping from the
legacy inline magic numbers (counted by the vibe audit) to the token that
replaces them in Phase 2.

**Principle:** tokens express meaning; magic numbers express nothing.
If you reach for a number, there should be a token for it. If there isn't,
either add one with a stated purpose or reuse the nearest existing one.

---

## Radius — 3 tiers (+ literal 999 for pure circles)

| Legacy value | Count | Target token | Notes |
|---|---|---|---|
| `1`     |  1 | `--radius-1` | Stroke-width outlier in `concept-body.tsx` |
| `1.5`   |  1 | `--radius-1` | Ditto |
| `3`     |  4 | `--radius-1` | Scrollbar thumb, small chips |
| `4`     | 12 | `--radius-1` | |
| `5`     |  1 | `--radius-1` | |
| `6`     | 18 | `--radius-1` | Skeleton, small tiles |
| `7`     |  1 | `--radius-2` | `dashboard-client.tsx:291` outlier |
| `8`     | 36 | `--radius-2` | Most common "default" radius |
| `9`     |  1 | `--radius-2` | |
| `10`    | 28 | `--radius-2` | Inputs, tiles |
| `12`    | 42 | `--radius-3` | Most common card radius |
| `14`    |  6 | `--radius-3` | Panel shells; unify up to 12 |
| `16`    |  2 | `--radius-3` | Large cards; 16 → 12 narrows visual range |
| `22`    |  1 | `--radius-3` | `feedback-dialog.tsx:235` outlier |
| `999`   |  7 | **literal** | Pure circles (avatars, badge dots) |

**Total declarations: 161 → 3 tokens + 1 literal.**

Rounding choices:
- `14` → `12`: a 2px reduction. Visual impact: card corners look ~14% tighter. Acceptable.
- `16` → `12`: a 4px reduction. Slightly more impact; affects 2 call sites (feedback-dialog header, one dashboard).
- `22` → `12`: the dialog outlier — always wrong; no principle distinguishes it.
- `1`, `1.5` → `4`: affects 2 sites, both on concept body structural lines. 4px instead of 1px changes *a lot* visually (3px difference). **Flag these for manual review in Phase 2** — they may be non-radius uses (e.g., a decorative inline border segment) that deserve to stay literal.

---

## Type — 9-step ramp

| Legacy value | Count | Target token | Use |
|---|---|---|---|
| `10`    |  4 | `--text-xs` | Smallest badge text |
| `10.5`  |  6 | `--text-xs` | |
| `11`    | 46 | `--text-xs` | Metadata, counts |
| `11.5`  | 13 | `--text-xs` | |
| `12`    | 46 | `--text-xs` | Small labels |
| `12.5`  | 43 | `--text-sm` | Borderline — rounds up to 13 |
| `13`    | 57 | `--text-sm` | Secondary body |
| `13.5`  | 46 | `--text-sm` | |
| `14`    | 30 | `--text-base` | Body text |
| `14.5`  | 10 | `--text-base` | |
| `15`    | 13 | `--text-md` | |
| `15.5`  |  1 | `--text-md` | |
| `16`    | 13 | `--text-md` | Emphasized body, form inputs |
| `17`    |  2 | `--text-md` | |
| `18`    |  7 | `--text-md` | Subsection headings |
| `20`    |  2 | `--text-lg` | |
| `22`    |  7 | `--text-lg` | |
| `24`    |  ? | `--text-xl` | Section headings |
| `26`    |  2 | `--text-xl` | |
| `28`    |  7 | `--text-2xl` | **Canonical page H1** |
| `30`    |  2 | `--text-2xl` | |
| `32`    |  4 | `--text-3xl` | Hero headings |
| `36`    |  2 | `--text-3xl` | |
| `56`    |  2 | `--text-display` | Oversized scores/countdowns |

**Total declarations: 365 → 9 tokens.**

Semantic pairing (use these as naming hints, not hard rules):
- **xs** → metadata, timestamps, count badges
- **sm** → secondary body, small labels
- **base** → body text, button labels
- **md** → emphasized body, form inputs, subsection headings
- **lg** → large labels, card titles
- **xl** → section headings
- **2xl** → page titles
- **3xl** → hero headings
- **display** → oversized numbers (scores, countdowns)

Rounding choices:
- `.5` half-pixel sizes (10.5, 11.5, 12.5, 13.5, 14.5, 15.5) all round to the nearest whole px. These are nearly indistinguishable visually.
- `15` → `16` (md): 1px larger. A 7% increase. Not disruptive.
- `17`, `18` → `16`: 1-2px smaller. Subsection headings get slightly tighter. Review on Browse section titles (18px → 16px will be noticeable).
- `22` → `20`: 2px smaller. Call sites to spot-check.
- `26` → `24`: 2px smaller.
- `30` → `28`: 2px smaller.
- `36` → `32`: 4px smaller. One home hero (`fontSize: 32` at home-client) already uses 32; the 36 sites probably align after migration.

---

## Spacing — 8-step t-shirt scale

Observed gap values: `2, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 28`.

| Legacy | Count | Target |
|---|---|---|
| `2`  |  4 | `--space-1` |
| `4`  | 12 | `--space-1` |
| `5`  |  2 | `--space-2` |
| `6`  | 26 | `--space-2` |
| `7`  |  2 | `--space-2` |
| `8`  | 39 | `--space-2` |
| `9`  |  2 | `--space-3` |
| `10` | 42 | `--space-3` |
| `12` | 34 | `--space-3` |
| `14` | 24 | `--space-4` |
| `16` |  9 | `--space-4` |
| `18` |  2 | `--space-5` |
| `20` |  4 | `--space-5` |
| `24` |  2 | `--space-5` |
| `28` |  1 | `--space-6` |

**Gap declarations: 205 → 8 tokens (with `0` staying literal).**

Rounding choices:
- The `6 → 8` collapse (26 occurrences) is the most visible — items will gap 33% wider. Spot-check Browse section inter-item gap and sidebar row spacing before committing Batch 2A.
- `10 → 12` (42 occurrences): items get 20% more breathing room. Watch row-card spacing.
- `14 → 16` (24 occurrences): 14% increase.
- `18 → 24` (2 occurrences): 33% increase — these are outliers and worth individual review.

**Padding** follows the same scale. Multi-value padding strings like `"14px 16px"` get tokenized component-by-component — not by codemod. For the common page shell pattern:

```tsx
padding: "56px 40px 80px"
```

→ becomes

```tsx
padding: "var(--pad-page-y) var(--pad-page-x) var(--space-8)"
```

or better, gets absorbed into the `<PageFrame>` primitive in Phase 3.

---

## Page frame tokens

| Token | Value | Use |
|---|---|---|
| `--pad-page-y`   | `56px`   | Vertical page padding (top). Bottom padding is commonly `80px` (`--space-8`). |
| `--pad-page-x`   | `40px`   | Horizontal page padding |
| `--maxw-content` | `1040px` | Default content max-width |

These are consumed by the `<PageFrame>` primitive in Phase 3. They exist as variables now so that before `<PageFrame>` ships, individual page shells can reference them directly.

Other observed max-widths — `380, 400, 440, 520, 580, 600, 640, 680, 760, 820, 960, 1200, 1320, 62ch` — are content-specific. Each page owns its own max-width decision; the token is only for the default shell.

---

## What stays a literal

- `999` for pure circles (avatars, badge dots)
- `62ch` for prose columns (character-unit widths are intentional)
- `0` for resets (margin, padding, outline)
- Exact pixel dimensions on things that must match external specs (icon viewBox values, viewport heights in media queries, etc.)
- Percent values (`50%`, `100%`, `-50%`)
- Per-case fixed element widths (sidebar `240px`, right-rail `252px`, etc.) — these aren't on a scale; they're load-bearing layout constants

Phase 2 codemod will leave any of these untouched.

---

## Codemod rules (for Phase 2)

The ts-morph codemod walks every `.ts`/`.tsx` file under `components/` and `app/`
and rewrites numeric literals in these property positions:

| Property | Source | Target |
|---|---|---|
| `borderRadius:` | matches radius table | `var(--radius-N)` |
| `borderTopLeftRadius:` etc. | same | same |
| `fontSize:` | matches type table | `var(--text-*)` |
| `gap:` | matches spacing table | `var(--space-N)` |
| `rowGap:`, `columnGap:` | same | same |
| `padding:` (single numeric) | matches spacing table | `var(--space-N)` |
| `paddingTop/Bottom/Left/Right:` | same | same |
| `marginTop/Bottom/Left/Right:` (non-zero) | matches spacing table | `var(--space-N)` |

**Never rewritten automatically:**
- Multi-value padding/margin strings (`"14px 16px"`) — these get per-site manual migration.
- Numeric props that aren't CSS (`rows={8}`, `minLength={6}`, `tabIndex={-1}`).
- Values outside the table ranges (e.g. a rogue `borderRadius: 17`) — surfaces with a `// TODO: token` comment for manual decision.

After the codemod, an ESLint rule bans raw numeric literals in these same
properties. The rule exempts `0`, `999`, and string values.

---

## Naming philosophy

- **Numeric scales (1/2/3, xs/sm/…)** over semantic names (tight/default/container).
  Numeric scales let authors make judgment calls per-site; semantic names force
  a naming decision at every call site that often doesn't fit.
- **Never reuse names across namespaces.** `--space-2` is spacing;
  `--text-sm` is type; `--radius-2` is radius. No ambiguity.
- **`display` for type, not `hero` or `jumbo`.** Typography has a long convention
  for "display type" meaning oversized headline sizes.
