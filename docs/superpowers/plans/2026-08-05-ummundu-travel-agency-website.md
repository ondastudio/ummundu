# Ummundu Travel Agency Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the real Ummundu site — nine bilingual (PT/EN) pages matching the approved Figma design and client style guide, with a client-editable destinations content model, deployable to WebHS shared hosting.

**Architecture:** An Astro site with `output: 'static'`, using Astro's built-in i18n routing (Portuguese at `/`, English at `/en/`). Every piece of bilingual copy is split into two files with one clear boundary: a **content file** under `src/content/copy/*.ts` exporting a single object keyed by language (`{ pt: {...}, en: {...}, /* future languages add a key here */ }`), and a **front-end component** that imports it and renders based on a `lang` prop — the same shape the destinations collection already uses (one markdown file per destination holding both languages, rendered by one template). Destination content (Algarve, Madeira) specifically lives in an Astro content collection with a Zod schema, since it's the one thing the client edits directly via GitHub; everything else (Home, Footer, Header, menu overlay, contact form, legal pages) uses plain typed `copy` modules, since that content is developer-maintained, not client-edited. The destinations collection also drives three surfaces beyond its own pages: the Home page's destination list, the menu overlay's destination submenu, and the contact form's Destino dropdown. Navigation has no visible header nav bar — just a logo and a "menu" trigger that opens a two-state overlay panel (dissolve-only, no lateral slide) built with a small vanilla `<script>`, no client framework. Styling is scoped CSS per component plus a shared `tokens.css` carrying the full desktop (and captured-but-unused mobile) type/color/spacing scale from the client's style guide — each shared front-end component owns one `<style>` block, so PT and EN pages never duplicate CSS. Production deploys to WebHS via a GitHub Actions FTP workflow; Netlify/Vercel provides staging preview links during development.

**Tech Stack:** Astro 7, TypeScript, Vitest, `marked` (for rendering the destination's bilingual body paragraph), Formspree (contact form, with `_next` redirect to a static success page), GitHub Actions + `SamKirkland/FTP-Deploy-Action` (production deploy).

**Prior work already done and committed:** `package.json`, `astro.config.mjs` (i18n: `defaultLocale: 'pt'`, `locales: ['pt', 'en']`, `prefixDefaultLocale: false`), `tsconfig.json`, `.gitignore`, a bare `src/pages/index.astro`. `public/logo.svg` has also already been fetched from Figma and is sitting in the repo, ready to use (do **not** re-create it). This plan starts from Task 1 below — none of the file-list steps from a project scaffold are repeated here.

## Global Constraints

- Static output only — no server runtime, no database, no CMS in production (spec: Non-Goals)
- Portuguese is the default locale served at `/`; English is served at `/en/`; no automatic browser/geo language detection (spec: Internationalization)
- Desktop-only layouts this phase — no responsive breakpoints are wired up, even though mobile design tokens are captured in `tokens.css` for later (spec: Non-Goals, Visual Design System)
- **Every piece of bilingual copy is separated into a content file (`src/content/copy/*.ts`, one object keyed by language) and a front-end component that reads from it — never hardcode duplicate PT/EN copy or duplicate CSS across two page files.** This is a project-wide architecture decision, not just a destinations-collection rule.
- Destination content is authored as one markdown file per destination containing both languages: flat suffixed frontmatter keys (`title_en`/`title_pt`/`country_en`/`country_pt`) plus `## EN` / `## PT` body sections — never nested/indented per-language YAML (spec: Content Model)
- Content schema must be validated at build time (Astro content collections + Zod) so a malformed client edit fails the build with a clear error rather than shipping silently (spec: Content Model)
- No Tailwind or utility CSS framework — scoped component CSS plus the shared `tokens.css` design-tokens file (spec: Stack)
- Every color and every font size/weight/tracking/line-height value must come from `tokens.css`, which must match the client style guide docs exactly (spec: Visual Design System). The same applies to the 5 spacing metrics the style guide explicitly names (page horizontal padding, header height, logo top offset, footer bottom padding, editorial content block width) — those use `--space-*`/`--content-block-width`. Component-local layout spacing that isn't one of those 5 (flex `gap`, one-off `padding`/`margin` values specific to a single component's internal composition) may stay as literal px values — tokenizing every single-use layout offset would explode the token set for no reuse benefit.
- The menu overlay panel dissolves in/out (150ms) with **no lateral slide** and an instantly-appearing backdrop (`rgba(50,45,40,0.7)`) — per Figma's explicit interaction annotation (spec: Navigation, Interactions & Motion)
- Between-page navigation is instant (no view transitions); only the home intro (250ms) and menu overlay (150ms) use a transition (spec: Interactions & Motion)
- Contact form submits via Formspree with a `_next` redirect to a dedicated static success page — not a client-side state swap (spec: Content Model — Contact form)
- Production hosting is WebHS (FTP-based shared hosting); Netlify/Vercel is staging only, never production (spec: Hosting & Deployment)

---

### Task 1: Design tokens

**Files:**
- Create: `src/styles/tokens.css`

**Interfaces:**
- Produces: every CSS custom property later tasks style with — colors (`--color-bg`, `--color-text`, `--color-error`, `--color-intro-bg`, `--color-intro-fg`, `--color-text-muted-70/60/50/40/20`, `--color-overlay-backdrop`), typography groups (`--text-display-*`, `--text-menu-*`, `--text-label-*`, `--text-body-*`, `--text-page-title-*`, `--text-page-subtitle-*`, `--text-menu-link-*`, `--text-form-label-*`, `--text-form-meta-*`, `--text-cta-*`, `--text-footer-contact-*`, `--text-footer-legal-*`, `--text-footer-note-*`), spacing (`--space-page-padding`, `--space-header-height`, `--space-logo-offset`, `--space-footer-padding`, `--content-block-width`), and global link-underline rules on every `<a>`.

- [ ] **Step 1: Create `src/styles/tokens.css`**

```css
:root {
  /* Colors (style guide docs) */
  --color-bg: #E0D8CC;
  --color-text: #322D28;
  --color-error: #8A2A2A;
  --color-intro-bg: #322D28;
  --color-intro-fg: #E0D8CC;
  --color-text-muted-70: rgba(50, 45, 40, 0.7);
  --color-text-muted-60: rgba(50, 45, 40, 0.6);
  --color-text-muted-50: rgba(50, 45, 40, 0.5);
  --color-text-muted-40: rgba(50, 45, 40, 0.4);
  --color-text-muted-20: rgba(50, 45, 40, 0.2);
  --color-overlay-backdrop: rgba(50, 45, 40, 0.7);

  /* Fonts */
  --font-display: 'Fahkwang', serif;
  --font-body: 'Manrope', sans-serif;

  /* Desktop typography (style guide docs) */
  --text-display-size: 52px;
  --text-display-line: 57px;
  --text-display-tracking: 0.02em;

  --text-menu-size: 11px;
  --text-menu-line: 20px;
  --text-menu-tracking: 0.04em;

  --text-label-size: 11px;
  --text-label-line: 14px;
  --text-label-tracking: 0.11em;

  --text-body-size: 14px;
  --text-body-line: 25px;
  --text-body-tracking: 0.03em;

  --text-page-title-size: 19px;
  --text-page-title-line: 27px;
  --text-page-title-tracking: 0.03em;

  --text-page-subtitle-size: 14px;
  --text-page-subtitle-line: 25px;
  --text-page-subtitle-tracking: 0.03em;
  --text-page-subtitle-weight: 500;

  --text-menu-link-size: 13px;
  --text-menu-link-line: 24px;
  --text-menu-link-tracking: 0.03em;

  --text-form-label-size: 13px;
  --text-form-label-line: 18px;
  --text-form-label-tracking: 0.03em;

  --text-form-meta-size: 11px;
  --text-form-meta-line: 18px;
  --text-form-meta-tracking: 0.03em;

  --text-cta-size: 13px;
  --text-cta-line: 18px;
  --text-cta-tracking: 0.03em;

  --text-footer-contact-size: 13px;
  --text-footer-contact-line: 24px;

  --text-footer-legal-size: 12px;
  --text-footer-legal-line: 24px;

  --text-footer-note-size: 12px;
  --text-footer-note-line: 18px;

  /* Spacing (style guide docs) */
  --space-page-padding: 50px;
  --space-header-height: 77px;
  --space-logo-offset: 30px;
  --space-footer-padding: 30px;
  --content-block-width: 560px;

  /* Link underline mechanics (style guide docs) */
  --link-underline-thickness: 0.03em;
  --link-underline-offset: 0.4em;

  /* Mobile typography/spacing — captured now for a future responsive phase,
     not consumed by any component yet. Prefixed so they can't be applied
     by accident before real mobile layouts exist. */
  --mobile-text-display-size: 34px;
  --mobile-text-display-line: 38px;
  --mobile-text-menu-size: 9px;
  --mobile-text-menu-line: 16px;
  --mobile-text-label-size: 9px;
  --mobile-text-label-line: 12px;
  --mobile-text-body-size: 12px;
  --mobile-text-body-line: 22px;
  --mobile-text-page-title-size: 18px;
  --mobile-text-page-title-line: 26px;
  --mobile-text-page-subtitle-size: 12px;
  --mobile-text-page-subtitle-line: 22px;
  --mobile-text-menu-link-size: 11px;
  --mobile-text-menu-link-line: 20px;
  --mobile-text-form-label-size: 11px;
  --mobile-text-form-label-line: 16px;
  --mobile-text-form-meta-size: 10px;
  --mobile-text-form-meta-line: 16px;
  --mobile-text-cta-size: 11px;
  --mobile-text-cta-line: 16px;
  --mobile-text-footer-contact-size: 11px;
  --mobile-text-footer-contact-line: 20px;
  --mobile-text-footer-legal-size: 10px;
  --mobile-text-footer-legal-line: 20px;
  --mobile-text-footer-note-size: 10px;
  --mobile-text-footer-note-line: 14px;
  --mobile-space-page-padding: 20px;
  --mobile-space-header-height: 54px;
  --mobile-space-logo-offset: 20px;
  --mobile-space-footer-padding: 20px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
}

a {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: var(--color-text-muted-60);
  text-decoration-thickness: var(--link-underline-thickness);
  text-underline-offset: var(--link-underline-offset);
}

a:hover {
  text-decoration: none;
  cursor: pointer;
}

a:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}
```

- [ ] **Step 2: Verify the file has no syntax errors by running the (still-scaffold) build**

