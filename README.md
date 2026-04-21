# BFC Member Directory — WordPress Embed

Single-file admin tool + public embed for the Bitcoin For Corporations member directory.

- **index.html** — admin UI. Drag-and-drop tiering, search, logo upload, JSON export, copy-embed.
- **preview.html** — full-page preview of the public embed (what visitors see).
- **logos/** — master light/dark logo PNGs, one pair per company.
- **vercel.json** — static hosting config with long-cache headers on `/logos/*`.

## Brand

- Primary orange: `#FA660E`
- Black: `#000000`
- Cards: `#1D1D1D`
- Font: Inter

Light mode uses `-dark.png` logo variants; dark mode uses `-light.png`.

## Deploy to Vercel (via GitHub)

1. `git init && git add . && git commit -m "initial"`
2. Create a new GitHub repo and `git push -u origin main`.
3. In Vercel, **Import Git Repository** → select the repo → **Deploy**. No build step needed.
4. After the first deploy, the WP embed code will reference logos at:
   `https://{your-vercel-domain}/logos/{slug}-logo-{light|dark}.png`

If you want logos to stay at `bitcoinforcorporations.com/wp-content/uploads/company-logos/` instead, leave the current `WP_CDN` constant in `index.html` — it defaults to that URL.

## Usage

1. Open `index.html`. Tier layout is seeded from the current BFC members page.
2. Edit / reorder / add companies. Use **Upload image** in the modal for logos outside the bundled 39.
3. Click **Open preview** (top-right) to see the public-facing embed rendered with the end-user search + filter toolbar.
4. Click **Copy embed** to get the self-contained `<style>…<div class="bfc-dir">…<script>…` block. Paste into any WordPress Custom HTML block.

State is persisted to `localStorage` under `bfc_directory_v4`. Use **Export JSON** for a durable backup.
