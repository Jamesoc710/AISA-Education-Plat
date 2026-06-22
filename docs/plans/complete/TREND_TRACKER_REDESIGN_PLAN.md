# Trend Tracker - Visual Redesign Plan

> Revision 4. Locks the direction after review and after seeing the Typewolf "Top 30 Favorite Sites"
> reference. The list becomes a Typewolf-style two-up index: two trends per row, a soft numbered
> badge, the trend name as the hero (standing in for Typewolf's site screenshot since trends have no
> image), and a "THEMES" metadata line in the slot Typewolf uses for "FONTS". Ranking is
> de-emphasized, lines are sharper (crisp 1px rules between rows), the bubble field is parked, motion
> stays at full strength. The lifecycle stage label is replaced by a **Themes** facet (one or two
> plain-language tags). Themes are labels only for now, not filters, and the vocabulary plus the curated
> tags for all 22 trends are now locked (section 3). Still planning only, no app code.

## 1. Recommended direction

**Design language: "The Pulse Index."** A Typewolf-style two-up editorial index: trends sit side by
side, two per row, each one a large click target that opens a brief. The page reads as a curated index
of what is moving, not a feed of cards. The throughline is restraint and clean type: a soft numbered
badge gives the list rhythm, the trend name is the hero (large type does the work Typewolf's site
screenshot does), one accent color (`#4255FF` under `data-surface="editorial"`) does restrained work
on the warm `#FAF9F5` ground, crisp 1px rules separate rows, and two human signals carry meaning, a
quiet momentum read (number plus a dot-on-track gauge plus an amber heating glyph) and a set of plain
language **Themes** tags that say what each trend touches.

**How it maps to your Typewolf reference.** Typewolf's entry is a numbered badge, a hero screenshot,
the site name, then a small "FONTS - font list" line. Our trends have no screenshot, so the mapping is:
keep the **numbered badge** (soft, category-tinted), promote the **trend name to the hero** in large
type where the screenshot would sit, keep a short **preview** line, and reuse the metadata slot as a
**"THEMES" line** (Builders, Jobs) exactly where Typewolf prints "FONTS". The airy two-up rhythm is
Typewolf; the one thing we add is your "sharper lines", a crisp 1px rule between each row, where
Typewolf leans on whitespace alone.

**Why it fits and extends the editorial brand.** The repo already owns this register on `/home` and
`/dashboard`: `data-surface="editorial"` flips the accent to Quizlet blue `#4255FF` and the font to
Hanken Grotesk (globals.css:190-195), and the editorial primitives (HairRule, SectionEyebrow, the
editorial-link underline sweep, the 2-column split, ThinBar, the WeekList hairline rows) are all
present, inlined per file. Because `--color-text-3` equals `--color-text-2` (`#6B6B73`,
globals.css:113), hierarchy is built with size, weight, and opacity, never a third lighter gray.

**Why it escapes the card-grid look.** Today every list item is the same bordered `--radius-2` box
with an IconTile and a pill cluster, and the detail page is four byte-identical `borderTop` Sections.
The Pulse Index removes every box from content (only the admin Moderation block keeps its border,
since it is chrome not content), kills the IconTile (its category-color job moves into the soft number
badge), demotes the pill cluster to one flat Themes line plus one small momentum read, and separates
items with airy whitespace plus a single crisp rule rather than boxing each one. The detail page
becomes one flowing `clamp(40-48px)` headline brief.

---

## 2. Per-surface redesign plan

Shared rules for both surfaces: wrap the subtree in `<div data-surface="editorial">` so
`--color-accent` is `#4255FF` and the font is Hanken; keep `--color-bg #FAF9F5` ground and
`--color-text #1F1F22` text. All visual primitives (HairRule, SectionEyebrow, ArrowRight, the
editorial-link `<style>` block, ThinBar, the 2-col split) are copied by value into the trends client
files, since they are inlined in home-client.tsx / dashboard-client.tsx and not exported. The
dot-on-track gauge normalizes momentum over the `65-95` band the seed clusters around
(`normalize(momentum, 65, 95)`), so small differences still read.

### 2a. List view (the two-up index)

**Layout.** Container `maxWidth: 1080`, centered, `padding: '48px 40px 96px'`. Header block:
SectionEyebrow `"THE PULSE"`, then `h1 "Trends"` at `clamp(34px, 4vw, 44px)`, `fontWeight: 600`,
`letterSpacing: '-0.02em'`, `color: var(--color-text)`, with the existing subtitle at `fontSize: 16`,
`color: var(--color-text-2)`, `maxWidth: 680`. Below the header, the category tabs, then the grid.