Run: `npm run build`
Expected: build succeeds (tokens.css isn't imported by anything yet, so this only proves the project still builds).

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css
git commit -m "Add design tokens matching the client style guide"
```

---

### Task 2: Base layout

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `src/styles/tokens.css` (Task 1).
- Produces: `BaseLayout.astro` accepting `Props { lang: 'pt' | 'en'; title: string }` with a default `<slot />` for page content. Every later page task wraps its content in this layout.

- [ ] **Step 1: Create `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/tokens.css';

interface Props {
  lang: 'pt' | 'en';
  title: string;
}

const { lang, title } = Astro.props;
---
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Update `src/pages/index.astro` to use the layout**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout lang="pt" title="Ummundu">
  <h1>Ummundu</h1>
</BaseLayout>
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Verify with: `grep -q 'lang="pt"' dist/index.html && grep -q "Ummundu" dist/index.html && echo OK`
Expected output: `OK`

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BaseLayout.astro src/pages/index.astro
git commit -m "Add base layout"
```

---

### Task 3: Language switcher

**Files:**
- Create: `src/lib/getAlternateLocalePath.ts`
- Test: `src/lib/getAlternateLocalePath.test.ts`
- Create: `src/content/copy/languageSwitcher.ts`
- Create: `src/components/LanguageSwitcher.astro`
- Modify: `package.json`

**Interfaces:**
- Consumes: `--color-text`, `--font-body` tokens from Task 1.
- Produces: `getAlternateLocalePath(pathname: string, currentLang: 'pt' | 'en'): string`, `languageSwitcherCopy: { pt: {...}, en: {...} }`, and `<LanguageSwitcher lang="pt" | "en" context="footer" | "menu" />` — used by the Footer (Task 5) and the menu overlay (Task 8).

- [ ] **Step 1: Add `vitest` as a dev dependency and a `test` script**

Modify `package.json`, adding to `scripts`:

```json
"test": "vitest run"
```

And adding a `devDependencies` block:

```json
"devDependencies": {
  "vitest": "^4.1.10"
}
```

Run: `npm install`

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 3: Write the failing tests**

Create `src/lib/getAlternateLocalePath.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getAlternateLocalePath } from './getAlternateLocalePath';

