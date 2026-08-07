import { describe, it, expect } from 'vitest';
import { getAlternateLocalePath } from './getAlternateLocalePath';

// This helper does naive prefix mapping (`/x` <-> `/pt/x`), which is only
// correct for paths whose slug is identical in both languages. That's true
// for destination pages (e.g. /algarve <-> /pt/algarve) — see
// `src/content/copy/routes.ts`, which uses this helper for exactly that
// case — but NOT true in general for other pages (e.g. /contact <->
// /pt/contacto), which are handled by the explicit `routes` registry instead.
describe('getAlternateLocalePath', () => {
  it('maps an EN destination page to the equivalent PT destination page', () => {
    expect(getAlternateLocalePath('/algarve', 'en')).toBe('/pt/algarve');
  });

  it('maps a PT destination page to the equivalent EN destination page', () => {
    expect(getAlternateLocalePath('/pt/algarve', 'pt')).toBe('/algarve');
  });

  it('maps the EN home page to the PT home page', () => {
    expect(getAlternateLocalePath('/', 'en')).toBe('/pt');
  });

  it('maps the PT home page to the EN home page', () => {
    expect(getAlternateLocalePath('/pt', 'pt')).toBe('/');
  });
});