**Toolbar (category only, no theme filters).** Restyle the existing `FilterPills` (All / AI / Tech /
Capital) into ghost text tabs: `fontSize: 14`, `fontWeight: 600`; active gets `color:
var(--color-accent)` plus the 2px editorial-link underline sweep; inactive gets `color:
var(--color-text-2)`; each count follows the label at `fontSize: 13`. Keep the current keyboard
semantics. Themes are shown on each cell as labels, not as a filter row (your call, the set is small
enough that filters are not worth it yet).

**The grid.** `display: grid`, `gridTemplateColumns: 'repeat(2, 1fr)'`, a generous `columnGap: 48`
and `rowGap: 0`, with each row separated by a crisp `borderBottom: '1px solid var(--color-border)'`
and a `borderTop` on the first row. No per-cell box, no radius, no fill, no shadow; the rule plus the
whitespace gutter do all the separating (Typewolf rhythm, our sharper rule). Default order is the
existing momentum-DESC then name-ASC from `getTrends` (lib/trends.ts:106). Cells are numbered across
in reading order like Typewolf (top-left 01, top-right 02, next row 03, 04). Each cell is the link via
an editorial-link anchor with `position: absolute; inset: 0`; hover triggers the title underline sweep
plus arrow slide (no background fill needed, the row stays calm).

**Each cell, top to bottom (Typewolf-mapped).**
- **Number badge:** a 28px circle at the top-left, `backgroundColor: var(--tile-{cat}-bg)`,
  `color: var(--tile-{cat}-fg)`, the index as two-digit tabular numerals at `fontSize: 13`,
  `fontWeight: 600`. This is the one soft round accent, lifted straight from Typewolf, and it now also
  carries category color (so the killed IconTile is not missed). Since the grid is momentum-ordered,
  the number reads as a gentle index without shouting a rank.
- **Category kicker:** SectionEyebrow spec (11px, weight 600, `letterSpacing: '0.18em'`, uppercase) in
  the category tile-fg color, next to the badge: the single category word (`AI`, `TECH`, or `CAPITAL`).
  The data has no sub-category, so the kicker stays the one category label.
- **Trend name (the hero):** `fontSize: var(--text-xl)` (24px), `fontWeight: 600`,
  `letterSpacing: '-0.02em'`, `color: var(--color-text)`, up to two lines, wrapped in the
  editorial-link anchor. This is the visual anchor of the cell, since there is no screenshot.
- **Preview:** a one or two line `whatsHappening` clamp at `fontSize: 14`, `color:
  var(--color-text-2)`, `lineHeight: 1.55`.
- **Themes line (the "FONTS" slot):** a `"THEMES"` micro-label at `fontSize: 11`, `color:
  var(--color-text-3)`, `letterSpacing: '0.08em'`, followed by the one or two theme tags as
  comma-separated words, each in its own tile-fg color at 11px/600 uppercase. Reads like
  `THEMES  BUILDERS, JOBS`. Colored words keep it sharp (no pills, no swatches needed; a tiny square
  swatch is an option if you want more pop, see decision 5).
- **Momentum read (quiet, bottom):** the momentum number (`fontVariantNumeric: 'tabular-nums'`, 14px,
  weight 600, `color: var(--color-text)`) plus the dot-on-track gauge (a 72px 1px `var(--color-border)`
  rule with a 7px `var(--color-accent)` dot at `normalize(momentum, 65, 95)`) plus the amber `TrendUp`
  glyph (`var(--color-gold)`), then `N concepts` at `fontSize: 12`, `color: var(--color-text-2)`.

**Type scale (exact).** Page eyebrow 11px/600; h1 `clamp(34px, 4vw, 44px)`/600; badge numeral 13px/600
tabular; cell kicker 11px/600 uppercase; trend name 24px/600; themes label and tags 11px/600; preview
14px/400; momentum number 14px/600 tabular; concepts label 12px.

**Color (exact).** `var(--color-text)` for names and the momentum number; `var(--color-text-2)` for the
preview and the concepts label; `var(--color-text-3)` for the "THEMES" micro-label; `var(--color-accent)`
(`#4255FF`) for the active category underline, the title hover underline, and the gauge dot;
`var(--color-gold)` for the amber heating glyph; category tile-fg for the kicker and the badge numeral,
its tile-bg for the badge fill; each theme word in its own tile-fg color; `var(--color-border)` for the
row rules and the gauge track.

**Spacing / density.** Two columns of roughly 500px each at full width, 48px column gutter, generous
vertical padding per cell (about `28px 0`), one crisp 1px rule between rows. Airy and editorial, an
index not a dashboard.

**Motion (kept at full strength, not toned down).** Cells enter `scale(0.96) -> scale(1)` plus
`opacity 0 -> 1`, `transformOrigin: 'left'`, a short 18ms stagger by index (capped), 220ms
`cubic-bezier(0.2, 0.8, 0.2, 1)`. Title hover reuses the editorial-link sweep verbatim. The gauge dot
eases its x-position in on mount over ~240ms. All gated through `usePrefersReducedMotion`, which
collapses to instant.

