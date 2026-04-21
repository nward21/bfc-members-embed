# CLAUDE.md — BFC Member Directory WP Embed

## Purpose
Single-file admin tool + public-facing embed for the Bitcoin For Corporations member directory. No backend. State lives in browser localStorage. Embed code is copy-pasted into a WordPress Custom HTML block on bitcoinforcorporations.com.

## Stack
- HTML + vanilla JS + Tailwind (admin only, via CDN) + Lucide (admin only, via CDN) + SortableJS (admin only, via CDN)
- Embed output is fully self-contained: inline `<style>` + plain HTML + inline `<script>` IIFE
- Hosted on Vercel (static). GitHub: `nward21/bfc-members-embed`. Production: `https://bfc-members-embed.vercel.app/`

## File Layout
```
index.html        Admin UI (CRUD, drag-drop, import/export, embed generator)
preview.html      Full-page preview + own Copy-embed button; reads from localStorage
logos/            95 PNG files, {slug}-logo-{light|dark}.png convention
vercel.json       Static hosting + /logos/* cache-immutable + CORS
README.md         Deploy instructions
.gitignore        Excludes screenshots/, .DS_Store, .vercel, etc.
```

## Current Progress

### Data model
- `state.tiers[].companies[]` — each company: `{ id, name, ticker, type: 'Member'|'Vendor', visibility: 'Public'|'Private', logoSlug, logoDataUrl, url }`
- localStorage key: `bfc_directory_v7` (bump version to force full reseed)
- `localStorage['bfc_directory_v7_saved_at']` — ISO timestamp for "Saved X ago" indicator

### Features shipped
- Drag/drop tier ordering + company reordering via SortableJS (admin only)
- Logo upload (base64 data URI) OR slug reference (39 known slugs in `AVAILABLE_LOGOS`)
- Theme toggle (dark/light). Light mode uses `-dark.png` variants; dark uses `-light.png`
- Tier hierarchy via CSS vars keyed to `data-tier-rank` — first rendered tier is largest
- Orange tier-divider line (1px rgba(250,102,14,0.25)) after each h2
- Cards are pure logo tiles; click opens a detail modal
- Detail modal: logo, name, Member/Vendor badge, Public/Private badge, tier row, "Visit website" button. No ticker displayed (hidden in public, field still exists)
- End-user toolbar (embed + preview): search, type filter, visibility filter, tier filter, sort (tier order / name A-Z / Z-A). Single row, shrinks-to-fit any container width
- Copy embed button on both admin and preview, modal with generated code + copy-to-clipboard
- "Saved X ago" indicator flashes orange then green on every saveState()
- Cross-tab sync: preview listens to `storage` event and re-renders when admin saves
- CSS hardened against WP theme bleed: every selector prefixed with `.bfc-dir`, modal appended to root (not document.body), explicit `:link/:visited/:hover/:active/:focus` on all interactive elements, literal `#FA660E` instead of `var(--bfc-orange)` in critical paths

### Migration system (in loadState, idempotent)
- `TIER_RENAMES` — "X Members" → "X Tier"
- `URL_MIGRATIONS` + `LEGACY_URLS` — replace empty or placeholder URLs with current canonical URLs, only if current value matches a known-legacy string (preserves manual edits)
- `REMOVE_COMPANY_IDS` — drop companies from state by id (currently: `c_semler`)
- `ADD_COMPANIES` — insert new seed companies into specific tiers if they don't exist (currently: Paystand → Premier, Mangrove → Executive)
- `VISIBILITY_OVERRIDES` — explicit Public/Private overrides by id (currently: Nakamoto → Public)

### Edit semantics
- Editing a company within the same tier **preserves index**; changing tier appends to the new tier's end
- Drag/drop triggers `syncFromDOM()` to rebuild state from card order

## Next Steps

Ordered by user value, not effort.

1. **Manual reorder fix** — Aifinyo is stuck at the end of Executive Tier in local state due to pre-fix bug; user needs to drag it, or add a "Reset tier order" UI
2. **Connect Vercel → GitHub** — currently `vercel --prod` runs manually after each push; one-time setup in Vercel dashboard enables auto-deploy on push
3. **Verify unverified URLs** — BTC Inc (`btcinc.com`), crypto.com, DDC Enterprise, Metaplanet, Samara, Strive were guessed from patterns; never confirmed
4. **Decide on OranjeBTC duplicate** — Oranje BTC is in both Executive Tier and Industry Tier (matches original tier chart). User was aware but no action taken
5. **Custom domain** — currently on `*.vercel.app`. Point `members.bfcvip.com` or similar for cleaner embed URLs
6. **Extract `generateEmbed` into shared JS** — currently duplicated in index.html + preview.html

## Technical Debt

| Item | Impact | Notes |
|---|---|---|
| `generateEmbed()` duplicated across index.html + preview.html | Medium — every embed change requires editing two files | Extract to `embed-generator.js` and `<script src=>` from both |
| Migration maps (TIER_RENAMES, URL_MIGRATIONS, ADD_COMPANIES, REMOVE_COMPANY_IDS, VISIBILITY_OVERRIDES) live inline in index.html | Low — will grow unwieldy | Consider a `migrations.js` with numbered step array and migration version pointer |
| Ticker data field still stored but never displayed in public embed | Low — may confuse future maintainers | Keep for now (admin still uses it for Public/Private derivation on Add) |
| `Solar Strategy` URL is `#` placeholder | Low — cosmetic | Replace once real URL exists |
| `OranjeBTC` (Industry) duplicates `Oranje BTC` (Executive) — same logo, URL, name sans space | Low | Intentional per tier chart; re-verify with stakeholder |
| Vercel project not linked to GitHub | Low | Manual `vercel --prod` after each commit. Fix in Vercel dashboard |
| Embed JS uses `'...'+'...'` string concat in several spots | Very low | Stylistic. Works identically |
| No validation on uploaded logo file size beyond 500 KB soft check | Low | Browser alert, doesn't block |
| Storage at v7 — accumulating technical debt in loadState() migration | Low | Consider a `STATE_VERSION` field per tier/company instead of global bump |

## Security
No secrets. No API keys. No PII. Static frontend only. All company data is public (already on bfc.com). Logo files are marketing assets meant for public display.

## Handoff Summary (3 sentences)

Single-file BFC member directory tool at `nward21/bfc-members-embed` → live at `bfc-members-embed.vercel.app`. Admin + preview share a state model (`tiers → companies`, keyed `bfc_directory_v7`) with an idempotent migration system in `loadState()` that renames tiers, patches URLs, adds/removes companies, and overrides visibility when legacy state is detected — never overwriting user edits. Embed output is a self-contained `<style>/div/script>` block with a 3-axis filter + sort toolbar, click-to-open detail modal, CSS hardened against WordPress theme bleed via `.bfc-dir` specificity + explicit link pseudo-states.
