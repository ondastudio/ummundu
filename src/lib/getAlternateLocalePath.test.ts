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