describe('getAlternateLocalePath', () => {
  it('maps the PT home page to the EN home page', () => {
    expect(getAlternateLocalePath('/', 'pt')).toBe('/en');
  });

  it('maps a PT subpage to the equivalent EN subpage', () => {
    expect(getAlternateLocalePath('/algarve', 'pt')).toBe('/en/algarve');
  });

  it('maps the EN home page to the PT home page', () => {
    expect(getAlternateLocalePath('/en', 'en')).toBe('/');
  });

  it('maps an EN subpage to the equivalent PT subpage', () => {
    expect(getAlternateLocalePath('/en/algarve', 'en')).toBe('/algarve');
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npx vitest run src/lib/getAlternateLocalePath.test.ts`
Expected: FAIL — module does not exist yet.

- [ ] **Step 5: Implement `getAlternateLocalePath`**

Create `src/lib/getAlternateLocalePath.ts`:

```ts
export function getAlternateLocalePath(
  pathname: string,
  currentLang: 'pt' | 'en'
): string {
  if (currentLang === 'pt') {
    return pathname === '/' ? '/en' : `/en${pathname}`;
  }

  const stripped = pathname.replace(/^\/en/, '');
  return stripped === '' ? '/' : stripped;
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/lib/getAlternateLocalePath.test.ts`
Expected: PASS — all 4 tests green.

- [ ] **Step 7: Create the language switcher content file**

Create `src/content/copy/languageSwitcher.ts`:

```ts
export const languageSwitcherCopy = {
  pt: { current: 'Português', alternate: 'English' },
  en: { current: 'English', alternate: 'Português' },
};
```

- [ ] **Step 8: Create the `LanguageSwitcher` component**

Both the footer and the menu overlay show "current language plain + other language underlined," but at different font sizes/contexts, so the component takes a `context` prop that switches which typography tokens it uses.

Create `src/components/LanguageSwitcher.astro`:

```astro
---
import { getAlternateLocalePath } from '../lib/getAlternateLocalePath';
import { languageSwitcherCopy } from '../content/copy/languageSwitcher';

interface Props {
  lang: 'pt' | 'en';
  context: 'footer' | 'menu';
}

const { lang, context } = Astro.props;
const alternatePath = getAlternateLocalePath(Astro.url.pathname, lang);
const { current, alternate } = languageSwitcherCopy[lang];
---
<div class="language-switcher" data-context={context}>
  <span class="language-switcher__current">{current}</span>
  <span class="language-switcher__separator">·</span>
  <a href={alternatePath} class="language-switcher__alternate">{alternate}</a>
</div>

<style>
  .language-switcher {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-body);
  }

  .language-switcher__current {
    color: var(--color-text);
  }

  .language-switcher__alternate {
    color: var(--color-text-muted-70);
  }

  .language-switcher[data-context='footer'] {
    font-size: var(--text-footer-legal-size);
    line-height: var(--text-footer-legal-line);
  }

  .language-switcher[data-context='menu'] {
    font-size: 12px;
    line-height: 24px;
    letter-spacing: 0.03em;
  }
</style>
```

- [ ] **Step 9: Run all tests**

Run: `npx vitest run`
Expected: PASS — all tests across the project green.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/getAlternateLocalePath.ts src/lib/getAlternateLocalePath.test.ts src/content/copy/languageSwitcher.ts src/components/LanguageSwitcher.astro
git commit -m "Add language switcher with pure path-mapping function"
```

---

### Task 4: Header component

**Files:**
- Create: `src/content/copy/header.ts`
- Create: `src/components/Header.astro`

**Interfaces:**
- Consumes: tokens from Task 1. `public/logo.svg` (already in the repo).
- Produces: `headerCopy: { pt: { menuAriaLabel }, en: { menuAriaLabel } }`, and `<Header lang="pt" | "en" variant="withMenu" | "logoOnly" />`. Every inner page (Task 7, 10, 11, 12) uses `variant="withMenu"`; the Home page (Task 9) uses `variant="logoOnly"` and places its own menu trigger inside the hero instead. Any element anywhere in the document with `data-menu-trigger` opens the menu overlay (Task 8) — this is how Header's own menu link and Home's hero-embedded menu link both work without duplicating logic.

- [ ] **Step 1: Create the header content file**

Create `src/content/copy/header.ts`:

```ts
export const headerCopy = {
  pt: { menuAriaLabel: 'Abrir menu' },
  en: { menuAriaLabel: 'Open menu' },
};
```

- [ ] **Step 2: Create `src/components/Header.astro`**

```astro
---
import { headerCopy } from '../content/copy/header';

interface Props {
  lang: 'pt' | 'en';
  variant?: 'withMenu' | 'logoOnly';
}

const { lang, variant = 'withMenu' } = Astro.props;
const { menuAriaLabel } = headerCopy[lang];
---
<header class="site-header">
  <img src="/logo.svg" alt="Ummundu" class="site-header__logo" />
  {variant === 'withMenu' && (
    <a href="#menu" class="site-header__menu-link" data-menu-trigger aria-label={menuAriaLabel}>menu</a>
  )}
</header>

<style>
  .site-header {
    height: var(--space-header-height);
    background: var(--color-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 0 var(--space-page-padding);
  }

  .site-header__logo {
    height: 16.92px;
    width: 151.192px;
  }

  .site-header__menu-link {
    position: absolute;
    right: var(--space-page-padding);
    font-size: var(--text-menu-size);
    line-height: var(--text-menu-line);
    letter-spacing: var(--text-menu-tracking);
    text-transform: capitalize;
  }
</style>
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: build succeeds (Header isn't used by any page yet, this only checks for syntax errors). If Astro warns about an unused component, that's expected at this point in the plan.

- [ ] **Step 4: Commit**

```bash
git add src/content/copy/header.ts src/components/Header.astro
git commit -m "Add site header component"
```

---

### Task 5: Footer component

**Files:**
- Create: `src/content/copy/footer.ts`
- Create: `src/components/Footer.astro`

**Interfaces:**
- Consumes: `LanguageSwitcher` (Task 3), tokens (Task 1).
- Produces: `footerCopy: { pt: {...}, en: {...} }`, and `<Footer lang="pt" | "en" showContactLink={boolean} />` — every page (Task 7, 9, 10, 11, 12) includes this, passing `showContactLink={false}` only on the contact page and its success page.

- [ ] **Step 1: Create the footer content file**

Create `src/content/copy/footer.ts`:

```ts
export const footerCopy = {
  pt: {
    contact: 'Contacto',
    contactHref: '/contacto',
    legalLinks: [
      { label: 'Termos de uso', href: '/termos-de-uso' },
      { label: 'Privacidade', href: '/privacidade' },
      { label: 'Acessibilidade', href: '/acessibilidade' },
      { label: 'Condições de venda', href: '/condicoes-de-venda' },
      { label: 'Livro de reclamações', href: '#' },
    ],
    legalNote: 'Turismo de Portugal — RNAVT n.º 12785',
  },
  en: {
    contact: 'Contact',
    contactHref: '/en/contact',
    legalLinks: [
      { label: 'Terms of use', href: '/en/terms-of-use' },
      { label: 'Privacy', href: '/en/privacy' },
      { label: 'Accessibility', href: '/en/accessibility' },
      { label: 'Terms of sale', href: '/en/terms-of-sale' },
      { label: 'Complaints book', href: '#' },
    ],
    legalNote: 'Turismo de Portugal — RNAVT no. 12785',
  },
};
```

- [ ] **Step 2: Create `src/components/Footer.astro`**

```astro
---
import LanguageSwitcher from './LanguageSwitcher.astro';
import { footerCopy } from '../content/copy/footer';

interface Props {
  lang: 'pt' | 'en';
  showContactLink?: boolean;
}

const { lang, showContactLink = true } = Astro.props;
const { contact, contactHref, legalLinks, legalNote } = footerCopy[lang];
---
<footer class="site-footer" data-has-contact-link={showContactLink}>
  {showContactLink && (
    <a href={contactHref} class="site-footer__contact">{contact}</a>
  )}
  <div class="site-footer__utilities">
    <div class="site-footer__legal-links">
      {legalLinks.map((link) => (
        <a href={link.href}>{link.label}</a>
      ))}
    </div>
    <LanguageSwitcher lang={lang} context="footer" />
  </div>
  <div class="site-footer__note">
    <p>{legalNote}</p>
    <p>© 2026 UMMUNDU</p>
  </div>
</footer>

<style>
  .site-footer {
    width: var(--content-block-width);
    display: flex;
    flex-direction: column;
    gap: 71px;
    padding-bottom: var(--space-footer-padding);
    font-family: var(--font-body);
  }

  .site-footer[data-has-contact-link='false'] {
    gap: 74px;
  }

  .site-footer__contact {
    font-size: var(--text-footer-contact-size);
    line-height: var(--text-footer-contact-line);
  }

  .site-footer__utilities {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
  }

  .site-footer__legal-links {
    display: flex;
    flex-direction: column;
    gap: 19px;
    font-size: var(--text-footer-legal-size);
    line-height: var(--text-footer-legal-line);
  }

  .site-footer__note {
    text-align: right;
    font-size: var(--text-footer-note-size);
    line-height: var(--text-footer-note-line);
  }

  .site-footer__note p {
    margin: 0;
  }
</style>
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/content/copy/footer.ts src/components/Footer.astro
git commit -m "Add site footer component"
```

---

### Task 6: Destinations content collection and bilingual body splitter

**Files:**
- Create: `src/content.config.ts`
- Create: `src/lib/splitBilingualBody.ts`
- Test: `src/lib/splitBilingualBody.test.ts`
- Create: `src/content/destinations/algarve.md`
- Create: `src/content/destinations/madeira.md`

**Interfaces:**
- Produces: `splitBilingualBody(body: string): { en: string; pt: string }` (throws `Error('Destination body must contain both "## EN" and "## PT" sections')` if either section is missing) — used by Task 7's destination page template. Produces the `destinations` collection with schema fields `title_en`, `title_pt`, `country_en`, `country_pt` (all strings) — used by Task 7 (destination pages), Task 8 (menu overlay destination list), Task 9 (Home page destination list), and Task 10 (contact form's Destino dropdown). This collection is itself the "content file holding all languages" for destinations — no separate `src/content/copy/*.ts` file duplicates it.

- [ ] **Step 1: Write the failing test for `splitBilingualBody`**

Create `src/lib/splitBilingualBody.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { splitBilingualBody } from './splitBilingualBody';

describe('splitBilingualBody', () => {
  it('splits a body with EN before PT', () => {
    const body = '## EN\nHello there.\n\n## PT\nOlá ali.';
    const result = splitBilingualBody(body);
    expect(result.en).toBe('Hello there.');
    expect(result.pt).toBe('Olá ali.');
  });

  it('splits a body with PT before EN', () => {
    const body = '## PT\nOlá ali.\n\n## EN\nHello there.';
    const result = splitBilingualBody(body);
    expect(result.en).toBe('Hello there.');
    expect(result.pt).toBe('Olá ali.');
  });

  it('throws when a section is missing', () => {
    const body = '## EN\nHello there.';
    expect(() => splitBilingualBody(body)).toThrow(
      'Destination body must contain both "## EN" and "## PT" sections'
    );
  });

  it('preserves multi-sentence markdown within a section', () => {
    const body =
      '## EN\nFirst sentence. Second sentence.\n\n## PT\nPrimeira frase.';
    const result = splitBilingualBody(body);
    expect(result.en).toBe('First sentence. Second sentence.');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/splitBilingualBody.test.ts`
Expected: FAIL — `src/lib/splitBilingualBody.ts` does not exist yet.

- [ ] **Step 3: Implement `splitBilingualBody`**

Create `src/lib/splitBilingualBody.ts`:

```ts
export interface BilingualBody {
  en: string;
  pt: string;
}

const EN_HEADING = /^##\s*EN\s*$/m;
const PT_HEADING = /^##\s*PT\s*$/m;

export function splitBilingualBody(body: string): BilingualBody {
  const enIndex = body.search(EN_HEADING);
  const ptIndex = body.search(PT_HEADING);

  if (enIndex === -1 || ptIndex === -1) {
    throw new Error(
      'Destination body must contain both "## EN" and "## PT" sections'
    );
  }

  const enHeadingLine = body.slice(enIndex).match(EN_HEADING)![0];
  const ptHeadingLine = body.slice(ptIndex).match(PT_HEADING)![0];

  const firstIndex = Math.min(enIndex, ptIndex);
  const secondIndex = Math.max(enIndex, ptIndex);
  const firstIsEn = firstIndex === enIndex;

  const firstSection = body.slice(firstIndex, secondIndex);
  const secondSection = body.slice(secondIndex);

  const stripHeading = (section: string, headingLine: string) =>
    section.slice(section.indexOf(headingLine) + headingLine.length).trim();

  return {
    en: stripHeading(firstIsEn ? firstSection : secondSection, enHeadingLine),
    pt: stripHeading(firstIsEn ? secondSection : firstSection, ptHeadingLine),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/splitBilingualBody.test.ts`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Create the content collection config**

Create `src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const destinations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/destinations' }),
  schema: z.object({
    title_en: z.string().min(1),
    title_pt: z.string().min(1),
    country_en: z.string().min(1),
    country_pt: z.string().min(1),
  }),
});

export const collections = { destinations };
```

- [ ] **Step 6: Create the two real destination files**

Create `src/content/destinations/algarve.md` (copy verbatim from the approved Figma design):

```md
---
title_en: "Algarve"
title_pt: "Algarve"
country_en: "Portugal"
country_pt: "Portugal"
---

## EN
Under a perennial sun, light lingers on cliffs sculpted by time and on sweeping sands. A Mediterranean identity extends throughout the region. Sheltered by the mountains, dry orchards and dry stone walls compose a cultural landscape.

## PT
Sob um sol perene, a luz demora-se em falésias esculpidas pelo tempo e em extensos areais. Uma identidade mediterrânica prolonga-se por toda a região. No resguardo das serras, pomares de sequeiro e muros de pedra seca desenham uma paisagem cultural.
```

Create `src/content/destinations/madeira.md` (copy verbatim; note per spec Open Items, `title_en` uses "Madeira Archipelago" — the fuller English translation shown on the Home page's destination list — rather than the untranslated "Arquipélago da Madeira" that appears on the destination page's own title frame in Figma, since the design file is inconsistent between the two and a single collection entry needs one canonical value):

```md
---
title_en: "Madeira Archipelago"
title_pt: "Arquipélago da Madeira"
country_en: "Portugal"
country_pt: "Portugal"
---

## EN
These islands hold distinct expressions of nature, from mountains cloaked in dense forests, where water and greenery prevail, to the long stretch of fine sand touched by the sea. Rooted in a legacy of six centuries, local communities have shaped life with ingenuity across a demanding volcanic terrain.

## PT
Estas ilhas guardam expressões distintas da natureza, das montanhas cobertas por florestas densas, onde a água e o verde prevalecem, à longa faixa de areia fina tocada pelo mar. Com raízes num legado de seis séculos, as comunidades locais moldaram com engenho a vida num relevo vulcânico exigente.
```

- [ ] **Step 7: Build and verify the collection loads**

Run: `npm run build`
Expected: build succeeds with no schema errors.

- [ ] **Step 8: Verify the schema fails loudly on bad content**

This step proves the core safety requirement: a client mistake must break the build with a clear error, not ship silently.

Temporarily create `src/content/destinations/broken-test.md`:

```md
---
title_en: "Broken"
title_pt: "Quebrado"
country_en: "Nowhere"
---

## EN
Test content.

## PT
Conteúdo de teste.
```

Run: `npm run build`
Expected: build FAILS with a Zod validation error naming `country_pt` as missing/required.

Then delete the fixture:

```bash
rm src/content/destinations/broken-test.md
```

Run: `npm run build`
Expected: build succeeds again.

- [ ] **Step 9: Commit**

```bash
git add src/lib/splitBilingualBody.ts src/lib/splitBilingualBody.test.ts src/content.config.ts src/content/destinations
git commit -m "Add destinations content collection with schema validation and bilingual body splitter"
```

---

### Task 7: Destination pages

**Files:**
- Create: `src/components/pages/DestinationContent.astro`
- Create: `src/pages/[destination].astro`
- Create: `src/pages/en/[destination].astro`

**Interfaces:**
- Consumes: `splitBilingualBody` and the `destinations` collection (Task 6), `Header` (Task 4), `Footer` (Task 5).
- Produces: `<DestinationContent entry={entry} lang="pt" | "en" />` — the one shared front-end for a destination page, holding the markup and CSS once. Produces `/algarve`, `/madeira`, `/en/algarve`, `/en/madeira` — the pattern every future client-added destination automatically follows. No new page code is needed to add a third destination; only a new markdown file (Task 6's pattern).

- [ ] **Step 1: Add `marked` as a dependency**

Modify `package.json`, adding to `dependencies`:

```json
"marked": "^18.0.9"
```

Run: `npm install`

- [ ] **Step 2: Create the shared destination content component**

Create `src/components/pages/DestinationContent.astro`:

```astro
---
import { marked } from 'marked';
import Header from '../Header.astro';
import Footer from '../Footer.astro';
import { splitBilingualBody } from '../../lib/splitBilingualBody';
import type { CollectionEntry } from 'astro:content';

interface Props {
  entry: CollectionEntry<'destinations'>;
  lang: 'pt' | 'en';
}

const { entry, lang } = Astro.props;
const { data, body } = entry;
const sections = splitBilingualBody(body ?? '');
const bodyHtml = marked.parse(sections[lang]) as string;
const title = lang === 'pt' ? data.title_pt : data.title_en;
const country = lang === 'pt' ? data.country_pt : data.country_en;
---
<Header lang={lang} variant="withMenu" />
<main class="destination-page">
  <p class="destination-page__eyebrow">{country}</p>
  <h1 class="destination-page__title">{title}</h1>
  <div class="destination-page__body" set:html={bodyHtml} />
</main>
<Footer lang={lang} />

<style>
  .destination-page {
    width: var(--content-block-width);
    margin: 0 auto;
    padding-top: 244px;
    padding-bottom: 100px;
  }

  .destination-page__eyebrow {
    font-size: var(--text-label-size);
    line-height: var(--text-label-line);
    letter-spacing: var(--text-label-tracking);
    text-transform: uppercase;
    color: var(--color-text-muted-70);
    margin: 0 0 16px;
  }

  .destination-page__title {
    font-size: var(--text-page-title-size);
    line-height: var(--text-page-title-line);
    letter-spacing: var(--text-page-title-tracking);
    font-weight: normal;
    margin: 0 0 16px;
  }

  .destination-page__body {
    font-size: var(--text-body-size);
    line-height: var(--text-body-line);
    letter-spacing: var(--text-body-tracking);
  }
</style>
```

- [ ] **Step 3: Create the PT destination route**

Create `src/pages/[destination].astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import DestinationContent from '../components/pages/DestinationContent.astro';

export async function getStaticPaths() {
  const destinations = await getCollection('destinations');
  return destinations.map((entry) => ({
    params: { destination: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
---
<BaseLayout lang="pt" title={`Ummundu — ${entry.data.title_pt}`}>
  <DestinationContent entry={entry} lang="pt" />
</BaseLayout>
```

- [ ] **Step 4: Create the EN destination route**

Create `src/pages/en/[destination].astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import DestinationContent from '../../components/pages/DestinationContent.astro';

export async function getStaticPaths() {
  const destinations = await getCollection('destinations');
  return destinations.map((entry) => ({
    params: { destination: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
---
<BaseLayout lang="en" title={`Ummundu — ${entry.data.title_en}`}>
  <DestinationContent entry={entry} lang="en" />
</BaseLayout>
```

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Verify with:

```bash
grep -q "Algarve" dist/algarve/index.html && \
grep -q "Sob um sol perene" dist/algarve/index.html && \
grep -q "Under a perennial sun" dist/en/algarve/index.html && \
grep -q "Madeira Archipelago" dist/en/madeira/index.html && \
grep -q "Arquipélago da Madeira" dist/madeira/index.html && \
echo OK
```

Expected output: `OK`

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/components/pages/DestinationContent.astro "src/pages/[destination].astro" "src/pages/en/[destination].astro"
git commit -m "Add destination page template for both languages"
```

---

### Task 8: Menu overlay

**Files:**
- Create: `src/content/copy/menuOverlay.ts`
- Create: `src/components/MenuOverlay.astro`
- Modify: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes: the `destinations` collection (Task 6), `LanguageSwitcher` (Task 3), tokens (Task 1).
- Produces: `menuOverlayCopy: { pt: {...}, en: {...} }`, and `<MenuOverlay lang="pt" | "en" />`, rendered once by `BaseLayout` on every page. Listens globally for clicks on any `[data-menu-trigger]` element (Header's menu link, Task 4; Home's hero menu link, Task 9) and opens itself — no other component needs to know how the overlay works internally.

- [ ] **Step 1: Create the menu overlay content file**

Create `src/content/copy/menuOverlay.ts`:

```ts
export const menuOverlayCopy = {
  pt: {
    close: 'Fechar',
    destinations: 'Destinos',
    contact: 'Contacto',
    contactHref: '/contacto',
    destinationsLabel: 'destinos',
    back: 'Voltar',
  },
  en: {
    close: 'Close',
    destinations: 'Destinations',
    contact: 'Contact',
    contactHref: '/en/contact',
    destinationsLabel: 'destinations',
    back: 'Back',
  },
};
```

- [ ] **Step 2: Create `src/components/MenuOverlay.astro`**

```astro
---
import { getCollection } from 'astro:content';
import LanguageSwitcher from './LanguageSwitcher.astro';
import { menuOverlayCopy } from '../content/copy/menuOverlay';

interface Props {
  lang: 'pt' | 'en';
}

const { lang } = Astro.props;
const destinations = await getCollection('destinations');
const t = menuOverlayCopy[lang];
const destinationHref = (id: string) => (lang === 'pt' ? `/${id}` : `/en/${id}`);
---
<div class="menu-overlay" data-menu-overlay data-state="closed">
  <div class="menu-overlay__backdrop" data-menu-backdrop></div>
  <div class="menu-overlay__panel" data-menu-panel>
    <div class="menu-overlay__panel-top">
      <a href="#close" class="menu-overlay__close" data-menu-close>{t.close}</a>
    </div>

    <div class="menu-overlay__state1" data-panel-state1>
      <nav class="menu-overlay__nav">
        <a href="#destinos" data-menu-destinos>{t.destinations}</a>
        <a href={t.contactHref}>{t.contact}</a>
      </nav>
      <div class="menu-overlay__language">
        <LanguageSwitcher lang={lang} context="menu" />
      </div>
    </div>

    <div class="menu-overlay__state2" data-panel-state2>
      <p class="menu-overlay__eyebrow">{t.destinationsLabel}</p>
      <ul class="menu-overlay__destination-list">
        {destinations.map((entry) => (
          <li>
            <a href={destinationHref(entry.id)}>
              {lang === 'pt' ? entry.data.title_pt : entry.data.title_en}
            </a>
            {' · '}
            {lang === 'pt' ? entry.data.country_pt : entry.data.country_en}
          </li>
        ))}
      </ul>
      <a href="#back" class="menu-overlay__back" data-menu-back>{t.back}</a>
    </div>
  </div>
</div>

<style>
  .menu-overlay {
    position: fixed;
    inset: 0;
    visibility: hidden;
    pointer-events: none;
    z-index: 200;
  }

  .menu-overlay[data-state='state1'],
  .menu-overlay[data-state='state2'] {
    visibility: visible;
    pointer-events: auto;
  }

  .menu-overlay__backdrop {
    position: absolute;
    inset: 0;
    background: var(--color-overlay-backdrop);
  }

  .menu-overlay__panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: var(--content-block-width);
    background: var(--color-bg);
    padding: 0 var(--space-page-padding) 28px;
    display: flex;
    flex-direction: column;
    opacity: 0;
    transition: opacity 150ms ease;
  }

  .menu-overlay[data-state='state1'] .menu-overlay__panel,
  .menu-overlay[data-state='state2'] .menu-overlay__panel {
    opacity: 1;
  }

  .menu-overlay__panel-top {
    height: var(--space-header-height);
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .menu-overlay__close,
  .menu-overlay__back {
    font-size: var(--text-menu-size);
    line-height: var(--text-menu-line);
    letter-spacing: var(--text-menu-tracking);
    text-transform: capitalize;
  }

  .menu-overlay__state1,
  .menu-overlay__state2 {
    display: none;
    flex: 1;
    flex-direction: column;
  }

  .menu-overlay[data-state='state1'] .menu-overlay__state1 {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu-overlay[data-state='state2'] .menu-overlay__state2 {
    display: flex;
    padding-top: 127px;
    gap: 69px;
  }

  .menu-overlay__nav {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    font-size: var(--text-menu-link-size);
    line-height: var(--text-menu-link-line);
    letter-spacing: var(--text-menu-link-tracking);
    text-align: center;
  }

  .menu-overlay__language {
    position: absolute;
    bottom: 28px;
  }

  .menu-overlay__eyebrow {
    font-size: var(--text-label-size);
    line-height: var(--text-label-line);
    letter-spacing: var(--text-label-tracking);
    text-transform: uppercase;
    color: var(--color-text-muted-70);
    margin: 0;
  }

  .menu-overlay__destination-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 21px;
    font-size: var(--text-body-size);
    line-height: var(--text-body-line);
    letter-spacing: var(--text-body-tracking);
  }

  .menu-overlay__back {
    margin-top: auto;
  }
</style>

<script>
  function initMenuOverlay() {
    const overlay = document.querySelector<HTMLElement>('[data-menu-overlay]');
    if (!overlay) return;

    const setState = (state: 'closed' | 'state1' | 'state2') => {
      overlay.dataset.state = state;
    };

    document.querySelectorAll('[data-menu-trigger]').forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        setState('state1');
      });
    });

    overlay.querySelectorAll('[data-menu-close]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        setState('closed');
      });
    });

    overlay.querySelector('[data-menu-backdrop]')?.addEventListener('click', () => {
      setState('closed');
    });

    overlay.querySelector('[data-menu-destinos]')?.addEventListener('click', (event) => {
      event.preventDefault();
      setState('state2');
    });

    overlay.querySelector('[data-menu-back]')?.addEventListener('click', (event) => {
      event.preventDefault();
      setState('state1');
    });
  }

  initMenuOverlay();
</script>
```

- [ ] **Step 3: Render the overlay from `BaseLayout`**

Modify `src/layouts/BaseLayout.astro`:

```astro
---
import '../styles/tokens.css';
import MenuOverlay from '../components/MenuOverlay.astro';

interface Props {
  lang: 'pt' | 'en';
  title: string;
}

const { lang, title } = Astro.props;
---
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
    <MenuOverlay lang={lang} />
  </body>
</html>
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Verify with:

```bash
grep -q 'data-menu-overlay' dist/algarve/index.html && \
grep -q 'Algarve' dist/algarve/index.html && \
grep -q 'Madeira Archipelago' dist/en/algarve/index.html && \
echo OK
```

(The last check confirms the destination list inside the menu overlay — sourced from the same collection as Task 7's pages — renders on every page, not just the Home page.)

Expected output: `OK`

- [ ] **Step 5: Commit**

```bash
git add src/content/copy/menuOverlay.ts src/components/MenuOverlay.astro src/layouts/BaseLayout.astro
git commit -m "Add two-state menu overlay driven by the destinations collection"
```

---

### Task 9: Home page with fade-in loader

**Files:**
- Create: `src/content/copy/home.ts`
- Create: `src/components/Loader.astro`
- Create: `src/components/pages/HomeContent.astro`
- Create: `src/pages/index.astro` (rewrite)
- Create: `src/pages/en/index.astro`

**Interfaces:**
- Consumes: `Header` (Task 4, used with `variant="logoOnly"`), `Footer` (Task 5), the `destinations` collection (Task 6).
- Produces: `homeCopy: { pt: {...}, en: {...} }`, `<HomeContent lang="pt" | "en" />` (the shared front-end holding the Home page's markup and CSS once), and the PT home page at `/` and EN home page at `/en/`, both using `<Loader />`.

- [ ] **Step 1: Create the home content file**

Create `src/content/copy/home.ts`:

```ts
export const homeCopy = {
  pt: {
    title: 'Ummundu — Viagens',
    heroLines: ['viajar', 'entre', 'movimento', 'e quietude'],
    essenceLabel: 'Essência',
    essenceBody:
      'Onde o movimento encontra a quietude, o tempo abranda e o espaço ganha amplitude. A verdade revela-se enquanto o lugar convida a uma ligação profunda. Na beleza de simplesmente estar, reside uma elegância serena.',
    approachLabel: 'Abordagem',
    approachBody:
      'O rigor do planeamento e serviços criteriosamente selecionados dão forma a cada viagem. Tudo se articula com subtileza, num ritmo contínuo. A discrição preserva o que pertence ao silêncio, e apenas a confiança se torna percetível.',
    accessLabel: 'Acesso',
    accessList: [
      'Aviação privada e comercial',
      'Suites e residências',
      'Motorista particular',
      'Iates à vela e a motor',
      'Cozinha de autor',
      'Especialistas locais',
      'Bem-estar e performance',
      'Proteção pessoal',
      'Programas à medida',
    ],
    destinationsLabel: 'Destinos',
    menuAriaLabel: 'Abrir menu',
  },
  en: {
    title: 'Ummundu — Travel',
    heroLines: ['travel', 'between', 'motion and', 'stillness'],
    essenceLabel: 'Essence',
    essenceBody:
      'Where motion meets stillness, time slows and space expands. Truth reveals itself as place invites a profound connection. In the beauty of simply being resides a serene elegance.',
    approachLabel: 'Approach',
    approachBody:
      'Exacting planning and services selected with discernment give form to each journey. Everything is articulated with subtlety, in a continuous rhythm. Discretion preserves what belongs to silence, and only trust becomes perceptible.',
    accessLabel: 'Access',
    accessList: [
      'Private and commercial aviation',
      'Suites and residences',
      'Personal chauffeur',
      'Sailing and motor yachts',
      'Signature cuisine',
      'Local experts',
      'Well-being and performance',
      'Close protection',
      'Tailored programmes',
    ],
    destinationsLabel: 'Destinations',
    menuAriaLabel: 'Open menu',
  },
};
```

- [ ] **Step 2: Create the `Loader` component**

The intro uses the *inverted* palette (dark background, light logo) and dissolves over 250ms per the spec's Interactions & Motion table. It has no bilingual text, so it needs no content file.

Create `src/components/Loader.astro`:

```astro
---
---
<div class="loader" id="loader">
  <img src="/logo.svg" alt="Ummundu" class="loader__logo" />
</div>

<style>
  .loader {
    position: fixed;
    inset: 0;
    background: var(--color-intro-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 300;
    opacity: 1;
    transition: opacity 250ms ease;
  }

  .loader.is-hidden {
    opacity: 0;
    pointer-events: none;
  }

  .loader__logo {
    width: 151.192px;
    filter: brightness(0) saturate(100%) invert(88%) sepia(8%) saturate(508%) hue-rotate(346deg) brightness(97%) contrast(90%);
  }
</style>

<script>
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (!loader) return;
    requestAnimationFrame(() => {
      loader.classList.add('is-hidden');
    });
  });
</script>
```

- [ ] **Step 3: Create the shared Home content component**

Create `src/components/pages/HomeContent.astro`:

```astro
---
import { getCollection } from 'astro:content';
import Header from '../Header.astro';
import Footer from '../Footer.astro';
import { homeCopy } from '../../content/copy/home';

interface Props {
  lang: 'pt' | 'en';
}

const { lang } = Astro.props;
const t = homeCopy[lang];
const destinations = await getCollection('destinations');
---
<Header lang={lang} variant="logoOnly" />
<main class="home">
  <section class="home__hero">
    <a href="#menu" class="home__menu-link" data-menu-trigger aria-label={t.menuAriaLabel}>menu</a>
    <h1 class="home__display">
      {t.heroLines.map((line) => <span>{line}</span>)}
    </h1>
  </section>
  <div class="home__divider"></div>

  <section class="home__section">
    <p class="home__label">{t.essenceLabel}</p>
    <p class="home__body">{t.essenceBody}</p>
  </section>

  <section class="home__section">
    <p class="home__label">{t.approachLabel}</p>
    <p class="home__body">{t.approachBody}</p>
  </section>

  <section class="home__section">
    <p class="home__label">{t.accessLabel}</p>
    <ul class="home__access-list">
      {t.accessList.map((item) => <li>{item}</li>)}
    </ul>
  </section>

  <section class="home__section">
    <p class="home__label">{t.destinationsLabel}</p>
    <ul class="home__destination-list">
      {destinations.map((entry) => (
        <li>
          <a href={lang === 'pt' ? `/${entry.id}` : `/en/${entry.id}`}>
            {lang === 'pt' ? entry.data.title_pt : entry.data.title_en}
          </a>
          {' · '}
          {lang === 'pt' ? entry.data.country_pt : entry.data.country_en}
        </li>
      ))}
    </ul>
  </section>
</main>
<Footer lang={lang} />

<style>
  .home {
    width: var(--content-block-width);
    margin: 0 auto;
    padding-top: 30px;
  }

  .home__hero {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding-top: 241px;
  }

  .home__menu-link {
    font-size: var(--text-menu-size);
    line-height: var(--text-menu-line);
    letter-spacing: var(--text-menu-tracking);
    text-transform: capitalize;
  }

  .home__display {
    font-family: var(--font-display);
    font-weight: 200;
    font-size: var(--text-display-size);
    line-height: var(--text-display-line);
    letter-spacing: var(--text-display-tracking);
    text-transform: uppercase;
    margin: 0;
    align-self: flex-start;
  }

  .home__display span {
    display: block;
  }

  .home__divider {
    height: 1px;
    background: var(--color-text-muted-20);
    margin: 30px 0;
  }

  .home__section {
    margin-top: 199px;
  }

  .home__label {
    font-size: var(--text-label-size);
    line-height: var(--text-label-line);
    letter-spacing: var(--text-label-tracking);
    text-transform: uppercase;
    color: var(--color-text-muted-70);
    margin: 0 0 14px;
  }

  .home__body {
    font-size: var(--text-body-size);
    line-height: var(--text-body-line);
    letter-spacing: var(--text-body-tracking);
    margin: 0;
  }

  .home__access-list,
  .home__destination-list {
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: var(--text-body-size);
    line-height: var(--text-body-line);
    letter-spacing: var(--text-body-tracking);
  }

  .home__access-list li {
    margin-bottom: 9px;
  }

  .home__destination-list li {
    margin-bottom: 20px;
  }
</style>
```

- [ ] **Step 4: Create the PT home route**

Replace the contents of `src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Loader from '../components/Loader.astro';
import HomeContent from '../components/pages/HomeContent.astro';
import { homeCopy } from '../content/copy/home';
---
<BaseLayout lang="pt" title={homeCopy.pt.title}>
  <Loader />
  <HomeContent lang="pt" />
</BaseLayout>
```

- [ ] **Step 5: Create the EN home route**

Create `src/pages/en/index.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Loader from '../../components/Loader.astro';
import HomeContent from '../../components/pages/HomeContent.astro';
import { homeCopy } from '../../content/copy/home';
---
<BaseLayout lang="en" title={homeCopy.en.title}>
  <Loader />
  <HomeContent lang="en" />
</BaseLayout>
```

- [ ] **Step 6: Build and verify**

Run: `npm run build`
Verify with:

```bash
grep -q 'id="loader"' dist/index.html && \
grep -q 'viajar' dist/index.html && \
grep -q 'lang="en"' dist/en/index.html && \
grep -q 'travel' dist/en/index.html && \
grep -q 'Aviação privada' dist/index.html && \
grep -q 'Madeira Archipelago' dist/en/index.html && \
echo OK
```

Expected output: `OK`

- [ ] **Step 7: Commit**

```bash
git add src/content/copy/home.ts src/components/Loader.astro src/components/pages/HomeContent.astro src/pages/index.astro src/pages/en/index.astro
git commit -m "Add home pages with hero-embedded menu trigger and fade-in loader"
```

---

### Task 10: Contact page

**Files:**
- Create: `src/lib/getDepartureYears.ts`
- Test: `src/lib/getDepartureYears.test.ts`
- Create: `src/content/copy/contact.ts`
- Create: `src/components/pages/ContactPageContent.astro`
- Create: `src/pages/contacto.astro`
- Create: `src/pages/en/contact.astro`

**Interfaces:**
- Consumes: `Header` (Task 4), `Footer` (Task 5, with `showContactLink={false}`), the `destinations` collection (Task 6).
- Produces: `getDepartureYears(baseYear: number, span: number): number[]` — a rolling year window for the departure-year dropdown, since the Figma file only showed a fixed 2026–2027 example. Produces `contactCopy: { pt: {...}, en: {...} }` and `<ContactPageContent lang="pt" | "en" />` (the shared front-end holding the form's markup and CSS once). Produces `/contacto` and `/en/contact`, both posting to Formspree with a `_next` redirect to Task 11's success page.

- [ ] **Step 1: Write the failing test**

Create `src/lib/getDepartureYears.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getDepartureYears } from './getDepartureYears';

describe('getDepartureYears', () => {
  it('returns a span of consecutive years starting at baseYear', () => {
    expect(getDepartureYears(2026, 3)).toEqual([2026, 2027, 2028]);
  });

  it('returns a single year when span is 1', () => {
    expect(getDepartureYears(2030, 1)).toEqual([2030]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/getDepartureYears.test.ts`
Expected: FAIL — module does not exist yet.

- [ ] **Step 3: Implement `getDepartureYears`**

Create `src/lib/getDepartureYears.ts`:

```ts
export function getDepartureYears(baseYear: number, span: number): number[] {
  return Array.from({ length: span }, (_, index) => baseYear + index);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/getDepartureYears.test.ts`
Expected: PASS — both tests green.

- [ ] **Step 5: Create the contact content file**

Investment tiers are provisional placeholders (spec Open Items — the client hasn't supplied real price bands yet); everything else below is real copy pulled from Figma.

Create `src/content/copy/contact.ts`:

```ts
export const contactCopy = {
  pt: {
    title: 'Ummundu — Contacto',
    label: 'Contacto',
    intro: 'Partilhe as suas intenções. Um primeiro gesto que clarifica o rumo.',
    fields: {
      departure: 'Partida',
      month: 'Mês',
      year: 'Ano',
      destination: 'Destino',
      duration: 'Duração',
      travellers: 'Viajantes',
      investment: 'Investimento',
      firstName: 'Nome',
      lastName: 'Apelido',
      email: 'Email',
      phone: 'Telefone',
      message: 'Mensagem',
    },
    months: [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ],
    durations: ['7 dias', '8 dias', '9 dias', '10 dias', '11 dias', '12 dias', '13 dias', '14 dias', 'Mais de 14 dias'],
    travellerOptions: ['1 pessoa', '2 pessoas', '3 pessoas', '4 pessoas', '5 pessoas', '6 pessoas'],
    investmentOptions: ['Até 10.000€ por pessoa', '10.000€ a 25.000€ por pessoa', 'Mais de 25.000€ por pessoa'],
    requiredNote: '(*) Informação necessária',
    privacyPrefix: 'Os seus dados pessoais serão tratados para responder ao pedido. Consulte a ',
    privacyLinkLabel: 'Declaração de Privacidade',
    privacyLinkHref: '/privacidade',
    privacySuffix: ' para mais informações.',
    submit: 'Enviar',
    successRedirect: '/contacto/obrigado',
  },
  en: {
    title: 'Ummundu — Contact',
    label: 'Contact',
    intro: 'Share your intentions. A first note that clarifies the direction.',
    fields: {
      departure: 'Departure',
      month: 'Month',
      year: 'Year',
      destination: 'Destination',
      duration: 'Duration',
      travellers: 'Travellers',
      investment: 'Investment',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone',
      message: 'Message',
    },
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    durations: ['7 days', '8 days', '9 days', '10 days', '11 days', '12 days', '13 days', '14 days', 'More than 14 days'],
    travellerOptions: ['1 person', '2 people', '3 people', '4 people', '5 people', '6 people'],
    investmentOptions: ['Up to €10,000 per person', '€10,000 to €25,000 per person', 'More than €25,000 per person'],
    requiredNote: '(*) Required information',
    privacyPrefix: 'Your personal data will be processed to respond to the request. Consult the ',
    privacyLinkLabel: 'Privacy Statement',
    privacyLinkHref: '/en/privacy',
    privacySuffix: ' for further information.',
    submit: 'Send',
    successRedirect: '/en/contact/success',
  },
};
```

- [ ] **Step 6: Create the shared contact page content component**

Create `src/components/pages/ContactPageContent.astro`:

```astro
---
import { getCollection } from 'astro:content';
import Header from '../Header.astro';
import Footer from '../Footer.astro';
import { contactCopy } from '../../content/copy/contact';
import { getDepartureYears } from '../../lib/getDepartureYears';

interface Props {
  lang: 'pt' | 'en';
}

const { lang } = Astro.props;
const t = contactCopy[lang];
const destinations = await getCollection('destinations');
const years = getDepartureYears(new Date().getFullYear(), 3);
---
<Header lang={lang} variant="withMenu" />
<main class="contact">
  <p class="contact__label">{t.label}</p>
  <p class="contact__intro">{t.intro}</p>

  <form class="contact__form" action="https://formspree.io/f/REPLACE_WITH_FORM_ID" method="POST">
    <input type="hidden" name="_next" value={`https://REPLACE_WITH_DOMAIN${t.successRedirect}`} />

    <div class="contact__field">
      <label for={`departure-month-${lang}`}>{t.fields.departure}</label>
      <div class="contact__field-group">
        <select id={`departure-month-${lang}`} name="departure_month">
          <option value="" disabled selected>{t.fields.month}</option>
          {t.months.map((month) => <option value={month}>{month}</option>)}
        </select>
        <select id={`departure-year-${lang}`} name="departure_year">
          <option value="" disabled selected>{t.fields.year}</option>
          {years.map((year) => <option value={year}>{year}</option>)}
        </select>
      </div>
    </div>

    <div class="contact__field">
      <label for={`destination-${lang}`}>{t.fields.destination} <span class="contact__required">*</span></label>
      <select id={`destination-${lang}`} name="destination" required>
        <option value="" disabled selected></option>
        {destinations.map((entry) => (
          <option value={entry.id}>
            {lang === 'pt' ? entry.data.title_pt : entry.data.title_en}
            {' · '}
            {lang === 'pt' ? entry.data.country_pt : entry.data.country_en}
          </option>
        ))}
      </select>
    </div>

    <div class="contact__field">
      <label for={`duration-${lang}`}>{t.fields.duration} <span class="contact__required">*</span></label>
      <select id={`duration-${lang}`} name="duration" required>
        <option value="" disabled selected></option>
        {t.durations.map((duration) => <option value={duration}>{duration}</option>)}
      </select>
    </div>

    <div class="contact__field">
      <label for={`travellers-${lang}`}>{t.fields.travellers} <span class="contact__required">*</span></label>
      <select id={`travellers-${lang}`} name="travellers" required>
        <option value="" disabled selected></option>
        {t.travellerOptions.map((option) => <option value={option}>{option}</option>)}
      </select>
    </div>

    <div class="contact__field">
      <label for={`investment-${lang}`}>{t.fields.investment} <span class="contact__required">*</span></label>
      <select id={`investment-${lang}`} name="investment" required>
        <option value="" disabled selected></option>
        {t.investmentOptions.map((option) => <option value={option}>{option}</option>)}
      </select>
    </div>

    <div class="contact__field">
      <label for={`first-name-${lang}`}>{t.fields.firstName} <span class="contact__required">*</span></label>
      <input type="text" id={`first-name-${lang}`} name="first_name" required />
    </div>

    <div class="contact__field">
      <label for={`last-name-${lang}`}>{t.fields.lastName} <span class="contact__required">*</span></label>
      <input type="text" id={`last-name-${lang}`} name="last_name" required />
    </div>

    <div class="contact__field">
      <label for={`email-${lang}`}>{t.fields.email} <span class="contact__required">*</span></label>
      <input type="email" id={`email-${lang}`} name="email" required />
    </div>

    <div class="contact__field">
      <label for={`phone-${lang}`}>{t.fields.phone}</label>
      <input type="tel" id={`phone-${lang}`} name="phone" />
    </div>

    <div class="contact__field contact__field--message">
      <label for={`message-${lang}`}>{t.fields.message}</label>
      <textarea id={`message-${lang}`} name="message"></textarea>
    </div>

    <p class="contact__required-note">{t.requiredNote}</p>
    <p class="contact__privacy-note">
      {t.privacyPrefix}<a href={t.privacyLinkHref}>{t.privacyLinkLabel}</a>{t.privacySuffix}
    </p>

    <button type="submit" class="contact__submit">{t.submit}</button>
  </form>
</main>
<Footer lang={lang} showContactLink={false} />

<style>
  .contact {
    width: var(--content-block-width);
    margin: 0 auto;
    padding-top: 244px;
  }

  .contact__label {
    font-size: var(--text-label-size);
    line-height: var(--text-label-line);
    letter-spacing: var(--text-label-tracking);
    text-transform: uppercase;
    color: var(--color-text-muted-70);
    margin: 0 0 14px;
  }

  .contact__intro {
    font-size: var(--text-body-size);
    line-height: var(--text-body-line);
    letter-spacing: var(--text-body-tracking);
    margin: 0 0 68px;
  }

  .contact__form {
    display: flex;
    flex-direction: column;
    gap: 35px;
  }

  .contact__field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-bottom: 1px solid var(--color-text-muted-20);
    padding-bottom: 4px;
  }

  .contact__field label {
    font-size: var(--text-form-label-size);
    line-height: var(--text-form-label-line);
    letter-spacing: var(--text-form-label-tracking);
  }

  .contact__field select,
  .contact__field input,
  .contact__field textarea {
    font-family: var(--font-body);
    font-size: var(--text-form-label-size);
    border: none;
    background: transparent;
    color: var(--color-text);
    padding: 0;
  }

  .contact__field-group {
    display: flex;
    gap: 37px;
  }

  .contact__field--message textarea {
    border: 1px solid var(--color-text-muted-20);
    padding: 6px 10px;
    height: 92px;
    resize: vertical;
  }

  .contact__required {
    font-weight: 300;
  }

  .contact__required-note,
  .contact__privacy-note {
    font-size: var(--text-form-meta-size);
    line-height: var(--text-form-meta-line);
    letter-spacing: var(--text-form-meta-tracking);
    margin: 0;
  }

  .contact__submit {
    align-self: center;
    font-family: var(--font-body);
    font-size: var(--text-cta-size);
    line-height: var(--text-cta-line);
    letter-spacing: var(--text-cta-tracking);
    background: transparent;
    border: 1px solid var(--color-text-muted-20);
    padding: 8px 40px;
    cursor: pointer;
    color: var(--color-text);
  }
</style>
```

- [ ] **Step 7: Create the PT contact route**

Create `src/pages/contacto.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ContactPageContent from '../components/pages/ContactPageContent.astro';
import { contactCopy } from '../content/copy/contact';
---
<BaseLayout lang="pt" title={contactCopy.pt.title}>
  <ContactPageContent lang="pt" />
</BaseLayout>
```

- [ ] **Step 8: Create the EN contact route**

Create `src/pages/en/contact.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ContactPageContent from '../../components/pages/ContactPageContent.astro';
import { contactCopy } from '../../content/copy/contact';
---
<BaseLayout lang="en" title={contactCopy.en.title}>
  <ContactPageContent lang="en" />
</BaseLayout>
```

- [ ] **Step 9: Run all tests**

Run: `npx vitest run`
Expected: PASS — all tests across the project green.

- [ ] **Step 10: Build and verify**

Run: `npm run build`
Verify with:

```bash
grep -q "formspree.io/f/" dist/contacto/index.html && \
grep -q "formspree.io/f/" dist/en/contact/index.html && \
grep -q "Partilhe as suas intenções" dist/contacto/index.html && \
grep -q "Share your intentions" dist/en/contact/index.html && \
grep -q 'name="destination"' dist/contacto/index.html && \
echo OK
```

Expected output: `OK`

- [ ] **Step 11: Commit**

```bash
git add src/lib/getDepartureYears.ts src/lib/getDepartureYears.test.ts src/content/copy/contact.ts src/components/pages/ContactPageContent.astro src/pages/contacto.astro src/pages/en/contact.astro
git commit -m "Add contact page with the real 10-field travel inquiry form"
```

---

### Task 11: Contact success page

**Files:**
- Create: `src/content/copy/contactSuccess.ts`
- Create: `src/components/pages/ContactSuccessContent.astro`
- Create: `src/pages/contacto/obrigado.astro`
- Create: `src/pages/en/contact/success.astro`

**Interfaces:**
- Consumes: `Header` (Task 4), `Footer` (Task 5, with `showContactLink={false}`).
- Produces: `contactSuccessCopy: { pt: {...}, en: {...} }`, `<ContactSuccessContent lang="pt" | "en" />`, and `/contacto/obrigado` + `/en/contact/success` — the pages Task 10's forms redirect to via Formspree's `_next` field.

- [ ] **Step 1: Create the contact-success content file**

Create `src/content/copy/contactSuccess.ts`:

```ts
export const contactSuccessCopy = {
  pt: { title: 'Ummundu — Contacto', label: 'Contacto', message: 'Envio registado.' },
  en: { title: 'Ummundu — Contact', label: 'Contact', message: 'Message sent.' },
};
```

- [ ] **Step 2: Create the shared contact-success content component**

Create `src/components/pages/ContactSuccessContent.astro`:

```astro
---
import Header from '../Header.astro';
import Footer from '../Footer.astro';
import { contactSuccessCopy } from '../../content/copy/contactSuccess';

interface Props {
  lang: 'pt' | 'en';
}

const { lang } = Astro.props;
const { label, message } = contactSuccessCopy[lang];
---
<Header lang={lang} variant="withMenu" />
<main class="contact-success">
  <p class="contact-success__label">{label}</p>
  <p class="contact-success__message">{message}</p>
</main>
<Footer lang={lang} showContactLink={false} />

<style>
  .contact-success {
    width: var(--content-block-width);
    margin: 0 auto;
    padding-top: 244px;
    padding-bottom: 100px;
  }

  .contact-success__label {
    font-size: var(--text-label-size);
    line-height: var(--text-label-line);
    letter-spacing: var(--text-label-tracking);
    text-transform: uppercase;
    color: var(--color-text-muted-70);
    margin: 0 0 14px;
  }

  .contact-success__message {
    font-size: var(--text-body-size);
    line-height: var(--text-body-line);
    letter-spacing: var(--text-body-tracking);
    margin: 0;
  }
</style>
```

- [ ] **Step 3: Create the PT success route**

Create `src/pages/contacto/obrigado.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ContactSuccessContent from '../../components/pages/ContactSuccessContent.astro';
import { contactSuccessCopy } from '../../content/copy/contactSuccess';
---
<BaseLayout lang="pt" title={contactSuccessCopy.pt.title}>
  <ContactSuccessContent lang="pt" />
</BaseLayout>
```

- [ ] **Step 4: Create the EN success route**

Create `src/pages/en/contact/success.astro`:

```astro
---
import BaseLayout from '../../../layouts/BaseLayout.astro';
import ContactSuccessContent from '../../../components/pages/ContactSuccessContent.astro';
import { contactSuccessCopy } from '../../../content/copy/contactSuccess';
---
<BaseLayout lang="en" title={contactSuccessCopy.en.title}>
  <ContactSuccessContent lang="en" />
</BaseLayout>
```

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Verify with:

```bash
grep -q "Envio registado" dist/contacto/obrigado/index.html && \
grep -q "Message sent" dist/en/contact/success/index.html && \
echo OK
```

Expected output: `OK`

- [ ] **Step 6: Commit**

```bash
git add src/content/copy/contactSuccess.ts src/components/pages/ContactSuccessContent.astro src/pages/contacto/obrigado.astro src/pages/en/contact/success.astro
git commit -m "Add contact success pages"
```

---

### Task 12: Legal pages

**Files:**
- Create: `src/content/copy/legal/termsOfUse.ts`
- Create: `src/content/copy/legal/privacy.ts`
- Create: `src/content/copy/legal/accessibility.ts`
- Create: `src/content/copy/legal/termsOfSale.ts`
- Create: `src/layouts/LegalPage.astro`
- Create: `src/pages/termos-de-uso.astro`, `src/pages/privacidade.astro`, `src/pages/acessibilidade.astro`, `src/pages/condicoes-de-venda.astro`
- Create: `src/pages/en/terms-of-use.astro`, `src/pages/en/privacy.astro`, `src/pages/en/accessibility.astro`, `src/pages/en/terms-of-sale.astro`

**Interfaces:**
- Consumes: `Header` (Task 4), `Footer` (Task 5).
- Produces: `LegalPage.astro` accepting `Props { lang: 'pt' | 'en'; label: string; title: string; intro: string; sections: { title: string; body: string }[] }` — the fixed intro + 5-numbered-section structure confirmed identical across all four legal pages in Figma; it's the shared front-end, holding the markup and CSS once. Each legal document gets one content file holding both languages (`termsOfUseCopy`, `privacyCopy`, `accessibilityCopy`, `termsOfSaleCopy`), consumed by its PT and EN route file. All body copy below is a structural placeholder (Figma itself only has lorem-ipsum-style text) pending real legal copy from the client (spec Open Items) — the heading/section titles and page structure are final, the paragraph text is not.

- [ ] **Step 1: Create the four legal content files**

Create `src/content/copy/legal/termsOfUse.ts`:

```ts
export const termsOfUseCopy = {
  pt: {
    label: 'Termos de uso',
    title: 'Termos de Uso do Website',
    intro: 'Estes termos de uso estabelecem as condições de acesso e utilização do website da Ummundu.',
    sections: [
      { title: 'Âmbito de aplicação', body: 'Estes termos regem o acesso e a utilização do website Ummundu por parte dos seus visitantes.' },
      { title: 'Utilização do website', body: 'O conteúdo deste website destina-se a fins informativos e não constitui uma proposta contratual vinculativa.' },
      { title: 'Propriedade intelectual', body: 'Todo o conteúdo publicado é propriedade da Ummundu ou dos seus licenciadores, não podendo ser reproduzido sem autorização.' },
      { title: 'Limitação de responsabilidade', body: 'A Ummundu não se responsabiliza por danos decorrentes da utilização indevida deste website.' },
      { title: 'Alterações aos termos', body: 'Estes termos podem ser atualizados periodicamente, sendo a versão em vigor a publicada neste website.' },
    ],
  },
  en: {
    label: 'Terms of use',
    title: 'Website Terms of Use',
    intro: 'These terms of use set out the conditions for accessing and using the Ummundu website.',
    sections: [
      { title: 'Scope', body: 'These terms govern access to and use of the Ummundu website by its visitors.' },
      { title: 'Use of the website', body: "This website's content is for informational purposes and does not constitute a binding contractual offer." },
      { title: 'Intellectual property', body: 'All published content is the property of Ummundu or its licensors and may not be reproduced without authorization.' },
      { title: 'Limitation of liability', body: 'Ummundu is not liable for damages arising from improper use of this website.' },
      { title: 'Changes to these terms', body: 'These terms may be updated periodically; the version published on this website is the one in force.' },
    ],
  },
};
```

Create `src/content/copy/legal/privacy.ts`:

```ts
export const privacyCopy = {
  pt: {
    label: 'Privacidade',
    title: 'Declaração de Privacidade',
    intro: 'Esta declaração descreve como a Ummundu recolhe, utiliza e protege os dados pessoais dos seus utilizadores.',
    sections: [
      { title: 'Dados recolhidos', body: 'Recolhemos os dados pessoais que nos fornece através do formulário de contacto, como nome e contactos.' },
      { title: 'Finalidade do tratamento', body: 'Os dados são utilizados exclusivamente para responder ao seu pedido de contacto.' },
      { title: 'Partilha de dados', body: 'Os seus dados não são partilhados com terceiros, exceto quando exigido por lei.' },
      { title: 'Conservação de dados', body: 'Os dados são conservados apenas pelo período necessário para cumprir a finalidade da sua recolha.' },
      { title: 'Direitos do titular', body: 'Pode solicitar o acesso, retificação ou eliminação dos seus dados pessoais a qualquer momento.' },
    ],
  },
  en: {
    label: 'Privacy',
    title: 'Privacy Statement',
    intro: 'This statement describes how Ummundu collects, uses, and protects the personal data of its users.',
    sections: [
      { title: 'Data collected', body: 'We collect the personal data you provide through the contact form, such as your name and contact details.' },
      { title: 'Purpose of processing', body: 'Your data is used solely to respond to your contact request.' },
      { title: 'Data sharing', body: 'Your data is not shared with third parties, except where required by law.' },
      { title: 'Data retention', body: 'Data is retained only for as long as necessary to fulfil the purpose for which it was collected.' },
      { title: 'Your rights', body: 'You may request access to, correction of, or deletion of your personal data at any time.' },
    ],
  },
};
```

Create `src/content/copy/legal/accessibility.ts`:

```ts
export const accessibilityCopy = {
  pt: {
    label: 'Acessibilidade',
    title: 'Declaração de Acessibilidade',
    intro: 'Esta declaração descreve o compromisso da Ummundu com a acessibilidade digital.',
    sections: [
      { title: 'Compromisso', body: 'A Ummundu está empenhada em tornar este website acessível ao maior número possível de pessoas.' },
      { title: 'Estado de conformidade', body: 'Este website encontra-se em desenvolvimento contínuo relativamente às boas práticas de acessibilidade web.' },
      { title: 'Navegação por teclado', body: 'Todos os elementos interativos podem ser acedidos e utilizados através do teclado.' },
      { title: 'Contraste e legibilidade', body: 'As cores e tipografia foram escolhidas tendo em conta a legibilidade do conteúdo.' },
      { title: 'Contacto', body: 'Caso encontre dificuldades de acesso a este website, contacte-nos através da página de contacto.' },
    ],
  },
  en: {
    label: 'Accessibility',
    title: 'Accessibility Statement',
    intro: "This statement describes Ummundu's commitment to digital accessibility.",
    sections: [
      { title: 'Commitment', body: 'Ummundu is committed to making this website accessible to as many people as possible.' },
      { title: 'Conformance status', body: 'This website is under continuous development with regard to web accessibility best practices.' },
      { title: 'Keyboard navigation', body: 'All interactive elements can be accessed and used via the keyboard.' },
      { title: 'Contrast and legibility', body: 'Colors and typography were chosen with content legibility in mind.' },
      { title: 'Contact', body: 'If you experience any accessibility difficulties on this website, please contact us via the contact page.' },
    ],
  },
};
```

Create `src/content/copy/legal/termsOfSale.ts`:

```ts
export const termsOfSaleCopy = {
  pt: {
    label: 'Condições de venda',
    title: 'Condições Gerais de Venda',
    intro: 'Estas condições gerais de venda aplicam-se à contratação de serviços de viagem através da Ummundu.',
    sections: [
      { title: 'Objeto', body: 'Estas condições regem a venda de serviços de viagem organizados pela Ummundu.' },
      { title: 'Reservas e pagamentos', body: 'As reservas ficam confirmadas após a receção do respetivo pagamento, nos termos acordados.' },
      { title: 'Cancelamentos', body: 'As condições de cancelamento variam consoante o serviço contratado e serão comunicadas no momento da reserva.' },
      { title: 'Alterações ao itinerário', body: 'A Ummundu reserva-se o direito de alterar itinerários por motivos operacionais ou de força maior.' },
      { title: 'Reclamações', body: 'Qualquer reclamação deve ser dirigida à Ummundu através dos contactos disponibilizados neste website.' },
    ],
  },
  en: {
    label: 'Terms of sale',
    title: 'General Terms of Sale',
    intro: 'These general terms of sale apply to the booking of travel services through Ummundu.',
    sections: [
      { title: 'Purpose', body: 'These terms govern the sale of travel services organized by Ummundu.' },
      { title: 'Bookings and payment', body: 'Bookings are confirmed upon receipt of the corresponding payment, under the agreed terms.' },
      { title: 'Cancellations', body: 'Cancellation conditions vary depending on the service booked and will be communicated at the time of booking.' },
      { title: 'Itinerary changes', body: 'Ummundu reserves the right to change itineraries for operational reasons or force majeure.' },
      { title: 'Complaints', body: 'Any complaint should be directed to Ummundu through the contact details provided on this website.' },
    ],
  },
};
```

- [ ] **Step 2: Create the `LegalPage` layout**

Create `src/layouts/LegalPage.astro`:

```astro
---
import BaseLayout from './BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

interface Section {
  title: string;
  body: string;
}

interface Props {
  lang: 'pt' | 'en';
  label: string;
  title: string;
  intro: string;
  sections: Section[];
}

const { lang, label, title, intro, sections } = Astro.props;
---
<BaseLayout lang={lang} title={`Ummundu — ${title}`}>
  <Header lang={lang} variant="withMenu" />
  <main class="legal">
    <p class="legal__label">{label}</p>
    <h1 class="legal__title">{title}</h1>
    <p class="legal__intro">{intro}</p>
    <div class="legal__sections">
      {sections.map((section, index) => (
        <section class="legal__section">
          <h2 class="legal__section-title">{index + 1}. {section.title}</h2>
          <p class="legal__section-body">{section.body}</p>
        </section>
      ))}
    </div>
  </main>
  <Footer lang={lang} />
</BaseLayout>

<style>
  .legal {
    width: var(--content-block-width);
    margin: 0 auto;
    padding-top: 244px;
    padding-bottom: 100px;
  }

  .legal__label {
    font-size: var(--text-label-size);
    line-height: var(--text-label-line);
    letter-spacing: var(--text-label-tracking);
    text-transform: uppercase;
    color: var(--color-text-muted-70);
    margin: 0 0 14px;
  }

  .legal__title {
    font-size: var(--text-page-title-size);
    line-height: var(--text-page-title-line);
    letter-spacing: var(--text-page-title-tracking);
    font-weight: normal;
    margin: 0 0 16px;
  }

  .legal__intro {
    font-size: var(--text-body-size);
    line-height: var(--text-body-line);
    letter-spacing: var(--text-body-tracking);
    margin: 0 0 68px;
  }

  .legal__sections {
    display: flex;
    flex-direction: column;
    gap: 45px;
  }

  .legal__section-title {
    font-size: var(--text-page-subtitle-size);
    line-height: var(--text-page-subtitle-line);
    letter-spacing: var(--text-page-subtitle-tracking);
    font-weight: var(--text-page-subtitle-weight);
    margin: 0 0 12px;
  }

  .legal__section-body {
    font-size: var(--text-body-size);
    line-height: var(--text-body-line);
    letter-spacing: var(--text-body-tracking);
    margin: 0;
  }
</style>
```

- [ ] **Step 3: Create the four PT legal routes**

Each imports its shared content file and passes the `pt` half of it to `LegalPage`.

Create `src/pages/termos-de-uso.astro`:

```astro
---
import LegalPage from '../layouts/LegalPage.astro';
import { termsOfUseCopy } from '../content/copy/legal/termsOfUse';
---
<LegalPage lang="pt" {...termsOfUseCopy.pt} />
```

Create `src/pages/privacidade.astro`:

```astro
---
import LegalPage from '../layouts/LegalPage.astro';
import { privacyCopy } from '../content/copy/legal/privacy';
---
<LegalPage lang="pt" {...privacyCopy.pt} />
```

Create `src/pages/acessibilidade.astro`:

```astro
---
import LegalPage from '../layouts/LegalPage.astro';
import { accessibilityCopy } from '../content/copy/legal/accessibility';
---
<LegalPage lang="pt" {...accessibilityCopy.pt} />
```

Create `src/pages/condicoes-de-venda.astro`:

```astro
---
import LegalPage from '../layouts/LegalPage.astro';
import { termsOfSaleCopy } from '../content/copy/legal/termsOfSale';
---
<LegalPage lang="pt" {...termsOfSaleCopy.pt} />
```

- [ ] **Step 4: Create the four EN legal routes**

Create `src/pages/en/terms-of-use.astro`:

```astro
---
import LegalPage from '../../layouts/LegalPage.astro';
import { termsOfUseCopy } from '../../content/copy/legal/termsOfUse';
---
<LegalPage lang="en" {...termsOfUseCopy.en} />
```

Create `src/pages/en/privacy.astro`:

```astro
---
import LegalPage from '../../layouts/LegalPage.astro';
import { privacyCopy } from '../../content/copy/legal/privacy';
---
<LegalPage lang="en" {...privacyCopy.en} />
```

Create `src/pages/en/accessibility.astro`:

```astro
---
import LegalPage from '../../layouts/LegalPage.astro';
import { accessibilityCopy } from '../../content/copy/legal/accessibility';
---
<LegalPage lang="en" {...accessibilityCopy.en} />
```

Create `src/pages/en/terms-of-sale.astro`:

```astro
---
import LegalPage from '../../layouts/LegalPage.astro';
import { termsOfSaleCopy } from '../../content/copy/legal/termsOfSale';
---
<LegalPage lang="en" {...termsOfSaleCopy.en} />
```

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Verify with:

```bash
grep -q "Termos de Uso do Website" dist/termos-de-uso/index.html && \
grep -q "5. Alterações aos termos" dist/termos-de-uso/index.html && \
grep -q "Website Terms of Use" dist/en/terms-of-use/index.html && \
grep -q "Declaração de Privacidade" dist/privacidade/index.html && \
grep -q "Privacy Statement" dist/en/privacy/index.html && \
grep -q "Declaração de Acessibilidade" dist/acessibilidade/index.html && \
grep -q "Accessibility Statement" dist/en/accessibility/index.html && \
grep -q "Condições Gerais de Venda" dist/condicoes-de-venda/index.html && \
grep -q "General Terms of Sale" dist/en/terms-of-sale/index.html && \
echo OK
```

Expected output: `OK`

- [ ] **Step 6: Commit**

```bash
git add src/content/copy/legal src/layouts/LegalPage.astro src/pages/termos-de-uso.astro src/pages/privacidade.astro src/pages/acessibilidade.astro src/pages/condicoes-de-venda.astro src/pages/en/terms-of-use.astro src/pages/en/privacy.astro src/pages/en/accessibility.astro src/pages/en/terms-of-sale.astro
git commit -m "Add the four legal pages sharing one intro+5-section template"
```

---

### Task 13: Production deploy workflow (WebHS via FTP)

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npm run build` output at `dist/` (all prior tasks).
- Produces: nothing consumed by later tasks — this is the terminal production deploy step, gated on secrets that do not exist yet.

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to WebHS

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v7

      - name: Set up Node
        uses: actions/setup-node@v7
        with:
          node-version: 22

      - name: Install dependencies
        run: npm ci

      - name: Build site
        run: npm run build

      - name: Deploy over FTP
        uses: SamKirkland/FTP-Deploy-Action@v4.4.0
        with:
          server: ${{ secrets.WEBHS_FTP_HOST }}
          username: ${{ secrets.WEBHS_FTP_USERNAME }}
          password: ${{ secrets.WEBHS_FTP_PASSWORD }}
          local-dir: ./dist/
          server-dir: ./public_html/
```

`server-dir` uses the common cPanel convention `./public_html/` — confirm the actual web root directory with the client once FTP access is shared, and adjust if theirs differs.

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml')); print('valid')"`
Expected output: `valid`

If `python3`/`PyYAML` isn't available, manually re-check indentation is consistent (2 spaces, no tabs) instead.

- [ ] **Step 3: Add the required repository secrets**

Once the client shares WebHS FTP/cPanel credentials, add them as repository secrets:

```bash
gh secret set WEBHS_FTP_HOST
gh secret set WEBHS_FTP_USERNAME
gh secret set WEBHS_FTP_PASSWORD
```

Each command prompts for the value interactively. This step cannot be completed until credentials are received (spec Open Items) — leave the workflow committed and inactive-by-missing-secrets until then.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions workflow to deploy to WebHS over FTP"
```

---

### Task 14: Netlify staging environment

**Files:** none (external service configuration)

**Interfaces:** none — this task connects the existing repository to a hosted preview service; it does not change repository code.

- [ ] **Step 1: Create a Netlify site from the repository**

At `https://app.netlify.com`, choose "Add new site" → "Import an existing project" → GitHub → select the `ondastudio/ummundu` repository.

- [ ] **Step 2: Configure the build settings**

Set:
- Build command: `npm run build`
- Publish directory: `dist`

- [ ] **Step 3: Deploy and verify**

Trigger the first deploy (Netlify does this automatically on connecting the repo). Once it finishes, open the generated preview URL in a browser.

Expected: the PT home page loads at the root of the preview URL, the loader briefly appears then fades, the "menu" link opens the overlay (dissolve, no slide), clicking "Destinos" drills into the destination submenu, and `/en` loads the English home page.

- [ ] **Step 4: Confirm automatic preview deploys**

Push a trivial, reversible change (e.g. re-commit an already-verified file, or wait for the next real task's commit) and confirm Netlify posts a new deploy automatically without manual action.

No commit needed for this task — it is Netlify dashboard configuration only.

---

### Task 15: Client content-editing guide

**Files:**
- Create: `README.md`

**Interfaces:** none — this is documentation only.

- [ ] **Step 1: Write the README**

Create `README.md`:

```md
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

\`\`\`bash
npm install
npm run dev
\`\`\`

## Building for production

\`\`\`bash
npm run build
\`\`\`

Output is written to `dist/`.
```

- [ ] **Step 2: Verify the field names match the schema**

Compare each field name mentioned in `README.md` against `src/content.config.ts` from Task 6.
Expected: `title_en`, `title_pt`, `country_en`, `country_pt` all match exactly.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Add client-facing content editing guide"
```
