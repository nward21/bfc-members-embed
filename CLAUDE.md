# CLAUDE.md — BFC Member Directory WP Embed

## Purpose
Single-file admin tool + public-facing embed for the Bitcoin For Corporations member directory. No backend. State lives in browser localStorage. Embed code is copy-pasted into a WordPress Custom HTML block on bitcoinforcorporations.com.

## Stack
- HTML + vanilla JS + Tailwind (admin only, CDN) + Lucide (admin only, CDN) + SortableJS (admin only, CDN)
- Embed output is self-contained: inline `<style>` + plain HTML + inline `<script>` IIFE — no runtime deps
- Hosted on Vercel (static). GitHub: `nward21/bfc-members-embed`. Prod: `https://bfc-members-embed.vercel.app/`

## File Layout
```
index.html        Admin UI (CRUD, drag-drop, import/export JSON+CSV, embed generator, Copy embed)
preview.html      Full-page preview + own Copy-embed button; reads localStorage
members.csv       Committed CSV snapshot of current seed (Tier,Company,Type,Visibility,Logo Slug,Website,Directory)
logos/            95 PNG files, {slug}-logo-{light|dark}.png convention
vercel.json       Static hosting + /logos/* immutable cache + CORS
README.md         Deploy instructions
.gitignore        Excludes screenshots/, .DS_Store, .vercel, etc.
```

## Current Progress

### Data model
- `state.tiers[].companies[]` — Company: `{ id, name, ticker (deprecated), type: 'Member'|'Vendor', visibility: 'Public'|'Private', logoSlug, logoDataUrl, url, directoryUrl }`
- `ticker` still in schema but never surfaced in UI; migration blanks it on load
- localStorage key: `bfc_directory_v7` (bump to force full reseed)
- `localStorage['bfc_directory_v7_saved_at']` — ISO timestamp for "Saved X ago" indicator

### Tier roster (live)
- **Founding Tier (2):** Strategy, BTC Inc
- **Chairman's Tier (0):** empty — auto-hides in embed
- **Executive Tier (26):** Treasury + 25 others (aifinyo…Strive)
- **Premier Tier (7):** BlockSpaces, Capital B, Jetking, Metaplanet, Next Layer Capital, Paystand, UTXO
- **Industry Tier (6):** ARCH, Locate Technologies, Matador, OranjeBTC, Uproot Company, XCE

Total: **41 companies**. All Directory URLs are `#` placeholder pending real BFC listing pages.

### Features shipped
- Drag/drop tier + company reordering (admin only, SortableJS)
- Logo upload (base64 data URI) OR slug reference (44 known slugs in `AVAILABLE_LOGOS`)
- Theme toggle dark/light (dark = BFC default); logo variants auto-swap
- Tier hierarchy via CSS vars keyed to `data-tier-rank` — first rendered tier is largest
- Orange tier-divider line after each h2 heading
- **Cards are pure logo tiles**; click opens detail modal with:
  - Big logo, name, Member/Vendor badge, Public/Private badge, Tier row
  - Two action buttons side-by-side: `[🌐 Website]` (gray `#333333`) + `[📋 Directory]` (orange)
- End-user toolbar (embed + preview): search, type filter, visibility filter, tier filter, sort (Tier order / Name A-Z / Z-A). Single row, shrinks-to-fit to any container width. Ticker sort options removed.
- Copy embed button on both admin AND preview. Export JSON, Export CSV also on admin.
- "Saved X ago" indicator (flashes orange then green on every saveState)
- Cross-tab sync: preview listens for `storage` event and auto-re-renders on admin save
- **CSS hardened against WordPress theme bleed**: every selector prefixed with `.bfc-dir`, modal overlay appended to `root` (not `document.body`) so vars inherit, explicit `:link/:visited/:hover/:active/:focus` on all interactive elements, literal `#FA660E` instead of `var(--bfc-orange)` in embed critical paths
- Embed padding: `30px top / 28px h / 110px bottom` — large bottom breathes from WP footer

### Migration system (in `loadState`, idempotent, preserves user edits)
- `TIER_RENAMES` — "X Members" → "X Tier"
- `URL_MIGRATIONS` + `LEGACY_URLS` — replace URL only if current matches a known-legacy value
- `REMOVE_COMPANY_IDS` — drop companies by id (currently: `c_semler`)
- `ADD_COMPANIES` — insert new seed companies into target tier if missing (Paystand, Mangrove)
- `VISIBILITY_OVERRIDES` — force visibility by id (Nakamoto → Public)
- `TYPE_OVERRIDES` — force Member/Vendor by id (6 companies: Byte Federal, mNAV, Locate, OranjeBTC, Uproot, XCE)
- `MOVE_TO_TIER` — one-time tier move (Treasury → Executive, unshift to top)
- Ticker cleanup — any non-empty ticker is blanked on load (deprecation)
- `directoryUrl` default — any missing field defaults to `'#'`

