# ARCHITECTURE.md — BFC Member Directory Embed

## One-line
Static HTML/CSS/JS tool that generates a self-contained WordPress-embed snippet. No backend. State in localStorage. Logos served from Vercel.

## Dependencies (admin-only, CDN)

| Package | Where | Purpose |
|---|---|---|
| `tailwindcss` (CDN) | `index.html` only | Admin UI utility classes |
| `lucide` (latest, CDN) | `index.html` only | Admin UI icons |
| `sortablejs@1.15.2` | `index.html` only | Drag-and-drop |
| Google Fonts: Inter | Both files | Typography |

**The generated embed output has zero external deps** — only inline CSS, plain HTML, and one vanilla JS IIFE. Required because the embed runs inside a WordPress Custom HTML block with no guaranteed runtime.

## Data Flow

```
          index.html (admin)                          preview.html
               │                                           │
               │  writes on any edit                       │  reads on load + storage event
               ▼                                           ▼
         ┌─────────────────────────────────────┐
         │  localStorage['bfc_directory_v7']   │
         └─────────────────────────────────────┘
                         │
                         │  Copy embed (either page)
                         ▼
           generateEmbed(state, theme) → self-contained string
                         │
                         │  paste into WP Custom HTML block
                         ▼
             bitcoinforcorporations.com/members
                     (public site)

           [logo fetches] → https://bfc-members-embed.vercel.app/logos/*
```

Cross-tab sync: preview listens to `window.storage` event; when admin saves, preview auto-re-renders.

## State Schema

```ts
interface State {
  tiers: Tier[];
}
interface Tier {
  id: string;                 // e.g. "t_founding"
  name: string;               // e.g. "Founding Tier"
  companies: Company[];
}
interface Company {
  id: string;                 // e.g. "c_strategy" — stable migration key
  name: string;
  ticker: string;             // DEPRECATED — still in schema, always empty in UI
  type: 'Member' | 'Vendor';
  visibility: 'Public' | 'Private';
  logoSlug: string;           // → logos/{slug}-logo-{variant}.png
  logoDataUrl: string;        // optional base64; if set, overrides slug
  url: string;                // website URL ('#' means placeholder)
  directoryUrl: string;       // BFC member-page URL (all '#' currently)
}
```

## Logo Resolution

```
companyLogoSrc(c, theme)       // admin/preview display
  1. c.logoDataUrl              → data URI
  2. AVAILABLE_LOGOS has slug   → `logos/{slug}-logo-{variant}.png`  (relative)
  3. else ''

companyEmbedLogoSrc(c, theme)  // generated embed code
  1. c.logoDataUrl              → data URI
  2. c.logoSlug                 → `{WP_CDN}{slug}-logo-{variant}.png`  (absolute)
  3. else ''
```

Theme → variant: `dark` → `-light.png`, `light` → `-dark.png` (logos inverted for contrast).

WP_CDN constant: `https://bfc-members-embed.vercel.app/logos/`

## Migration System (`loadState` — runs on every read, idempotent)

Applied in this order; never overwrites user edits.

| Map / Pass | Keyed on | Behavior |
|---|---|---|
| `TIER_RENAMES` | Tier `.name` (string) | Rename if matches a legacy name |
| `REMOVE_COMPANY_IDS` | Company `.id` (Set) | Filter out companies |
| `URL_MIGRATIONS` + `LEGACY_URLS` | Company `.id` | Replace URL only if current is in LEGACY_URLS |
| `VISIBILITY_OVERRIDES` | Company `.id` → 'Public'/'Private' | Force visibility |
| `TYPE_OVERRIDES` | Company `.id` → 'Member'/'Vendor' | Force type |
| `directoryUrl` default | Company `.directoryUrl` | Set to `'#'` if null/undefined |
| Ticker cleanup | Company `.ticker` | Blank any non-empty value (ticker deprecated) |
| `ADD_COMPANIES` | Tier `.id` → Company[] | Append companies that don't already exist by id |
| `MOVE_TO_TIER` | Company `.id` → Tier `.id` | One-time tier move (unshift to top of target) |

When any migration mutates state, re-serialize to localStorage.

## Generate-Embed Contract

Function: `generateEmbed(state, theme) => string`

Output structure (always in this order):
1. `<style>` — all selectors prefixed with `.bfc-dir` for WP theme specificity defense
2. `<div class="bfc-dir">` — toolbar + tier sections
3. `<script>` — IIFE that finds itself via `document.currentScript.previousElementSibling`, wires filter/sort/modal

Critical escaping: any literal `</style>` or `</script>` inside template strings is written as `<\/style>` / `<\/script>` to survive HTML parsing.

The IIFE appends a detail-modal overlay to `root` (the `.bfc-dir` element) — NOT `document.body` — so CSS variables inherit and WP theme rules can't reach inside via body-scoped selectors.

## Detail Modal HTML Contract

```
<div class="bfc-modal-overlay bfc-open">
  <div class="bfc-modal">
    <button class="bfc-modal-close">×</button>
    <div class="bfc-modal-logo"><img .../></div>
    <h3 class="bfc-modal-name">...</h3>
    <div class="bfc-modal-meta">
      <div class="bfc-modal-row">[Member|Vendor icon] [label]</div>
      <div class="bfc-modal-row">[Public|Private icon] [label]</div>
      <div class="bfc-modal-row">[Tier icon] [tier name]</div>
    </div>
    <div class="bfc-modal-actions">
      <a class="bfc-modal-btn bfc-modal-btn-secondary">[Globe] Website</a>   ← gray  #333333
      <a class="bfc-modal-btn bfc-modal-btn-primary">[Directory] Directory</a> ← orange #FA660E
    </div>
  </div>
</div>
```

Button order: Website (secondary) first, Directory (primary) second.

## Public Endpoints / URLs

| URL | Serves |
|---|---|
| `https://bfc-members-embed.vercel.app/` | Admin (index.html) |
| `https://bfc-members-embed.vercel.app/preview` | Preview (preview.html, via `cleanUrls: true`) |
| `https://bfc-members-embed.vercel.app/logos/{slug}-logo-{variant}.png` | 95 logo files (1yr immutable cache, CORS `*`) |
| `https://bfc-members-embed.vercel.app/members.csv` | Committed CSV snapshot |

No API, no auth, no database.

## Data Export

Two buttons in admin header:
- **Export JSON** — full state dump (can be re-imported via Import JSON)
- **Export CSV** — 7-column CSV: Tier, Company, Type, Visibility, Logo Slug, Website, Directory. Google Sheets / Excel compatible. Quoted escaping for commas/quotes/newlines.

CSV **import** not yet implemented.

## Deploy Pipeline (manual)

```
git add <files>
git commit -m "…"           # no git-hook CI
git push origin main        # updates GitHub repo only
vercel --yes --prod         # explicit deploy, ~10 seconds
```

Vercel project not yet linked to GitHub. One-time fix in Vercel dashboard → project → Settings → Git.

## Storage Versioning

- `STORAGE_KEY = 'bfc_directory_v7'`
- Bumping the key nukes all user edits and forces reseed
- Prefer migrations over bumps; bumps reserved for breaking schema changes