**Momentum + direction as a visual signal (called out).** Ranking is deliberately quiet, so the read
lives in two reinforcing channels per cell: the **dot-on-track** gauge (dot x = `normalize(momentum,
65, 95)`, so a 93 sits near the right end and an 81 sits mid-track) and the **amber heating glyph**
(`TrendUp` now, slate `TrendDown` once cron produces a cooler). The tabular number is there for the
exact value, and reading order still descends by momentum so the top-left cell is the hottest.

**Tail compression.** Render the first 12 cells (six rows) fully, then a `"Show 10 more"`
editorial-link with ArrowRight appends the rest in place. No pagination, no cards.

**How it escapes the card look.** Zero rounded borders, zero radius, zero per-item fill. No IconTile
(its job moves into the soft number badge). The three pill types collapse to one flat colored Themes
line plus one small gauge. Items are separated by whitespace and a single crisp rule, never boxed.
Hierarchy comes from the badge, the large name, the colored themes, and air.

**Responsive / a11y contract.** Below 720px a new `@media (max-width: 720px)` rule in globals.css
collapses `gridTemplateColumns` to a single column (the row rules keep working between stacked cells).
The single column is the mobile, no-JS, and screen-reader backbone; nothing depends on JS, so the true
fallback is one readable column in source order (badge, kicker, name, preview, themes, momentum),
never an unstyled stack.

**Wireframe (two-up index, Typewolf-mapped).**

```
+--------------------------------------------------------------------------+
|  THE PULSE                                                               |
|  Trends                                                                  |
|  What is moving across AI, tech, and capital this week.                  |
|                                                                          |
|  All 22    AI 12    Tech 6    Capital 4                                  |
|  ========================================================================|
|  (01)  AI                         |  (02)  CAPITAL                       |
|  AI Coding Agents Replace         |  The Trillion-Dollar AI IPO          |
|  Autocomplete                     |  Pipeline                            |
|  Agents now ship working changes, |  A wave of AI leaders lines up to    |
|  not the next token...            |  go public at huge valuations...     |
|  THEMES  Builders, Jobs           |  THEMES  Markets                     |
|  93  o-------o ^   2 concepts     |  93  o-------o ^   2 concepts        |
|  ------------------------------------------------------------------------|
|  (03)  CAPITAL                    |  (04)  TECH                          |
|  Historic AI Mega-Round           |  The AI Chip Supercycle and          |
|  Concentration                    |  Custom Silicon                      |
|  Funding piles into a handful of  |  Demand plus custom accelerators     |
|  frontier labs...                 |  reshape the chip market...          |
|  THEMES  Markets                  |  THEMES  Infrastructure, Markets     |
|  88  o-----o ^   3 concepts       |  88  o-----o ^   4 concepts          |
|  ------------------------------------------------------------------------|
|                      Show 10 more  ->                                     |
+--------------------------------------------------------------------------+
   (NN) = soft category-tinted number badge   ^ = amber heating glyph
   o------o = momentum gauge   --- = crisp 1px rule between rows
```

### 2b. Detail page

**Layout.** `maxWidth: 800` under `data-surface="editorial"`. Breadcrumb stays (left arrow plus
"Trends", `color: var(--color-text-3)`). Drop the IconTile header. Then a category kicker
(SectionEyebrow in the category tile-fg color), then the display headline at `clamp(40px, 5vw, 48px)`,
`fontWeight: 600`, `letterSpacing: '-0.02em'`, `lineHeight: 1.1` (a clear escalation from the 24px grid
name, so you feel you entered a brief). A deck sentence in lighter weight directly under it.

**Deck (decided).** The deck is the first sentence of `whatItIs` at `fontSize: 19`, `fontWeight: 400`,
`color: var(--color-text-2)`, `lineHeight: 1.5`, `maxWidth: 720`. Fallback to `whatsHappening` only
when a trend's `whatItIs` opening is weak (you confirmed this fallback, with hand tailoring after
buildout).

**The split.** Below the headline, the repo's real 2-column split:
`gridTemplateColumns: 'minmax(0, 1.35fr) 1px minmax(0, 1fr)'` (the home-client value), `columnGap: 48`,
with a 1px vertical rule div between.

- **LEFT column (the article).** "What it is" and "What's happening now" rendered as reading sections
  where the heading is a bold sentence-case subhead (`fontSize: 16`, `fontWeight: 600`, NOT the
  uppercase eyebrow) over prose at `fontSize: 15`, `lineHeight: 1.7`, separated by HairRule
  (`top/bottom: 32`) instead of `borderTop` boxes. Because `whatItIs` supplied the deck,
  `whatsHappening` opens the left prose body.
