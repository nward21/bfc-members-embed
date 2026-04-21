# ARCHITECTURE.md — BFC Member Directory Embed

## One-line
Static HTML/CSS/JS tool that generates a self-contained embed snippet for a WordPress Custom HTML block. No backend; state in localStorage; logos served from Vercel.

## Dependencies (all CDN, admin-only)

| Package | Use | Where |
|---|---|---|
| `tailwindcss` (CDN) | Admin UI utility classes | `index.html` only |
| `lucide` (latest, CDN) | Admin UI icons | `index.html` only |
| `sortablejs@1.15.2` | Drag-and-drop | `index.html` only |
| Google Fonts: Inter | Typography | Both files |

The generated **embed output has zero external deps** — only inline CSS, HTML, and a vanilla JS IIFE. Required because it must run inside a WP Custom HTML block with no guaranteed runtime.

## Data Flow

```
          index.html (admin)                          preview.html
               │                                           │
               │  writes                                   │  reads
               ▼                                           ▼
         ┌─────────────────────────────────────┐
         │  localStorage['bfc_directory_v7']   │
         └─────────────────────────────────────┘
               │
               │  storage event fires cross-tab
               ▼
           preview.html auto-re-renders
```

When user clicks **Copy embed**, `generateEmbed(state, theme)` produces a standalone `<style>…</style><div class="bfc-dir">…</div><script>…</script>` string that is pasted into WordPress. Logos in the embed reference `https://bfc-members-embed.vercel.app/logos/{slug}-logo-{variant}.png`.

## State Schema

```ts
interface State {
  tiers: Tier[];
}
interface Tier {
  id: string;           // e.g. "t_founding"
  name: string;         // e.g. "Founding Tier"
  companies: Company[];
}
interface Company {
  id: string;           // e.g. "c_strategy" — stable, used as migration key
  name: string;
  ticker: string;       // stored but never displayed publicly
  type: 'Member' | 'Vendor';
  visibility: 'Public' | 'Private';
  logoSlug: string;     // resolves to logos/{slug}-logo-{variant}.png
  logoDataUrl: string;  // optional base64; if set, overrides slug
  url: string;          // '#' treated as placeholder/no-link in practice
}
```

## Logo Resolution

```
companyLogoSrc(c, theme)         // admin/preview display
  1. c.logoDataUrl                → data URI
  2. AVAILABLE_LOGOS has c.logoSlug → `logos/{slug}-logo-{variant}.png`  (relative)
  3. else ''

companyEmbedLogoSrc(c, theme)    // generated embed code
  1. c.logoDataUrl                → data URI
  2. c.logoSlug                   → `{WP_CDN}{slug}-logo-{variant}.png` (absolute)
  3. else ''
```

Theme → variant: `dark` → `-light.png`; `light` → `-dark.png` (logos inverted for contrast).

## Migration System (`loadState`)

Applied idempotently on every read. Never overwrites user edits.

| Map | Keyed on | Behavior |
|---|---|---|
| `TIER_RENAMES` | Tier `.name` (string) | Rename if matches a known legacy name |
| `URL_MIGRATIONS` + `LEGACY_URLS` | Company `.id` | Replace URL only if current value is in LEGACY_URLS |
| `REMOVE_COMPANY_IDS` | Company `.id` (Set) | Filter out companies by id |
| `ADD_COMPANIES` | Tier `.id` → Company[] | Append companies that don't already exist by id |
| `VISIBILITY_OVERRIDES` | Company `.id` → 'Public'\|'Private' | Force visibility if different |

When any migration runs, state is re-serialized to localStorage.

## Generate-Embed Contract

Function signature: `generateEmbed(state, theme) => string`

Output structure (always 3 top-level nodes in this order):
1. `<style>` — all `.bfc-*` selectors prefixed with `.bfc-dir` for WP-theme specificity
2. `<div class="bfc-dir">` — toolbar + tier sections
3. `<script>` — IIFE that wires filter/sort/modal, mounted via `document.currentScript.previousElementSibling`

Critical: literal `</style>` and `</script>` strings inside the template use `<\/style>` / `<\/script>` escapes to survive HTML parsing.

## Public Endpoints / URLs

| URL | Serves |
|---|---|
| `https://bfc-members-embed.vercel.app/` | Admin (index.html) |
| `https://bfc-members-embed.vercel.app/preview` | Preview (preview.html, via `cleanUrls: true`) |
| `https://bfc-members-embed.vercel.app/logos/{slug}-logo-{variant}.png` | 95 logo files with 1yr immutable cache + CORS `*` |

No API, no auth, no database.

## Deploy Pipeline (manual for now)

```
git add <files>
git commit -m "…"           # triggers nothing — no git-hook CI
git push origin main        # updates GitHub repo only
vercel --yes --prod         # explicit deploy, ~10 seconds
```

Vercel project not yet linked to GitHub for auto-deploy. One-time fix in Vercel dashboard → project → Settings → Git.

## Storage Versioning

- `STORAGE_KEY` = `'bfc_directory_v7'` — bumping nukes all user edits and forces reseed
- Prefer migrations in `loadState()` over key bumps; key bumps reserved for breaking schema changes
