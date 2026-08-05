import { describe, it, expect } from 'vitest';
import { getAlternateLocalePath } from './getAlternateLocalePath';

// This helper does naive prefix mapping (`/x` <-> `/en/x`), which is only
// correct for paths whose slug is identical in both languages. That's true
// for destination pages (e.g. /algarve <-> /en/algarve) — see
// `src/content/copy/routes.ts`, which uses this helper for exactly that
// case — but NOT true in general for other pages (e.g. /contacto <->
// /en/contact), which are handled by the explicit `routes` registry instead.
describe('getAlternateLocalePath', () => {
  it('maps a PT destination page to the equivalent EN destination page', () => {
    expect(getAlternateLocalePath('/algarve', 'pt')).toBe('/en/algarve');
  });

  it('maps an EN destination page to the equivalent PT destination page', () => {
    expect(getAlternateLocalePath('/en/algarve', 'en')).toBe('/algarve');
  });

  it('maps the PT home page to the EN home page', () => {
    expect(getAlternateLocalePath('/', 'pt')).toBe('/en');
  });

  it('maps the EN home page to the PT home page', () => {
    expect(getAlternateLocalePath('/en', 'en')).toBe('/');
  });
});
