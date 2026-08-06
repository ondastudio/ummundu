# Ummundu — Travel Agency Website Design

**Date:** 2026-08-05
**Status:** Approved

## Design source

- **Figma:** [UMMUNDU — Implementação do website](https://www.figma.com/design/ZObhBJlDjqk6x5iWDSYg2i/UMMUNDU---Implementa%C3%A7%C3%A3o-do-website) — one page, `01_DESKTOP`, containing all page frames (PT + EN), a components column, and a "General notes desktop" frame with page list, interaction timing, and link-state rules.
- **Style guide docs (client-provided, `~/Downloads/`):** `Ummundu_-_entidade_visual_do_website.docx` and `Ummundu_-_entidade_visual_do_website_(parte_2).docx` — authoritative source for colors, full desktop+mobile typography scale, spacing, and link underline mechanics. Values below come from these docs except where noted as Figma-only.
- This revision supersedes the first draft of this spec, which was written before the Figma file and style guide were shared and assumed placeholder content (generic "destinations" pages with photography, a 3-field contact form, a vague "privacy pages" list, a simple header nav).

## Overview

A bilingual (Portuguese/English), no-CMS, editorial-style marketing website for a travel agency. The design is deliberately minimal and typographic — no photography anywhere in the approved desktop design, navigation lives entirely in a slide-over menu rather than a header nav bar. Content is edited directly by the client via GitHub, so the setup must be forgiving for a non-technical editor while staying simple to build and host.

## Goals

- Faithfully reproduce the approved Figma desktop design and the client's style guide (color, type, spacing, motion)
- Client can add new destinations over time without any code knowledge or a CMS
- Fully static output, deployable on the client's existing basic web hosting (WebHS)
- Fast, comfortable staging workflow for review during development

## Non-Goals

- No CMS, no database, no server-side runtime in production
- No automatic browser-based language detection (language is a manual choice, defaulting to Portuguese)
- No mobile/tablet page layouts in this phase — the Figma file only contains desktop frames. Mobile typography/spacing tokens are captured now (see Visual Design System) since the style guide already defines them, but no responsive breakpoints are built until mobile layouts are designed.

## Pages

Nine pages, each served at both `/` (PT) and `/en/` (EN):

1. **Home** — dark-background intro (logo only) dissolving into the homepage content
2. **Algarve** — destination page
3. **Madeira** — destination page
4. **Contacto** — travel inquiry form
5. **Contact success** — confirmation page after form submission (a real page, not a JS-swapped state)
6. **Termos de uso** (Terms of Use)
7. **Privacidade** (Privacy)
8. **Acessibilidade** (Accessibility)
9. **Condições de venda** (Terms of Sale)

Algarve and Madeira are the same template (see Content Model) so adding a third destination requires no new page code. The four legal pages also share one template.

## Navigation

There is no visible header nav bar. The header contains only the logo and a "menu" trigger; all navigation lives in a two-state overlay panel.

- **Header**: logo (centered) + "menu" link (right-aligned), height 77px desktop / 54px mobile. On inner pages (Algarve, Madeira, Contacto, legal pages) the menu link lives inside this bar. On the **Home page specifically**, the header shows the logo only, and the "menu" trigger instead sits inside the hero content block (right-aligned, above the display title) rather than in the compact bar — a deliberate Home-page layout difference in the Figma file, not a general pattern.
- **Overlay mechanics**: a full-viewport backdrop (`rgba(50,45,40,0.7)`) appears **instantly** behind a right-anchored panel (560px wide, full height, background `#E0D8CC`, horizontal padding 50px). The panel itself dissolves in/out over 150ms — the Figma annotations explicitly call out "no lateral slide-in," so this is opacity-only, not a translating drawer.
- **Menu overlay — State 1** (opened from the "menu" trigger): centered "Destinos" and "Contacto" links, language switcher ("Português · English") at the bottom, "Fechar" (close) top-right.
- **Menu overlay — State 2** (opened by clicking "Destinos" in State 1): left-aligned "destinos" eyebrow label above a destination list (`{title} · {country}` per destination, sourced from the same content collection as the destination pages), "Voltar" (back) link at the bottom in place of the language switcher.

## Interactions & Motion

From the Figma "General notes" frame — these are the only transition rules in the design; everything else is instant:

| Interaction | Timing |
|---|---|
| Home intro → homepage | Dissolve, 250ms |
| Menu backdrop appearing/disappearing | Instant |
| Menu panel open / close | Dissolve, 150ms (no lateral slide-in) |
| Menu internal state change (State 1 ↔ State 2) | Dissolve, 150ms |
| Between-page navigation | Instant (no transition) |

Between-page navigation being instant means Astro's default multi-page-app navigation needs no view-transitions work. The intro and menu dissolves are small, self-contained pieces of client-side JS/CSS.

## Content Model

No CMS. Content lives as markdown files in the repo, edited by the client directly through GitHub's web interface. Both languages live in the same file, using flat suffixed frontmatter keys and `## EN` / `## PT` body headings (unchanged rationale from the original spec: avoids indentation-sensitive YAML and keeps both languages visible together so nothing gets forgotten).

### Destinations

Simpler than originally planned — the approved design has **no photography**, just an eyebrow country label, a title, and one paragraph per language:

```yaml
title_en: "Algarve"
title_pt: "Algarve"
country_en: "Portugal"
country_pt: "Portugal"
```
```md
## EN
Under a perennial sun, light lingers on cliffs sculpted by time...

## PT
Sob um sol perene, a luz demora-se em falésias esculpidas pelo tempo...
```

One markdown file per destination (e.g. `src/content/destinations/algarve.md`), validated via an Astro content collection + Zod schema (build fails loudly on a missing/misnamed field — the key safety net for a non-technical editor). No image field. This same collection drives three surfaces: the destination's own page, the Home page's "Destinos" list, and the menu overlay's State 2 destination list — so adding a destination file automatically updates all three.

### Contact form

Ten fields, all submitting to Formspree:

| Field | Type | Required |
|---|---|---|
| Partida (Mês / Ano) | Two dropdowns | No |
| Destino | Dropdown | Yes |
| Duração | Dropdown | Yes |
| Viajantes | Dropdown | Yes |
| Investimento | Dropdown | Yes |
| Nome | Text | Yes |
| Apelido | Text | Yes |
| Email | Text (email) | Yes |
| Telefone | Text (phone) | No |
| Mensagem | Textarea | No |

Required fields show a `*` and inline error copy "Informação necessária" on validation failure; error text renders in `#8A2A2A`. A privacy consent note ("Consulte a Declaração de Privacidade...", linking to the privacy page) sits above the submit button, labeled "Enviar". On success, Formspree's `_next` redirect param sends the visitor to the dedicated Contact success page ("Envio registado.") rather than swapping state client-side.

Dropdown option lists (Duração, Viajantes confirmed complete from Figma; others are placeholders pending client data — see Open Items):

- **Duração**: 7–14 dias (one option per day) + "Mais de 14 dias"
- **Viajantes**: 1–6 pessoas
- **Destino**: generated from the same destinations content collection as the menu overlay and Home page list (Algarve, Madeira, plus any destination the client adds later) — not a separately maintained list

### Legal pages

One shared template for all four legal pages: page label (eyebrow) + heading + intro paragraph, then exactly 5 numbered sections (title + paragraph each). All body copy in Figma is placeholder lorem ipsum — real legal text is a client open item, but the structure itself is confirmed and stable.

## Visual Design System

### Colors

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#E0D8CC` | Page background, header/footer/menu panels |
| `--color-text` | `#322D28` | Primary text, links |
| `--color-error` | `#8A2A2A` | Form validation error text |
| `--color-intro-bg` | `#322D28` | Home intro screen background (inverted) |
| `--color-intro-fg` | `#E0D8CC` | Home intro logo color (inverted) |

Text opacity variants (all relative to `#322D28`): labels default at 70% fill, placeholders at 50% (desktop) / 40% (mobile) fill, selected dropdown values/footer links at 70% fill, underline color at 60% fill.

### Typography

Two font families: **Fahkwang** (hero display title only, weight 200/ExtraLight) and **Manrope** (everything else, weights 300/400/500). Full desktop/mobile scale from the style guide:

| Element | Desktop | Mobile |
|---|---|---|
| Display title (hero) | Fahkwang 200, 52px/57px, 2% tracking | Fahkwang 200, 34px/38px, 2% tracking |
| Menu/Close/Back button | Manrope 400, 11px/20px, 4% tracking | Manrope 400, 9px/16px, 4% tracking |
| Labels (uppercase) | Manrope 400, 11px/14px, 11% tracking, 70% fill | Manrope 400, 9px/12px, 10% tracking, 60% fill |
| Body text | Manrope 400, 14px/25px, 3% tracking | Manrope 400, 12px/22px, 3% tracking |
| Page title (destination/legal) | Manrope 400, 19px/27px, 3% tracking | Manrope 400, 18px/26px, 3% tracking |
| Page subtitle (legal) | Manrope 500, 14px/25px, 3% tracking | Manrope 500, 12px/22px, 3% tracking |
| Menu overlay links (State 1) | Manrope 400, 13px/24px, 3% tracking | Manrope 400, 11px/20px, 3% tracking |
| Contact intro/success text | Manrope 400, 14px/25px, 3% tracking | Manrope 400, 12px/22px, 3% tracking |
| Form field label | Manrope 400, 13px/18px, 3% tracking | Manrope 400, 11px/16px, 3% tracking |
| Form placeholder (departure field only) | Manrope 400, 13px/18px, 3% tracking, 50% fill | Manrope 400, 11px/16px, 3% tracking, 40% fill |
| Form asterisk | Manrope 300, 13px/18px, 3% tracking | Manrope 300, 11px/16px, 3% tracking |
| Required/privacy text | Manrope 400, 11px/18px, 3% tracking | Manrope 400, 10px/16px, 3% tracking |
| CTA button | Manrope 400, 13px/18px, 3% tracking | Manrope 400, 11px/16px, 3% tracking |
| Selected value / dropdown option / input data | Manrope 400, 13px/18px, 3% tracking, 70% fill | Manrope 400, 11px/16px, 3% tracking, 70% fill |
| Error note | Manrope 400, 11px/18px, 3% tracking, `#8A2A2A` | Manrope 400, 10px/16px, 3% tracking, `#8A2A2A` |
| Footer contact link | Manrope 400, 13px/24px | Manrope 400, 11px/20px |
| Footer legal links / language selector | Manrope 400, 12px/24px | Manrope 400, 10px/20px |
| Footer legal note | Manrope 400, 12px/18px | Manrope 400, 10px/14px |

Chevron icon (dropdown affordance): 12×12px, both breakpoints.

### Spacing

| Token | Desktop | Mobile |
|---|---|---|
| Page horizontal padding | 50px | 20px |
| Header height | 77px | 54px |
| Logo top offset | 30px | 20px |
| Footer bottom padding | 30px | 20px |
| Editorial content block width | 560px (fixed) | fluid within page padding |

Desktop values apply to all pages built in this phase. Mobile values are captured in `tokens.css` now so they don't need to be re-derived later, even though no mobile layouts are built yet.

### Links

Default state: underlined, color 60%-fill `#322D28`, underline thickness 3% (em-relative), offset 40% (em-relative). Hover: underline removed, color unchanged, `cursor: pointer`. Focus: a visible keyboard-focus state maintaining the same visual language (exact treatment left to implementation — e.g. an outline — since the style guide doesn't specify one).

## Internationalization

- Two languages: Portuguese and English
- **Path-based routing**: `/` serves Portuguese (default/root), `/en/` serves English
- Manual language switcher in the UI (in the menu overlay, State 1) — no automatic browser or geo-based language detection

## Stack

- **Astro**, built to fully static output (`astro build`)
- Chosen for: native content collections with schema validation, zero JS shipped by default (fits an editorial, content-first site — the only client-side JS needed is the small intro/menu dissolve transitions), built-in i18n routing support
- **Styling:** scoped CSS per component (Astro's native `<style>` blocks), plus a shared `tokens.css` for the color/typography/spacing values above. Not using Tailwind or another utility-class framework — the design's spacing and type scale are a fixed, fully-specified system from the style guide rather than an arbitrary per-section scale, but it's still a small enough token set that scoped CSS + shared tokens stays simpler than introducing a utility framework.
- **Contact form:** submits to **Formspree** (free tier), redirecting to a static "Contact success" page via Formspree's `_next` param — no backend needed, submissions email directly to the client. Chosen over Netlify Forms because production hosting is not Netlify.

## Hosting & Deployment

Unchanged from the original spec:

- **Production hosting:** WebHS — the client's existing domain + hosting purchase (traditional FTP-based shared hosting, no git/build awareness).
- **Deployment pipeline:** a GitHub Action builds the Astro site on every push to `main` and uploads the static output to WebHS via FTP/SFTP. Requires FTP/cPanel credentials from the client (not yet shared).
- **Staging:** the same GitHub repo connected to Netlify or Vercel (free tier) for automatic preview links during development. Not the production host.
- **Local development:** proceeds locally regardless of hosting credential availability.

## Open Items

Design and architecture are settled; these are client-data gaps, not open design questions:

- Real legal copy for all four legal pages (Figma has placeholder lorem ipsum only)
- Real investment price tiers for the contact form's "Investimento" dropdown (Figma shows placeholder currency-band text)
- Departure-year dropdown range policy (Figma's example frame only showed 2026–2027) and confirmed PT month names (the only departure-month/year dropdown frames found in Figma were the `[EN]` variants)
- Confirm the RNAVT travel-license number shown in the footer ("12785") is the client's real registration number
- "Livro de reclamações" footer link — external link to the government complaints-book portal vs. a new internal page (client to decide)
- WebHS FTP/cPanel credentials
- Figma itself is inconsistent on the Madeira destination's English name: the Home page's destination list translates it to "Madeira Archipelago," but the Madeira page's own English title frame keeps the Portuguese "Arquipélago da Madeira." This spec uses "Madeira Archipelago" as the canonical `title_en` (the more complete English translation) — flag for client proofreading, not a build blocker.
