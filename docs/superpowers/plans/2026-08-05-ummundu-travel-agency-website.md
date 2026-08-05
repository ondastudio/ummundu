# Ummundu Travel Agency Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (PT/EN), no-CMS, editorial static website for a travel agency, with a content model the client can safely edit via GitHub, deployable to WebHS shared hosting.

**Architecture:** An Astro site with `output: 'static'`, using Astro's built-in i18n routing (Portuguese at `/`, English at `/en/`). Destination content lives as one markdown file per destination in an Astro content collection with a Zod schema, containing both languages in a single file (suffixed frontmatter keys, `## EN` / `## PT` body sections). Styling is scoped CSS per component plus a shared tokens file — no utility CSS framework. Production deploys to WebHS via a GitHub Actions FTP workflow; Netlify/Vercel provides staging preview links during development.

**Tech Stack:** Astro 7, TypeScript, Vitest, `marked` (for rendering split markdown body sections), Formspree (contact form), GitHub Actions + `SamKirkland/FTP-Deploy-Action` (production deploy).

## Global Constraints

- Static output only — no server runtime, no database, no CMS in production (spec: Non-Goals)
- Portuguese is the default locale served at `/`; English is served at `/en/`; no automatic browser/geo language detection (spec: Internationalization)
- Destination content is authored as one markdown file per destination containing both languages, using flat suffixed frontmatter keys (`title_en`/`title_pt`, etc.) and `## EN` / `## PT` body sections — never nested/indented per-language YAML (spec: Content Model)
- Content schema must be validated at build time (Astro content collections + Zod) so a malformed client edit fails the build with a clear error rather than shipping silently (spec: Content Model)
- No Tailwind or utility CSS framework — scoped component CSS plus a shared design-tokens file (spec: Stack)
- Contact form submits via Formspree, not Netlify Forms (spec: Stack — production host is not Netlify)
- Production hosting is WebHS (FTP-based shared hosting); Netlify/Vercel is staging only, never production (spec: Hosting & Deployment)

---

### Task 1: Astro project scaffold

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `src/pages/index.astro`

**Interfaces:**
- Produces: a working `npm run build` command producing `dist/index.html`; Astro i18n config (`defaultLocale: 'pt'`, `locales: ['pt', 'en']`, `prefixDefaultLocale: false`) that all later page tasks rely on for routing.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "ummundu",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^7.1.6"
  }
}
```

- [ ] **Step 2: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  i18n: {
    defaultLocale: 'pt',
    locales: ['pt', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 4: Create `.gitignore`**

```
node_modules/
dist/
.astro/
.env
```

- [ ] **Step 5: Create a minimal `src/pages/index.astro`**

```astro
---
---
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <title>Ummundu</title>
  </head>
  <body>
    <h1>Ummundu</h1>
  </body>