- **RIGHT rail (the signals column).**
  - **Momentum hero:** a new local StreakStat-STYLE block, copied by value and modified (NOT the
    literal StreakStat, which hardcodes `fontSize: 28` and types `value` as `number`,
    dashboard-client.tsx:721-748). Momentum value at `clamp(48px, 5.6vw, 64px)` in `var(--color-accent)`
    with a `"MOMENTUM"` eyebrow above and a single-fill ThinBar below (copied from dashboard-client.tsx:476):
    fill `= normalize(momentum, 65, 95)`, `color: var(--color-accent)`.
  - **Themes:** under a `"THEMES"` eyebrow, the trend's theme tags as the same colored words used on the
    grid (each in its tile-fg color). This replaces the old "STAGE / Mainstreaming" stat entirely.
  - **Direction glyph:** amber `TrendUp` plus "Heating" now, slate `TrendDown` plus "Cooling" once a
    cooler exists.
  - **Related concepts:** the existing accent-soft ConceptChips (the one place rounded chips earn their
    keep, since they are real links to `/concepts/[slug]`).
- **Below the split, full width: "Recent signals."** Built from `topStories` as a borderless dated log
  (date eyebrow 11px uppercase, headline 15px/600, `whyItMatters` 14px `color: var(--color-text-2)`,
  SourceChip), entries separated by HairRule (`top/bottom: 20`), modeled on the Linear changelog.
- **Admin Moderation block** stays unchanged at the bottom (chrome not content, the only box that
  survives).

**Type scale (exact).** Kicker 11px/600 uppercase; headline `clamp(40px, 5vw, 48px)`/600; deck 19px/400;
left subheads 16px/600; left prose 15px/1.7; momentum hero `clamp(48px, 5.6vw, 64px)`; themes 11px/600;
eyebrows 11px; recent-signals headline 15px/600, body 14px.

**Color (exact).** `var(--color-text)` headline and subheads; `var(--color-text-2)` deck, prose,
whyItMatters; `var(--color-accent)` (`#4255FF`) momentum number, ThinBar fill, concept-chip links;
category tile-fg for the kicker; each theme word in its tile-fg color; `var(--color-gold)` for the amber
direction glyph; `var(--color-border)` for the HairRules and the vertical split rule.

**Spacing / density.** Headline lineHeight 1.1, deck maxWidth 720, columnGap 48, HairRule 32 between
left sections, 20 between recent-signals entries. Reading-comfortable.

**Motion (kept at full strength).** List-to-detail is a CSS cross-fade plus the headline scaling up
from roughly the grid-name size toward 48px (a lightweight shared-element feel without a layout library,
since framer-motion is absent), with a 2px blur bridge. All gated through `usePrefersReducedMotion`:
reduced motion gets a plain cross-fade with no scale or blur.

**Momentum + direction as a visual signal (called out).** Momentum is promoted to the oversized hero
stat with the ThinBar. Themes replace the lifecycle stage as the human-readable facet. Direction is the
always-present amber glyph.

**How it escapes the card look.** The four byte-identical bordered Sections become one flowing brief: a
clamp headline, a lighter deck, prose divided by bold subheads and HairRule instead of `borderTop`
boxes, a 2-column split, and a borderless dated log. The only surviving box is the admin Moderation
block (chrome).

**Responsive / a11y.** The split collapses to one column below 720px via the same new class-based
globals.css `max-width: 720px` hook used by the grid. The no-JS fallback is semantic source order
(kicker, headline, deck, prose, signals column, recent signals).

**Wireframe (detail page).**

```
+----------------------------------------------------------------------+
|  <- Trends                                                          |
|                                                                      |
|  AI                                                                 |
|                                                                      |
|  AI Coding Agents Replace                                           |
|  Autocomplete                                                       |
|                                                                      |
|  Coding agents now take a task and return a working change, not     |
|  just the next token, shifting the unit of help from a line to a    |
|  pull request.                                                      |
|  --------------------------------------------------------------------|
|  WHAT IS HAPPENING NOW          |  MOMENTUM                          |
|  Several IDE vendors shipped    |  93                                |
|  agent modes this quarter...    |  [==================----]          |
|  ............................   |                                    |
|  ............................   |  THEMES                            |
|                                 |  Builders, Jobs                    |
|  - - - - - HairRule - - - - -   |                                    |
|  WHAT IT IS                     |  ^ Heating                         |
|  An autonomous coding agent...  |                                    |
|  ............................   |  RELATED                           |
|  ............................   |  ( LLM agents ) ( IDEs )           |
|                                 |  ( codegen ) ( evals )             |
|  --------------------------------------------------------------------|
|  RECENT SIGNALS                                                      |
|  2026-06-12   Agent mode ships to all users                         |
|               Moves agents from preview to default.   ( source )    |
|  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  |
|  2026-06-08   Benchmark crosses parity                              |
|               First public eval above human baseline. ( source )    |
|  --------------------------------------------------------------------|
|  [ Admin: Moderation - bordered box, unchanged ]                    |
+----------------------------------------------------------------------+
```