### Edit semantics
- Editing a company within the same tier **preserves index**; changing tier appends to the new tier's end
- Drag/drop fires `syncFromDOM()` → rebuilds state from DOM order

## Next Steps

Priority order:

1. **Fill in real Directory URLs** — 41 companies all set to `#` placeholder. Bulk-edit via `Export CSV` → Google Sheets → (future) CSV import
2. **CSV Import feature** — mirror of Export CSV so users can bulk-edit in Sheets and push back
3. **Aifinyo position one-off** — user-local state has it at end of Executive; needs manual drag or a "Reset tier order" button offered but not built
4. **Connect Vercel → GitHub for auto-deploy** — currently requires manual `vercel --prod` after every commit
5. **Verify remaining unverified URLs** — BTC Inc, crypto.com, DDC Enterprise, Metaplanet, Samara, Strive (guessed)
6. **Decide on OranjeBTC duplicate** — Oranje BTC (Executive) and OranjeBTC (Industry) are the same company with the same logo/URL; duplicated per tier chart
7. **Custom domain** — `members.bfcvip.com` instead of `*.vercel.app`
8. **Extract `generateEmbed` → shared JS** — currently duplicated across index.html + preview.html

## Technical Debt

| Item | Impact | Notes |
|---|---|---|
| `generateEmbed()` duplicated in index.html + preview.html | Medium | Every change requires edits in two places. Extract to shared `embed-generator.js` |
| Migration maps (7 of them) live inline in index.html | Medium | `TIER_RENAMES`, `URL_MIGRATIONS`, `REMOVE_COMPANY_IDS`, `ADD_COMPANIES`, `VISIBILITY_OVERRIDES`, `TYPE_OVERRIDES`, `MOVE_TO_TIER`. Will grow unwieldy. Consider numbered migration array + state version field |
| `ticker` still in Company schema (empty string) | Low | Ticker UI removed but field still serialized in state/JSON export. Could prune when doing a v8 reseed |
| `derivedVisibility()` helper still exists | Low | Only used during initial seed and falls back to ticker presence. With tickers gone, all new Adds default to Private. Simplify or rename |
| All 41 companies have `directoryUrl: '#'` | Medium — user-visible | Placeholder; needs real BFC member-page URLs |
| No CSV import yet | Medium — user asked for bi-directional | Export CSV shipped, Import CSV not yet. Would close the loop with Google Sheets editing |
| Vercel not git-linked | Low | Manual `vercel --prod` each time |
| OranjeBTC (Industry) duplicates Oranje BTC (Executive) | Low | Same logo/URL; was in original tier chart. Unresolved by user |
| Admin `Reset to default` button | Low | Offered to user; not yet built |
| Two places in CSS still use legacy 500 KB upload alert without UI feedback | Very low | Works via `alert()`; could be a toast |

## Security
**No secrets. No API keys. No PII.** Static frontend only. All company data is public (already on bitcoinforcorporations.com). Logo files are public marketing assets. No env vars required or stored.

## Handoff Summary (3 sentences, paste-ready)

> BFC Member Directory WP embed tool at `nward21/bfc-members-embed`, live `https://bfc-members-embed.vercel.app/` (manual deploy via `vercel --prod`); admin (index.html) and public embed share a `state.tiers[].companies[]` schema keyed `bfc_directory_v7` in localStorage, with seven idempotent migration maps in `loadState()` (TIER_RENAMES, URL_MIGRATIONS, REMOVE/ADD_COMPANIES, VISIBILITY/TYPE_OVERRIDES, MOVE_TO_TIER + a ticker deprecation pass) that upgrade existing users non-destructively. Current roster: 41 companies across Founding/Executive/Premier/Industry tiers (Chairman's empty + auto-hidden); every card opens a detail modal with side-by-side `[🌐 Website]` (gray `#333333`) and `[📋 Directory]` (BFC orange `#FA660E`) action buttons, where Directory URLs are all `#` placeholder pending real BFC member-page links. Embed CSS is hardened against WordPress theme bleed via universal `.bfc-dir` prefix + explicit pseudo-state coverage + modal mounted inside `.bfc-dir` root; biggest open tasks are a CSV import (to pair with the just-shipped Export CSV), filling in real Directory URLs, and linking Vercel to GitHub for auto-deploy.
