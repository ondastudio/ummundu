# Ummundu

Bilingual travel agency website. Built with Astro, no CMS — content lives as
files in this repository.

## Adding a new destination

1. On GitHub, open `src/content/destinations/`.
2. Click "Add file" → "Create new file" inside that folder, and name it after
   the new destination (e.g. `porto.md`).
3. Fill in the fields at the top of the file (between the `---` lines):
   - `title_en` / `title_pt` — the destination name in each language
   - `country_en` / `country_pt` — the country shown above the title (e.g. "Portugal")
4. Below the `---` lines, write one paragraph of description under two
   headings: `## EN` for the English text, `## PT` for the Portuguese text.
5. Commit the change directly to the `main` branch (or open a pull request
   if you'd prefer someone to review first).

**Important:** every field must be filled in for both languages. If a field
is missing, the site will fail to update and show a build error instead of
publishing a broken page — this is intentional, so mistakes are caught
before they go live.

The new destination automatically appears on the Home page's destination
list, in the menu overlay's destination submenu, and as an option in the
contact form's "Destino"/"Destination" dropdown — no other files need to
change.

## Editing other page copy

Text for the Home page, header, footer, menu overlay, contact form, and
legal pages lives in `src/content/copy/` — one file per page or component,
each holding every language side by side (e.g. `src/content/copy/home.ts`
has a `pt` block and an `en` block). These aren't validated at build time
like destinations, so they're best edited by the development team rather
than directly on GitHub.

## Local development

```bash
npm install
npm run dev
```

## Building for production

```bash
npm run build
```

Output is written to `dist/`.