### 2c. Parked alternative: the constellation (not building this round)

You did not want bubbles but were curious what the idea would have looked like, so here it is, clearly
parked. The constellation reframes the existing d3-hierarchy `pack()` field (trend-bubble-field.tsx)
into a short "pulse of tech" band at the top of the page: each trend a circle, size = momentum, fill =
category color, a tiny amber glyph for heating, and hovering a bubble cross-highlights its grid cell.
It is atmospheric but softer and fuzzier than the sharp index you asked for, it needs a desktop-only
enhancement path, and it competes with the grid for the top of the page. The recommendation is to ship
the two-up index now and keep `trend-bubble-field.tsx` in the repo unused, so the constellation stays
available if you ever want a richer overview mode later. Build note: remove the `ViewToggle` and the
`TrendBubbleField` import from `trends-client.tsx`, but do not delete the bubble file.

---

## 3. The Themes tag system (replacing the lifecycle stage)

**The problem you flagged.** The current `momentumLabel` (emerging / accelerating / mainstreaming /
cooling) is a lifecycle stage, and "accelerating vs mainstreaming" does not carry a clear meaning. It
tells you how mature a trend is, not why you should care.

**The idea.** Replace that slot with **Themes**: one or two plain-language tags per trend that say what
the trend touches. Your examples map directly, an AI safety trend reads `Safety`, an IPO trend reads
`Markets`. Themes are a human, scannable facet, and because they are orthogonal to the AI / Tech /
Capital category, they give the tracker a real second axis: an AI trend and a Capital trend can both be
`Markets`.

**Name (decided): THEMES.** The eyebrow / label is `THEMES`, sitting where the old stage chip sat and
in the metadata slot Typewolf uses for `FONTS`.

**Not filters (decided).** Themes render as labels on the grid cells and on the detail rail only. No
theme filter row for now; the set is small enough that filtering is not worth it yet. Easy to add later
if the catalog grows, since the vocabulary is a clean controlled set.

**Vocabulary (LOCKED).** Eleven tags, each mapped to an existing tile color so it inherits a readable
foreground. One or two per trend. "Safety" is kept (you preferred it over "Existential"). Two tags
(Security, Creators) are reserved: none of the current 22 trends touch them, but they stay in the set
for trends the cron adds later (an AI-enabled cyberattack story would be Security, an AI and copyright
fight would be Creators).

| Tag | What it means | Tile color |
| --- | --- | --- |
| Markets | valuations, deals, IPOs, funding, liquidity | sage |
| Builders | developers, engineers, the people shipping | indigo |
| Jobs | labor, automation, who does the work | honey |
| Consumers | everyday products and the people using them | sky |
| Infrastructure | compute, chips, energy, the physical layer | steel |
| Science | research frontiers, discovery, the lab | cyan |
| Safety | risk, alignment, misuse, the high-stakes harms | rose |
| Policy | regulation, law, governments, courts | stone |
| Geopolitics | nations, trade, export controls, power | coral |
| Security | cyber, fraud, defense, attacks (reserved) | mauve |
| Creators | artists, media, IP, the culture industry (reserved) | lilac |

**Curated themes for all 22 trends (LOCKED).** Ordered by momentum then name, which is the list display
order, so the "#" doubles as the soft number badge. These are the seed values for the `themes` field;
per-trend wording can still be tailored after buildout.

| # | Trend | Cat | Mom | Themes |
| --- | --- | --- | --- | --- |
| 01 | AI Coding Agents Replace Autocomplete | AI | 93 | Builders, Jobs |
| 02 | The Trillion-Dollar AI IPO Pipeline | Capital | 93 | Markets |
| 03 | Historic AI Mega-Round Concentration | Capital | 88 | Markets |
| 04 | The AI Chip Supercycle and Custom Silicon | Tech | 88 | Infrastructure, Markets |
| 05 | Big Tech AI Capex Versus Revenue Mismatch | Capital | 87 | Markets, Infrastructure |
| 06 | The Model Context Protocol Standard | AI | 87 | Builders |
| 07 | Humanoid Robots Leave the Lab | Tech | 86 | Jobs, Consumers |
| 08 | Open-Weight Models Reach Frontier Quality | AI | 86 | Builders, Geopolitics |
| 09 | The Post-Training Revolution: RL Over RLHF | AI | 85 | Science, Builders |
| 10 | Agentic AI Goes Production | AI | 84 | Builders, Jobs |
| 11 | Inference-Time Scaling and Reasoning Models | AI | 84 | Science, Infrastructure |
| 12 | Power Grid as the Binding Constraint for AI | Tech | 83 | Infrastructure, Policy |
| 13 | Small Language Models and On-Device AI | AI | 83 | Consumers, Builders |
| 14 | AI in Drug Discovery and Protein Science | Tech | 82 | Science, Consumers |
| 15 | Long-Context Windows Hit 1M to 10M Tokens | AI | 82 | Builders, Science |
| 16 | Mechanistic Interpretability Goes Mainstream | AI | 82 | Safety, Science |
| 17 | Nuclear Power and SMRs for AI Data Centers | Tech | 81 | Infrastructure, Policy |
| 18 | Physical AI and Robot World Models | AI | 81 | Science, Builders |
| 19 | Synthetic Data Becomes the Default Pipeline | AI | 81 | Builders, Science |
| 20 | AI Smart Glasses Race Heats Up | Tech | 80 | Consumers, Markets |
| 21 | The AI Safety Evaluation Crisis | AI | 76 | Safety, Policy |
| 22 | Magnificent Seven Concentration and Rotation | Capital | 74 | Markets |