</html>
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`

- [ ] **Step 7: Build and verify**

Run: `npm run build`
Expected: build succeeds, and `dist/index.html` exists containing `<h1>Ummundu</h1>`.

Verify with: `grep -q "Ummundu" dist/index.html && echo OK`
Expected output: `OK`

- [ ] **Step 8: Commit**

```bash
git add package.json astro.config.mjs tsconfig.json .gitignore src/pages/index.astro package-lock.json
git commit -m "Scaffold Astro static site with PT/EN i18n config"
```

---

### Task 2: Design tokens and base layout

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: nothing from earlier tasks beyond the working build from Task 1.
- Produces: `BaseLayout.astro` accepting `Props { lang: 'pt' | 'en'; title: string }` with a default `<slot />` for page content. All later page tasks wrap their content in this layout.

- [ ] **Step 1: Create `src/styles/tokens.css`**

```css
:root {
  --color-bg: #faf7f2;
  --color-text: #1a1a1a;
  --color-accent: #c1502e;
  --font-serif: Georgia, "Times New Roman", serif;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --type-scale-base: 1rem;
  --type-scale-lg: 1.75rem;
  --type-scale-xl: 3rem;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: Create `src/layouts/BaseLayout.astro`**

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

- [ ] **Step 3: Update `src/pages/index.astro` to use the layout**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout lang="pt" title="Ummundu">
  <h1>Ummundu</h1>
</BaseLayout>
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Verify with: `grep -q 'lang="pt"' dist/index.html && grep -q "Ummundu" dist/index.html && echo OK`
Expected output: `OK`

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css src/layouts/BaseLayout.astro src/pages/index.astro
git commit -m "Add design tokens and base layout"
```

---

### Task 3: Destination content collection, schema, and bilingual body splitter

**Files:**
- Create: `src/content.config.ts`
- Create: `src/lib/splitBilingualBody.ts`
- Test: `src/lib/splitBilingualBody.test.ts`
- Create: `vitest.config.ts`
- Create: `src/content/destinations/bali.md`
- Create: `src/content/destinations/azores.md`
- Create: `src/content/destinations/images/bali-hero.svg`
- Create: `src/content/destinations/images/azores-hero.svg`
- Modify: `package.json`

**Interfaces:**
- Produces: `splitBilingualBody(body: string): { en: string; pt: string }` (throws `Error('Destination body must contain both "## EN" and "## PT" sections')` if either section is missing) — used by Task 6's destination template. Produces the `destinations` collection with schema fields `title_en`, `title_pt`, `subtitle_en`, `subtitle_pt`, `hero_image` (an Astro `image()` reference) — used by Task 6.

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

- [ ] **Step 3: Write the failing test for `splitBilingualBody`**

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

  it('preserves multi-paragraph markdown within a section', () => {
    const body =
      '## EN\nFirst paragraph.\n\nSecond paragraph.\n\n## PT\nPrimeiro parágrafo.';
    const result = splitBilingualBody(body);
    expect(result.en).toBe('First paragraph.\n\nSecond paragraph.');
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run src/lib/splitBilingualBody.test.ts`
Expected: FAIL — `src/lib/splitBilingualBody.ts` does not exist yet.

- [ ] **Step 5: Implement `splitBilingualBody`**

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

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/lib/splitBilingualBody.test.ts`
Expected: PASS — all 4 tests green.

- [ ] **Step 7: Create the content collection config**

Create `src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const destinations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/destinations' }),
  schema: ({ image }) =>
    z.object({
      title_en: z.string().min(1),
      title_pt: z.string().min(1),
      subtitle_en: z.string().min(1),
      subtitle_pt: z.string().min(1),
      hero_image: image(),
    }),
});

export const collections = { destinations };
```

- [ ] **Step 8: Create placeholder hero images**

Create `src/content/destinations/images/bali-hero.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="#c1502e" />
  <text x="60" y="740" font-family="Georgia, serif" font-size="48" fill="#faf7f2">Bali</text>
</svg>
```

Create `src/content/destinations/images/azores-hero.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="#2e5c8a" />
  <text x="60" y="740" font-family="Georgia, serif" font-size="48" fill="#faf7f2">Açores</text>
</svg>
```

These are working placeholders to prove the pipeline; the client will replace them with real photography later.

- [ ] **Step 9: Create the two sample destination files**

Create `src/content/destinations/bali.md`:

```md
---
title_en: "Bali"
title_pt: "Bali"
subtitle_en: "Where the ocean meets the soul"
subtitle_pt: "Onde o oceano encontra a alma"
hero_image: "./images/bali-hero.svg"
---

## EN
Bali is an island of ritual and rhythm, where every sunrise begins with an offering and every sunset ends at the edge of the sea. Rice terraces fold into the hills, and the pace of the day follows the tide.

## PT
Bali é uma ilha de ritual e ritmo, onde cada nascer do sol começa com uma oferenda e cada pôr do sol termina à beira-mar. Os terraços de arroz dobram-se sobre as colinas, e o ritmo do dia segue a maré.
```

Create `src/content/destinations/azores.md`:

```md
---
title_en: "Azores"
title_pt: "Açores"
subtitle_en: "Nine islands, one horizon"
subtitle_pt: "Nove ilhas, um só horizonte"
hero_image: "./images/azores-hero.svg"
---

## EN
Volcanic craters hold lakes the color of glass, and the Atlantic never sits still along these nine islands. It's a landscape built on contrast — green fields, black rock, blue water.

