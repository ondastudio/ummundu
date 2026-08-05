# Ummundu — Travel Agency Website Design

**Date:** 2026-08-05
**Status:** Approved, pending final page list from Figma

## Overview

A bilingual (Portuguese/English), no-CMS, editorial-style marketing website for a travel agency. Content is edited directly by the client via GitHub, so the setup must be forgiving for a non-technical editor while staying simple to build and host.

## Goals

- Simple, editorial visual design with bespoke, art-directed spacing (not grid-locked)
- Client can add new destinations over time without any code knowledge or a CMS
- Fully static output, deployable on the client's existing basic web hosting (WebHS)
- Fast, comfortable staging workflow for review during development

## Non-Goals

- No CMS, no database, no server-side runtime in production
- No automatic browser-based language detection (language is a manual choice, defaulting to Portuguese)

## Pages

- **Home** — minimal loader (background + logo fades into the homepage content), then the main landing page
- **Destinations** — 2 destinations at launch, template-driven so more can be added later without new code
- **Contact** — a contact form
- **Privacy** — multiple pages (exact list — e.g. privacy policy, cookie policy — to be finalized once the client's Figma design is shared)

## Content Model

No CMS. Content lives as markdown files in the repo, edited by the client directly through GitHub's web interface.

- **Destinations:** one file per destination, e.g. `src/content/destinations/bali.md`
- **Both languages live in the same file** (chosen over separate per-language files so nothing gets translated for one language and forgotten for the other):
  - Frontmatter uses **flat, suffixed keys** rather than nested/indented YAML, since indentation-sensitive structures are an easy way for a non-technical editor to break a file silently:
    ```yaml
    title_en: "Bali"
    title_pt: "Bali"
    subtitle_en: "Where the ocean meets the soul"
    subtitle_pt: "Onde o oceano encontra a alma"
    hero_image: "./images/bali-hero.jpg"
    ```
  - Longer body copy is split with clearly marked headings inside the markdown body, so both languages are visible side by side:
    ```md
    ## EN
    Paragraph of destination copy...

    ## PT
    Parágrafo de texto do destino...
    ```
- **Images** live in the repo alongside their destination's markdown file, referenced by relative path in frontmatter. The client uploads new images through GitHub the same way they edit content.
- **Astro content collections** are used to define a typed schema for the destination frontmatter. This is the key safety net for a non-technical editor: if a required field is missing or misnamed, the build fails with a clear, specific error instead of silently shipping a broken or blank page.
- Adding a new destination in the future = the client duplicates an existing markdown file, edits the fields and body text, and commits. No code or developer involvement required.

## Internationalization

- Two languages: Portuguese and English
- **Path-based routing**: `/` serves Portuguese (default/root), `/en/` serves English
- Manual language switcher in the UI — no automatic browser or geo-based language detection

## Stack

- **Astro**, built to fully static output (`astro build`)
- Chosen for: native content collections with schema validation (see above), zero JS shipped by default (fits an editorial, content-first site), built-in i18n routing support, and prior familiarity from past projects
- **Styling:** scoped CSS per component (Astro's native `<style>` blocks), plus a small shared `tokens.css` for values that should stay consistent (color palette, font stack, base type scale). Deliberately **not** using Tailwind or another utility-class framework — the design calls for bespoke, art-directed spacing on a per-section basis rather than a repeating systematic scale, and forcing that through a token-constrained utility system (arbitrary-value classes everywhere) would add verbosity without the consistency payoff utility frameworks are meant to provide.
- **Contact form:** submits to **Formspree** (free tier) — no backend needed, submissions email directly to the client. Chosen over Netlify Forms because production hosting is not Netlify, and Formspree works from any static host.

## Hosting & Deployment

- **Production hosting:** WebHS — the client's existing domain + hosting purchase. This is traditional shared/cPanel-style hosting: it serves static files from a folder, with no awareness of git, no build step, and no native staging/preview URLs. Getting a GitHub push live requires a deploy pipeline built on top of it (see below).
- **Deployment pipeline:** a GitHub Action builds the Astro site on every push to `main` and uploads the static output to WebHS via FTP/SFTP. This is the one piece with an external dependency: it requires FTP/cPanel credentials from the client, which have not been shared yet. Until then, all development happens without this dependency.
- **Staging:** the same GitHub repo is connected to Netlify or Vercel (free tier) purely for development review — automatic preview links on every push, giving the client and the team a way to review changes before anything touches WebHS. Production deploys still go to WebHS via the GitHub Action above; Netlify/Vercel is not the production host.
- **Local development:** work proceeds locally against the repo regardless of hosting credential availability; the FTP deploy step is wired up once WebHS access details arrive.

## Open Items

- Exact list of privacy/legal pages (privacy policy, cookie policy, terms, etc.) — pending the client's Figma design
- WebHS FTP/cPanel credentials — pending from the client
- Visual design details (typography, color palette, exact spacing values) — to follow from the shared Figma file