Tag spread across the 22: Builders 9, Science 7, Markets 6, Infrastructure 5, Consumers 4, Jobs 3,
Policy 3, Safety 2, Geopolitics 1, plus Security and Creators reserved. Builders and Science cluster
because the set is research and infrastructure heavy; that is accurate, not a flaw, and the second tag
on most trends keeps each row from reading as a single generic label.

**One facet, one or two tags (decided).** A single facet ("what it touches"), one or two tags per
trend. No second "what is driving it" facet for now.

**Visual treatment (sharp, not pills).** Each tag is the theme word in its tile-fg color, uppercase
11px/600 `letterSpacing: '0.08em'`, comma-separated after a grey `"THEMES"` micro-label, mirroring
Typewolf's grey `"FONTS"` line. No fill, no rounded outline, so it stays sharp. Optional if you want
more pop: prefix each word with a 7px square swatch (`borderRadius: 2px`) in the tag color.

**Data implication (the one honest scope note).** There is no Themes field in the data today, so this
is the single place the redesign steps past "existing data only." It needs a small, additive, low-risk
content step, NOT a backend or pipeline change:
1. add a `themes String[]` field to the `Trend` model (Prisma additive migration via `prisma db push`),
2. curate one or two tags for each of the 22 trends (about 30 to 45 minutes once the vocabulary is
   locked), stored alongside the seed in `prisma/seed-data/trends.ts` (or a small `themes` map by slug),
3. seed or update the rows with an idempotent script.

The existing `momentumLabel` column stays untouched (backend frozen); we simply stop displaying it and
display Themes instead. The rest of the redesign does not depend on this step, the grid and detail build
fine without it and the tags just do not render until the field exists. Gated on you locking the
vocabulary. Decision 1 below.

---

## 4. Inspiration to screenshot

You already supplied the core reference (Typewolf, two screenshots, captured). The list below is the
full reference set grouped by what each teaches, so the build chat has the complete picture. The bubble
references are dropped since the field is parked.

**Two-up index grid (locked primary reference)**
- Typewolf, Top 30 Favorite Sites, https://www.typewolf.com/favorite-sites - CAPTURED. The two-per-row
  rhythm, the soft numbered badge, the name plus "FONTS" metadata line, warm restraint, airy
  separation. We adapt it by making the trend name the hero (no screenshot) and turning "FONTS" into
  "THEMES", and we add a crisp 1px rule between rows for your sharper-lines ask.

**Sharper line work (the one thing we add over Typewolf)**
- Stripe Press, https://press.stripe.com/ - the full book catalog. Capture: continuous hairline rules,
  uppercase section labels, title over description size progression, zero bordered cards. This is the
  rule-between-items discipline we layer onto the Typewolf rhythm.

**Themes labels (the "FONTS" slot)**
- Are.na, https://www.are.na - a channel page showing connected channels as flat text tags. Capture:
  flat, borderless, uppercase tag labels as quiet metadata, the model for the colored Themes words.
- The Verge or NYT article header topic tags, https://www.theverge.com - capture how a couple of colored
  topic labels read at a glance without becoming loud pills.

**Detail / brief layout (helpful to grab, this is the one area Typewolf does not cover)**
- Quanta Magazine, https://www.quantamagazine.org - any feature: first screenful (kicker, oversized
  headline, byline, opening paragraph) plus a mid-article subhead. Capture: category kicker above a big
  headline, bold sentence-case subheads dividing the argument with white space.
- Works in Progress, https://worksinprogress.co - an issue article. Capture: the distinct-weight deck
  paragraph as a content threshold, subheads as dividers, white space as the main separator.
- Linear Changelog, https://linear.app/changelog - one full entry. Capture: the borderless dated-log
  hierarchy for "Recent signals".

**Momentum signal**
- JavaScript Rising Stars, https://risingstars.js.org - any category list with a per-item read and the
  SHOW MORE expansion. Capture: a quiet per-item momentum read and tail compression, no card borders.
