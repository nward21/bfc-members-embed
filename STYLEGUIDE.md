# STYLEGUIDE.md — BFC Member Directory Embed

## Brand tokens (always)
| Token | Value | Use |
|---|---|---|
| `--bfc-orange` | `#FA660E` | Tier headings, primary buttons, hover borders, tag colors (Member) |
| Black | `#000000` | Embed background (dark mode) |
| Card | `#1D1D1D` | Card + modal background (dark mode) |
| Line | `#2A2A2A` | Borders (dark mode) |
| Light gray | `#D4D3D3` | Sub-text, placeholders (dark mode) |
| Font | Inter (Google) | 400 / 500 / 600 / 700 / 800 |

Light mode pairs: `#F7F7F7` bg, `#FFFFFF` card, `#E5E5E5` line, `#6B7280` sub.

## Tier size hierarchy

CSS vars on `.bfc-tier[data-tier-rank="N"]` for N ∈ 0..4. First rendered tier is rank 0 (largest). Ranks > 4 fall back to rank-2 defaults.

| Rank | min-h | logo max | grid-min | pad | use |
|---|---|---|---|---|---|
| 0 | 150px | 92px | 230px | 28/22 | Founding Tier |
| 1 | 130px | 78px | 200px | 24/18 | Chairman's Tier |
| 2 | 110px | 64px | 160px | 20/16 | Executive Tier (default) |
| 3 | 95px  | 54px | 145px | 16/14 | Premier Tier |
| 4 | 82px  | 44px | 125px | 12/12 | Industry Tier |

Driven by rendered position, not tier id — reorder in admin and hierarchy follows.

## Icons (solid heroicons, inline SVG)

| Slot | Icon | Semantic |
|---|---|---|
| Member | `check-badge` (solid) | Verified member |
| Vendor | `briefcase` (solid) | Service provider |
| Public | `building-library` (solid) | Publicly listed (not a chart — deliberately avoids stock ticker metaphor) |
| Private | `lock-closed` (solid) | Privately held |
| Tier row | `tag` (solid) | Tier membership |
| External link | `arrow-up-right-from-square` (solid) | "Visit website" button |

Only shown inside the detail modal. Cards are logo-only.

## Embed layout rules

- Container padding: `30px 28px 110px` (top / horizontal / bottom). Bottom is intentionally large to breathe from WP footer
- Card grid: `grid-template-columns: repeat(auto-fill, minmax(var(--grid-min), 1fr))` with `gap: var(--grid-gap)`
- Tier heading (`h2`) uses `display: flex; align-items: center; gap: 14px` + a `::after` 1px orange-25%-opacity line that fills remaining width — a subtle divider from title to container edge
- Card hover: `translateY(-2px)` + `border-color: #FA660E`
- Button hover: `filter: brightness(1.1)` — no color shift

## Toolbar layout

Single row (desktop): `flex` with `gap: 8px`. Search = `flex: 2`; each select = `flex: 1`. Shrinks via `min-width: 0` + `text-overflow: ellipsis`. Below 640px: reflows to `flex-wrap: wrap` with search 100% and each select 50%.

## Modal (detail view)

- Overlay: `position: fixed; inset: 0; background: rgba(0,0,0,.72); backdrop-filter: blur(6px)`
- Mounted **inside** `.bfc-dir` (not document.body) so CSS vars + specificity work
- Card: `max-width: 400px; padding: 40px 32px 32px; border-radius: 16px`
- Close button: top-right, 36×36 transparent → `#2A2A2A` on hover
- Link button: `background: #FA660E; color: #fff; padding: 11px 22px; border-radius: 8px`
- Every interactive element explicitly styles all of `:link / :visited / :hover / :active / :focus` so no browser/WP-theme default can leak through

## WordPress-bleed defense

The generated embed CSS **always** uses these patterns:
1. Every rule prefixed with `.bfc-dir .` (beats WP theme tag selectors like `button:hover`)
2. Literal colors (`#FA660E`) over `var(--bfc-orange)` in critical cases for robustness when CSS var inheritance fails
3. Explicit button reset: `background, border, color, box-shadow, outline` all set, even on `:focus`
4. `text-decoration: none` on card buttons and modal link (overrides WP's default link underline)
5. Detail modal mounted inside `.bfc-dir` — not `document.body` — so CSS vars inherit and scoped WP theme rules can't reach it

## Do not

- Don't use Bitcoin Orange `#F7931A` — BFC brand is `#FA660E`
- Don't use chart/trending-up metaphor for Public (confusing with volatile-stock association)
- Don't display tickers in public embed (data field kept for admin derivation only)
- Don't put text captions under logos — cards are logo-only; info lives in the detail modal
- Don't add an outer border on `.bfc-dir` — removed per brand direction
