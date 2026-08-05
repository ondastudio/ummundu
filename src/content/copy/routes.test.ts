import { describe, it, expect } from 'vitest';
import { routes, getRoutePath, getAlternateRoutePath } from './routes';

describe('routes registry', () => {
  it('has a pt and en path for every registered route', () => {
    for (const key of Object.keys(routes) as (keyof typeof routes)[]) {
      expect(routes[key].pt.startsWith('/')).toBe(true);
      expect(routes[key].en.startsWith('/')).toBe(true);
    }
  });
});

describe('getRoutePath', () => {
  it('returns the pt path for a route', () => {
    expect(getRoutePath('contact', 'pt')).toBe('/contacto');
  });

  it('returns the en path for a route', () => {
    expect(getRoutePath('contact', 'en')).toBe('/en/contact');
  });
});

describe('getAlternateRoutePath', () => {
  it('maps a non-prefix-equivalent pt route to its en equivalent', () => {
    expect(getAlternateRoutePath('contact', 'pt')).toBe('/en/contact');
  });

  it('maps a non-prefix-equivalent en route back to its pt equivalent', () => {
    expect(getAlternateRoutePath('contact', 'en')).toBe('/contacto');
  });

  it('maps contactSuccess correctly in both directions', () => {
    expect(getAlternateRoutePath('contactSuccess', 'pt')).toBe('/en/contact/success');
    expect(getAlternateRoutePath('contactSuccess', 'en')).toBe('/contacto/obrigado');
  });

  it('maps privacy, termsOfUse, accessibility, termsOfSale correctly', () => {
    expect(getAlternateRoutePath('privacy', 'pt')).toBe('/en/privacy');
    expect(getAlternateRoutePath('termsOfUse', 'pt')).toBe('/en/terms-of-use');
    expect(getAlternateRoutePath('accessibility', 'pt')).toBe('/en/accessibility');
    expect(getAlternateRoutePath('termsOfSale', 'pt')).toBe('/en/terms-of-sale');
  });

  it('maps the home route', () => {
    expect(getAlternateRoutePath('home', 'pt')).toBe('/en');
    expect(getAlternateRoutePath('home', 'en')).toBe('/');
  });

  it('maps a destination route via slug (identical across languages)', () => {
    expect(getAlternateRoutePath({ destinationId: 'algarve' }, 'pt')).toBe('/en/algarve');
    expect(getAlternateRoutePath({ destinationId: 'algarve' }, 'en')).toBe('/algarve');
  });
});