- The Economist style charts, search "Economist style dot plot dumbbell" - capture dot-on-track
  encodings for tightly clustered values and the one-accent-plus-gray discipline.

**Motion**
- emilkowal.ski, https://emilkowal.ski/ui/7-practical-animation-tips - examples for scale-in,
  origin-aware transforms, and the 2px blur bridge for the list-to-detail transition.

**Do you need to grab anything else?** Not strictly. Typewolf covers the list, which is the part you
care most about. The one worthwhile extra is a single detail-page reference whose feel you like (Quanta,
Works in Progress, or Stratechery) so the brief layout matches your taste, since Typewolf only shows the
index, not an article. If you grab one of those, flag what you like about it. Everything else above is
optional supporting context for the build chat.

---

## 5. What you need from me

Resolved from your reviews and folded in: two-up Typewolf-style index, name as hero, soft numbered
badge, ranking de-emphasized, crisp rules between rows, no bubble field (parked), motion at full
strength, Hanken stays with no new wordmark, add the `trend-down` icon now, the `whatItIs`-first-sentence
deck with a `whatsHappening` fallback, the facet is named **Themes**, one facet with one or two tags,
themes are labels not filters, and "Safety" is kept over "Existential".

**Open decisions (short list):**
1. **Themes content step (vocabulary now LOCKED).** The 11-tag vocabulary and the per-trend assignments
   for all 22 trends are locked in section 3. The only thing left is your go-ahead for the build chat to
   add the small `themes` field and seed those values as roadmap step 0. Per-trend wording can still be
   tailored after buildout.
2. **No-image cell, confirm.** Since trends have no screenshot, the trend name in large type is the hero
   of each cell. Confirm that reads well to you, or say if you would want a small visual element per cell
   later (for example a generated mark or the momentum gauge enlarged), which would be a separate pass.
3. **Number badge, confirm.** Recommended: keep Typewolf's soft circular number badge, category-tinted,
   as a quiet index. Options: drop it (pure unranked index) or square it off to match the sharp lines.
4. **Row dividers, confirm.** Recommended: a crisp 1px rule between rows plus a 48px column gutter (your
   sharper lines on the Typewolf rhythm). Option: pure Typewolf whitespace with no rules.
5. **Theme tag style, minor.** Recommended: colored uppercase words after a grey "THEMES" label (mirrors
   the "FONTS" line). Option: prefix each with a small square color swatch.
6. **Momentum number, minor.** Recommended: keep the quiet tabular number plus the gauge in each cell.
   Option: show only the gauge and glyph, hide the raw number.

---

## 6. Build roadmap

For the separate Claude Code build chat. Hand over this doc, the two Typewolf screenshots, and
(optional) one detail-page reference.

**Deliver in increments, not all at once.** Group the steps below into four increments and pause for
review after each one: implement, commit, show the diff, verify it works (dev server on port 3100,
Playwright for the visible surfaces), then wait for a go-ahead before starting the next increment.
- Increment 1, Themes data: step 0.
- Increment 2, List view: steps 1 to 4 (the icon, utils, and responsive hooks are prerequisites the
  list is the first to use).
- Increment 3, Detail page: step 5.
- Increment 4, Shells and QA: steps 6 to 7.

Order of work, with the exact files each step touches.

0. **(Gated) Themes content step.** Only after the vocabulary is locked (decision 1):
   `prisma/schema.prisma` add `themes String[]` to `Trend`; `prisma db push`; add the curated tags to
   `prisma/seed-data/trends.ts` (or a `themes`-by-slug map); run an idempotent update script
   (`scripts/seed-trends.ts` style) to write `themes` to the 22 rows. Backend, publish gate, cron, and
   `momentumLabel` stay untouched. If deferred, the grid and detail still build, Themes just do not
   render yet.

1. **Register the cooling icon and unify direction.** `components/ui/icon.tsx`: import `TrendDown`,
   extend the `IconName` union with `'trend-down'`, add `'trend-down': TrendDown` to `REGISTRY`. In
   `components/trends-client.tsx`, edit `directionMeta` once as the shared source used by the grid and
   `trend-detail-client.tsx`: keep the amber heating branch (`var(--color-gold)` plus `trending-up`),
   change the cooling branch from `chevron-down` to the new slate `trend-down`.

2. **Author the shared utilities.** In `components/trends-client.tsx` (or a small local module imported
   by both clients): write `usePrefersReducedMotion` from scratch (matchMedia
   `'(prefers-reduced-motion: reduce)'`, `useState` plus listener, cleanup); add `normalize(momentum,
   65, 95)` for the gauge and the ThinBar; add a `ThemeTags` component and a theme color map (tag ->
   tile name).

3. **Add the responsive class hooks.** `app/globals.css`: add `@media (max-width: 720px)` rules - the
   grid `gridTemplateColumns` collapses to one column, and the detail split
   (`minmax(0,1.35fr) 1px minmax(0,1fr)`) collapses to one column. The only place a breakpoint can live,
   since the components are inline-style only.