## PT
Crateras vulcânicas guardam lagoas da cor do vidro, e o Atlântico nunca pára ao longo destas nove ilhas. É uma paisagem construída sobre contrastes — campos verdes, rocha negra, água azul.
```

- [ ] **Step 10: Build and verify the collection loads**

Run: `npm run build`
Expected: build succeeds with no schema errors (the two destination files are not yet rendered on any page — this step only proves the collection and schema are valid).

- [ ] **Step 11: Verify the schema fails loudly on bad content**

This step proves the core safety requirement: a client mistake must break the build with a clear error, not ship silently.

Temporarily create `src/content/destinations/broken-test.md`:

```md
---
title_en: "Broken"
title_pt: "Quebrado"
subtitle_en: "Missing subtitle_pt and hero_image"
hero_image: "./images/bali-hero.svg"
---

## EN
Test content.

## PT
Conteúdo de teste.
```

Run: `npm run build`
Expected: build FAILS with a Zod validation error naming `subtitle_pt` as missing/required.

Then delete the fixture:

```bash
rm src/content/destinations/broken-test.md
```

Run: `npm run build`
Expected: build succeeds again.

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/splitBilingualBody.ts src/lib/splitBilingualBody.test.ts src/content.config.ts src/content/destinations
git commit -m "Add destinations content collection with schema validation and bilingual body splitter"
```

---

### Task 4: Language switcher

**Files:**
- Create: `src/lib/getAlternateLocalePath.ts`
- Test: `src/lib/getAlternateLocalePath.test.ts`
- Create: `src/components/LanguageSwitcher.astro`

**Interfaces:**
- Consumes: `--color-text` and `--font-sans` tokens from Task 2's `tokens.css`.
- Produces: `getAlternateLocalePath(pathname: string, currentLang: 'pt' | 'en'): string`, and `<LanguageSwitcher lang="pt" | "en" />` — used by every page task from here on.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/getAlternateLocalePath.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getAlternateLocalePath } from './getAlternateLocalePath';

