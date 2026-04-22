# STYLEGUIDE.md — BFC Member Directory Embed

## Brand tokens

| Token | Value | Use |
|---|---|---|
| `--bfc-orange` | `#FA660E` | Tier headings, primary buttons, hover borders, Member tag |
| Black | `#000000` | Embed background (dark mode) |
| Card | `#1D1D1D` | Card + modal background (dark mode) |
| Line | `#2A2A2A` | Borders (dark mode) |
| Gray-secondary | `#333333` (dark) / `#374151` (light) | **Secondary button background** (Website button) |
| Light gray | `#D4D3D3` | Sub-text, placeholders (dark mode) |
| Font | Inter (Google) | 400 / 500 / 600 / 700 / 800 |

Light mode pairs: `#F7F7F7` bg, `#FFFFFF` card, `#E5E5E5` line, `#6B7280` sub.

## Tier size hierarchy

CSS vars on `.bfc-tier[data-tier-rank="N"]`. First rendered tier = rank 0 (largest). Driven by rendered position, not tier id.

| Rank | min-h | logo max | grid-min | pad y/x | use |
|---|---|---|---|---|---|
| 0 | 150px | 92px | 230px | 28 / 22 | Founding Tier |
| 1 | 130px | 78px | 200px | 24 / 18 | (currently empty — Chairman's hides, so this shifts down) |
| 2 | 110px | 64px | 160px | 20 / 16 | Executive Tier (default) |
| 3 | 95px  | 54px | 145px | 16 / 14 | Premier Tier |
| 4 | 82px  | 44px | 125px | 12 / 12 | Industry Tier |

Rank > 4 falls back to rank-2 defaults.

## Icons (solid heroicons, inline SVG)

| Slot | Icon | Meaning |
|---|---|---|
| Member badge | `check-badge` | Verified member |
| Vendor badge | `briefcase` | Service provider |
| Public badge | `building-library` | Publicly listed (institutional, NOT a chart glyph) |
| Private badge | `lock-closed` | Privately held |
| Tier row | `tag` | Tier membership |
| Website button | `globe-alt` | External website |
| Directory button | `identification` | BFC member profile page |
| External link | `arrow-up-right-from-square` | External nav indicator |

All badges live inside the detail modal. Cards are logo-only.

## Embed Layout Rules

- `.bfc-dir` padding: `30px 28px 110px` (top / horizontal / bottom). Bottom is intentionally large — breathes from WP footer.
- Card grid: `grid-template-columns: repeat(auto-fill, minmax(var(--grid-min), 1fr))`, `gap: var(--grid-gap)`
- Tier heading (`h2`): `display:flex; gap:14px` + `::after` pseudo-element — 1px `rgba(250,102,14,0.25)` line that fills remaining width (subtle divider from title to edge)
- Card hover: `translateY(-2px) + border-color: #FA660E`
- Button hover: `filter: brightness(1.12)` (no color shift)

## Toolbar

Single row (desktop): `display: flex; gap: 8px`. Search = `flex: 2`; each select = `flex: 1`. Shrinks via `min-width: 0 + text-overflow: ellipsis`. Below 640px: `flex-wrap: wrap`; search 100%, each select 50%.

Sort dropdown options: Tier order / Name A→Z / Name Z→A. **No ticker sort options** (tickers deprecated).

## Detail Modal

- Overlay: `position: fixed; inset: 0; background: rgba(0,0,0,.72); backdrop-filter: blur(6px)`
- **Mounted inside `.bfc-dir` root** (not `document.body`) so CSS vars inherit AND WP theme rules with `body >` selectors can't reach it
- Card: `max-width: 400px; padding: 40px 32px 32px; border-radius: 16px`
- Close button (top-right, 36×36): transparent → `#2A2A2A` hover
- Action buttons (side-by-side, gap 10px):
  - `[🌐 Website]` — `background: #333333` (dark) / `#374151` (light), `color: #fff`
  - `[📋 Directory]` — `background: #FA660E`, `color: #fff`
- Button order: Website FIRST (secondary), Directory SECOND (primary)
- Every interactive element explicitly styles `:link / :visited / :hover / :active / :focus`

## WordPress Theme Bleed Defense

The generated embed CSS ALWAYS uses these patterns:

1. **Every rule prefixed with `.bfc-dir`** — beats WP theme tag selectors like `button:hover`, `a:hover`
2. **Literal colors** (e.g., `#FA660E`) alongside `var(--bfc-orange)` for robustness when CSS var inheritance fails
3. **Explicit button resets**: `background`, `border`, `color`, `box-shadow`, `outline` set on every interactive state
4. **`text-decoration: none`** on card buttons and modal links (overrides WP default link underline)
5. **Modal mounted inside `.bfc-dir`** — NOT `document.body` — so CSS vars inherit and scoped WP rules can't reach
6. **All link pseudo-states explicit** (`:link, :visited, :hover, :active, :focus`) — no browser `:visited` purple leakage

## Don't

- ❌ Use Bitcoin Orange `#F7931A` — BFC is `#FA660E`
- ❌ Use a chart/trending-up metaphor for Public (ambiguous with volatile-stock connotation)
- ❌ Display tickers anywhere (field deprecated; any existing tickers wiped on load)
- ❌ Put text captions under logos — cards are logo-only; info lives in the detail modal
- ❌ Add an outer border on `.bfc-dir` (removed per brand direction)
- ❌ Use Clearbit, favicon APIs, or any external logo CDN — logos ship from this repo's `/logos/`

## Button Semantics

- **Primary** (orange, Directory Listing): the main CTA — user intent is "learn more about this member in the BFC ecosystem"
- **Secondary** (gray, Website): the escape hatch to the external site

Both open in new tab with `target="_blank" rel="noopener"`.