4. **Rebuild the list as the two-up index.** `components/trends-client.tsx`: wrap in
   `<div data-surface="editorial">`; copy in HairRule, SectionEyebrow, ArrowRight, and the
   editorial-link `<style>` block by value; restyle FilterPills into ghost text category tabs (no theme
   filter row); replace the bordered `TrendCard` stack with the two-up grid (`repeat(2, 1fr)`,
   `columnGap: 48`, crisp `borderBottom` per row); each cell renders the soft category-tinted number
   badge, kicker, name (editorial-link, 24px hero), one or two line preview, the "THEMES" colored-words
   line, and the quiet momentum read (number, dot-on-track gauge, amber glyph, concepts count); add the
   "Show 10 more" tail-compression link; wire the cell entry stagger and the gauge draw through
   `usePrefersReducedMotion`. Remove the `ViewToggle` and the `TrendBubbleField` import (leave the bubble
   file in place, parked).

5. **Rebuild the detail page.** `components/trend-detail-client.tsx`: wrap in
   `<div data-surface="editorial">`; drop the IconTile header; add the kicker, the `clamp(40-48px)`
   headline, and the `whatItIs`-first-sentence deck; build the local StreakStat-STYLE momentum hero
   (`clamp(48-64px)` plus ThinBar single fill) by copy-and-modify; replace the old STAGE stat with the
   THEMES colored-words block; keep the amber direction glyph and the accent-soft ConceptChips; render
   "Recent signals" as a borderless dated log from `topStories`; keep the admin Moderation box unchanged;
   wire the cross-fade plus headline-scale plus 2px blur transition through `usePrefersReducedMotion`.

6. **Verify the route shells.** `app/(main)/trends/page.tsx` and `app/(main)/trends/[slug]/page.tsx`:
   confirm the editorial wrap lands inside the client components (or here) and that nothing regresses;
   do NOT touch `app/api/admin/trends/route.ts` (publish gate frozen).

7. **QA.** Confirm the two-up grid collapses to one column at 720px with no JS; confirm the number badge
   and Themes render in their tile colors on both surfaces; confirm reduced-motion yields instant cells
   and a plain cross-fade; confirm the gauge dot tracks momentum across the 65-95 band; confirm zero
   dashes in any visible copy.

---

## 7. Notes and scope

**Constraints honored.**
- **Inline style only;** the only globals.css edits are the new class-based `@media (max-width: 720px)`
  responsive hooks (the grid and the detail split), the sole allowed mechanism for breakpoints.
- **`data-theme="light"` plus `data-surface="editorial"` scope:** the editorial wrap is applied inside
  the trends client subtree to get `#4255FF` and Hanken; the (main) shell still provides
  `data-theme="light"`.
- **Existing tokens and primitives only:** exact tokens cited throughout (`--text-xl`, `--color-accent`,
  `--color-text-2`, `--color-gold`, `--color-border`, the `--tile-*-fg/-bg` pairs); all primitives
  (HairRule, SectionEyebrow, ArrowRight, editorial-link, ThinBar, the 2-col split) copied by value since
  they are inlined, not exported. No new tokens.
- **Phosphor via the Icon registry:** one icon added (`trend-down` / `TrendDown`); StreakStat is
  copied-and-modified, not reused, because it hardcodes `fontSize: 28` and `value: number`.
- **One scoped content addition:** the Themes `themes` field (section 3, roadmap step 0) is the single,
  small, additive, curated step beyond "existing data only," gated on your approval. Everything else is
  visual on existing data. The all-heating seed degrades gracefully (the amber glyph reads as a quiet
  always-on indicator until cron produces a cooler).
- **Backend, publish gate, cron, seed pipeline, and `momentumLabel` column frozen** (momentumLabel is
  simply no longer displayed).
- **The list stays the a11y, mobile, and no-JS fallback;** the grid is inline plus a CSS breakpoint, so
  the true fallback is one readable column in source order, not an unstyled stack. The parked
  constellation is never the fallback.
- **Zero em dashes and en dashes** in this document and in all member-facing copy; wireframes use
  straight ASCII only.

**Where the FUTURE narrative content slots in (OUT OF SCOPE this round).** This is a visual round on
existing data plus the one scoped Themes field. When the narrative layer is built later, it lands on the
**detail page**, between the 2-column split and the "Recent signals" log, as a sequence of full-width
editorial sections under their own SectionEyebrows: a **"Viewpoints / angles"** section (multiple stances
on the trend), a **synthesis wrap-up**, and a **"Why this matters for you and for the industry / world"**
story. These reuse the same HairRule-divided prose grammar established here, so the brief extends downward
without a new template. The grid view is unaffected. Do not design or build any of this in the current
round.