describe('getAlternateLocalePath', () => {
  it('maps the PT home page to the EN home page', () => {
    expect(getAlternateLocalePath('/', 'pt')).toBe('/en');
  });

  it('maps a PT subpage to the equivalent EN subpage', () => {
    expect(getAlternateLocalePath('/destinations/bali', 'pt')).toBe(
      '/en/destinations/bali'
    );
  });

  it('maps the EN home page to the PT home page', () => {
    expect(getAlternateLocalePath('/en', 'en')).toBe('/');
  });

  it('maps an EN subpage to the equivalent PT subpage', () => {
    expect(getAlternateLocalePath('/en/destinations/bali', 'en')).toBe(
      '/destinations/bali'
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/getAlternateLocalePath.test.ts`
Expected: FAIL — module does not exist yet.

- [ ] **Step 3: Implement `getAlternateLocalePath`**

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

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/getAlternateLocalePath.test.ts`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Create the `LanguageSwitcher` component**

Create `src/components/LanguageSwitcher.astro`:

```astro
---
import { getAlternateLocalePath } from '../lib/getAlternateLocalePath';

interface Props {
  lang: 'pt' | 'en';
}

const { lang } = Astro.props;
const alternatePath = getAlternateLocalePath(Astro.url.pathname, lang);
const alternateLabel = lang === 'pt' ? 'EN' : 'PT';
---
<a href={alternatePath} class="language-switcher">{alternateLabel}</a>

<style>
  .language-switcher {
    text-decoration: none;
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 0.875rem;
  }
</style>
```

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: PASS — all tests across the project green.

- [ ] **Step 7: Commit**

```bash
git add src/lib/getAlternateLocalePath.ts src/lib/getAlternateLocalePath.test.ts src/components/LanguageSwitcher.astro
git commit -m "Add language switcher with pure path-mapping function"
```

---

### Task 5: Home page with fade-in loader

**Files:**
- Create: `src/components/Loader.astro`
- Create: `public/logo.svg`
- Modify: `src/pages/index.astro`
- Create: `src/pages/en/index.astro`

**Interfaces:**
- Consumes: `BaseLayout` (Task 2), `LanguageSwitcher` (Task 4).
- Produces: the PT home page at `/` and EN home page at `/en/`, both using `<Loader />`.

- [ ] **Step 1: Create the logo asset**

Create `public/logo.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
  <text x="0" y="40" font-family="Georgia, serif" font-size="32" fill="#1a1a1a">ummundu</text>
</svg>
```

- [ ] **Step 2: Create the `Loader` component**

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
    background: var(--color-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    opacity: 1;
    transition: opacity 0.6s ease;
  }

  .loader.is-hidden {
    opacity: 0;
    pointer-events: none;
  }

  .loader__logo {
    width: 120px;
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

- [ ] **Step 3: Rewrite the PT home page**

Replace the contents of `src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Loader from '../components/Loader.astro';
import LanguageSwitcher from '../components/LanguageSwitcher.astro';
---
<BaseLayout lang="pt" title="Ummundu — Viagens">
  <Loader />
  <header>
    <LanguageSwitcher lang="pt" />
  </header>
  <main>
    <h1>Ummundu</h1>
    <p>Viagens feitas para explorar o mundo.</p>
  </main>
</BaseLayout>
```

- [ ] **Step 4: Create the EN home page**

Create `src/pages/en/index.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Loader from '../../components/Loader.astro';
import LanguageSwitcher from '../../components/LanguageSwitcher.astro';
---
<BaseLayout lang="en" title="Ummundu — Travel">
  <Loader />
  <header>
    <LanguageSwitcher lang="en" />
  </header>
  <main>
    <h1>Ummundu</h1>
    <p>Travel made to explore the world.</p>
  </main>
</BaseLayout>
```

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Verify with:

```bash
grep -q 'id="loader"' dist/index.html && \
grep -q 'lang="en"' dist/en/index.html && \
grep -q 'id="loader"' dist/en/index.html && \
echo OK
```

Expected output: `OK`

- [ ] **Step 6: Commit**

```bash
git add public/logo.svg src/components/Loader.astro src/pages/index.astro src/pages/en/index.astro
git commit -m "Add home pages with fade-in loader"
```

---

### Task 6: Destination detail pages

**Files:**
- Create: `src/components/destinations/DestinationDetail.astro`
- Create: `src/pages/destinations/[id].astro`
- Create: `src/pages/en/destinations/[id].astro`
- Modify: `package.json`

**Interfaces:**
- Consumes: `splitBilingualBody` (Task 3), `destinations` collection schema (Task 3), `BaseLayout` (Task 2), `LanguageSwitcher` (Task 4).
- Produces: `/destinations/bali`, `/destinations/azores`, `/en/destinations/bali`, `/en/destinations/azores` — the pattern every future client-added destination automatically follows.

- [ ] **Step 1: Add `marked` as a dependency**

Modify `package.json`, adding to `dependencies`:

```json
"marked": "^18.0.9"
```

Run: `npm install`

- [ ] **Step 2: Create the shared `DestinationDetail` component**

Create `src/components/destinations/DestinationDetail.astro`:

```astro
---
import { Image } from 'astro:assets';
import { marked } from 'marked';
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
const subtitle = lang === 'pt' ? data.subtitle_pt : data.subtitle_en;
---
<article>
  <Image src={data.hero_image} alt={title} />
  <h1>{title}</h1>
  <p class="subtitle">{subtitle}</p>
  <div class="body" set:html={bodyHtml} />
</article>

<style>
  .subtitle {
    font-family: var(--font-serif);
    font-size: var(--type-scale-lg);
  }

  .body {
    max-width: 65ch;
    line-height: 1.6;
  }
</style>
```

- [ ] **Step 3: Create the PT destination route**

Create `src/pages/destinations/[id].astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import LanguageSwitcher from '../../components/LanguageSwitcher.astro';
import DestinationDetail from '../../components/destinations/DestinationDetail.astro';

export async function getStaticPaths() {
  const destinations = await getCollection('destinations');
  return destinations.map((entry) => ({
    params: { id: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
---
<BaseLayout lang="pt" title={entry.data.title_pt}>
  <header>
    <LanguageSwitcher lang="pt" />
  </header>
  <DestinationDetail entry={entry} lang="pt" />
</BaseLayout>
```

- [ ] **Step 4: Create the EN destination route**

Create `src/pages/en/destinations/[id].astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import LanguageSwitcher from '../../../components/LanguageSwitcher.astro';
import DestinationDetail from '../../../components/destinations/DestinationDetail.astro';

export async function getStaticPaths() {
  const destinations = await getCollection('destinations');
  return destinations.map((entry) => ({
    params: { id: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
---
<BaseLayout lang="en" title={entry.data.title_en}>
  <header>
    <LanguageSwitcher lang="en" />
  </header>
  <DestinationDetail entry={entry} lang="en" />
</BaseLayout>
```

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Verify with:

```bash
grep -q "Bali" dist/destinations/bali/index.html && \
grep -q "Onde o oceano" dist/destinations/bali/index.html && \
grep -q "Where the ocean" dist/en/destinations/bali/index.html && \
grep -q "Açores" dist/destinations/azores/index.html && \
echo OK
```

Expected output: `OK`

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/components/destinations src/pages/destinations src/pages/en/destinations
git commit -m "Add destination detail page template for both languages"
```

---

### Task 7: Contact page

**Files:**
- Create: `src/pages/contact.astro`
- Create: `src/pages/en/contact.astro`

**Interfaces:**
- Consumes: `BaseLayout` (Task 2), `LanguageSwitcher` (Task 4).
- Produces: `/contact` and `/en/contact` (note: spec uses "contact" as the page name; the PT route below uses `/contacto` to match the language — confirm the exact desired PT URL slug with the client if it matters for existing marketing links).

- [ ] **Step 1: Create the PT contact page**

Create `src/pages/contacto.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import LanguageSwitcher from '../components/LanguageSwitcher.astro';
---
<BaseLayout lang="pt" title="Ummundu — Contacto">
  <header>
    <LanguageSwitcher lang="pt" />
  </header>
  <main>
    <h1>Contacto</h1>
    <form action="https://formspree.io/f/REPLACE_WITH_FORM_ID" method="POST">
      <label for="name">Nome</label>
      <input type="text" id="name" name="name" required />

      <label for="email">Email</label>
      <input type="email" id="email" name="email" required />

      <label for="message">Mensagem</label>
      <textarea id="message" name="message" required></textarea>

      <button type="submit">Enviar</button>
    </form>
  </main>
</BaseLayout>
```

- [ ] **Step 2: Create the EN contact page**

Create `src/pages/en/contact.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import LanguageSwitcher from '../../components/LanguageSwitcher.astro';
---
<BaseLayout lang="en" title="Ummundu — Contact">
  <header>
    <LanguageSwitcher lang="en" />
  </header>
  <main>
    <h1>Contact</h1>
    <form action="https://formspree.io/f/REPLACE_WITH_FORM_ID" method="POST">
      <label for="name">Name</label>
      <input type="text" id="name" name="name" required />

      <label for="email">Email</label>
      <input type="email" id="email" name="email" required />

      <label for="message">Message</label>
      <textarea id="message" name="message" required></textarea>

      <button type="submit">Send</button>
    </form>
  </main>
</BaseLayout>
```

- [ ] **Step 3: Create a Formspree form and replace the placeholder endpoint**

Go to `https://formspree.io`, create a free account and a new form, and copy its endpoint ID (the part after `/f/`). Replace `REPLACE_WITH_FORM_ID` in both files above with that ID.

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Verify with:

```bash
grep -q "formspree.io/f/" dist/contacto/index.html && \
grep -q "formspree.io/f/" dist/en/contact/index.html && \
echo OK
```

Expected output: `OK`

- [ ] **Step 5: Commit**

```bash
git add src/pages/contacto.astro src/pages/en/contact.astro
git commit -m "Add contact page with Formspree form"
```

---

### Task 8: Privacy page pattern

**Files:**
- Create: `src/layouts/LegalPage.astro`
- Create: `src/pages/privacidade.astro`
- Create: `src/pages/en/privacy.astro`

**Interfaces:**
- Consumes: `BaseLayout` (Task 2), `LanguageSwitcher` (Task 4).
- Produces: `LegalPage.astro` accepting `Props { lang: 'pt' | 'en'; title: string }` with a `<slot />` for body content — the pattern any future legal page (cookie policy, terms) duplicates once the client's Figma design finalizes the full list.

- [ ] **Step 1: Create the `LegalPage` layout**

Create `src/layouts/LegalPage.astro`:

```astro
---
import BaseLayout from './BaseLayout.astro';
import LanguageSwitcher from '../components/LanguageSwitcher.astro';

interface Props {
  lang: 'pt' | 'en';
  title: string;
}

const { lang, title } = Astro.props;
---
<BaseLayout lang={lang} title={title}>
  <header>
    <LanguageSwitcher lang={lang} />
  </header>
  <main class="legal">
    <h1>{title}</h1>
    <slot />
  </main>
</BaseLayout>

<style>
  .legal {
    max-width: 65ch;
    margin: 0 auto;
    line-height: 1.6;
  }
</style>
```

- [ ] **Step 2: Create the PT privacy policy page**

Create `src/pages/privacidade.astro`:

```astro
---
import LegalPage from '../layouts/LegalPage.astro';
---
<LegalPage lang="pt" title="Política de Privacidade">
  <p>
    Esta página descreve como a Ummundu recolhe, utiliza e protege os dados
    dos seus utilizadores.
  </p>
</LegalPage>
```

- [ ] **Step 3: Create the EN privacy policy page**

Create `src/pages/en/privacy.astro`:

```astro
---
import LegalPage from '../../layouts/LegalPage.astro';
---
<LegalPage lang="en" title="Privacy Policy">
  <p>
    This page describes how Ummundu collects, uses, and protects user data.
  </p>
</LegalPage>
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Verify with:

```bash
grep -q "Política de Privacidade" dist/privacidade/index.html && \
grep -q "Privacy Policy" dist/en/privacy/index.html && \
echo OK
```

Expected output: `OK`

- [ ] **Step 5: Commit**

```bash
git add src/layouts/LegalPage.astro src/pages/privacidade.astro src/pages/en/privacy.astro
git commit -m "Add reusable legal page layout with privacy policy example"
```

**Note:** the full list of privacy/legal pages (cookie policy, terms, etc.) is pending the client's Figma design (spec Open Items). Additional pages follow this same `LegalPage` pattern — duplicate Steps 2–3 with new content once the list is confirmed.

---

### Task 9: Production deploy workflow (WebHS via FTP)

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

### Task 10: Netlify staging environment

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

Expected: the PT home page loads at the root of the preview URL, the loader briefly appears then fades, and `/en` loads the English home page.

- [ ] **Step 4: Confirm automatic preview deploys**

Push a trivial, reversible change (e.g. re-commit an already-verified file, or wait for the next real task's commit) and confirm Netlify posts a new deploy automatically without manual action.

No commit needed for this task — it is Netlify dashboard configuration only.

---

### Task 11: Client content-editing guide

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
2. Click on an existing file (e.g. `bali.md`) to use as a starting point.
3. Click the pencil (edit) icon, then use "Save a copy" or create a new file
   with a new name (e.g. `porto.md`) using the "Add file" button in the
   `destinations` folder.
4. Fill in the fields at the top of the file (between the `---` lines):
   - `title_en` / `title_pt` — the destination name in each language
   - `subtitle_en` / `subtitle_pt` — a short tagline in each language
   - `hero_image` — path to the destination's photo (see below)
5. Below the `---` lines, write the description under two headings:
   `## EN` for the English text, `## PT` for the Portuguese text.
6. Commit the change directly to the `main` branch (or open a pull request
   if you'd prefer someone to review first).

**Important:** every field must be filled in for both languages. If a field
is missing, the site will fail to update and show a build error instead of
publishing a broken page — this is intentional, so mistakes are caught
before they go live.

## Adding a destination photo

1. In `src/content/destinations/images/`, use "Add file" → "Upload files"
   to add your photo.
2. Reference it from your destination file as
   `hero_image: "./images/your-photo-name.jpg"`.

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
```

- [ ] **Step 2: Verify the field names match the schema**

Compare each field name mentioned in `README.md` against `src/content.config.ts` from Task 3.
Expected: `title_en`, `title_pt`, `subtitle_en`, `subtitle_pt`, `hero_image` all match exactly.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Add client-facing content editing guide"
```
