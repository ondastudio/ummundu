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
    expect(getRoutePath('contact', 'pt')).toBe('/pt/contacto');
  });

  it('returns the en path for a route', () => {
    expect(getRoutePath('contact', 'en')).toBe('/contact');
  });
});

describe('getAlternateRoutePath', () => {
  it('maps a non-prefix-equivalent en route to its pt equivalent', () => {
    expect(getAlternateRoutePath('contact', 'en')).toBe('/pt/contacto');
  });

  it('maps a non-prefix-equivalent pt route back to its en equivalent', () => {
    expect(getAlternateRoutePath('contact', 'pt')).toBe('/contact');
  });

  it('maps contactSuccess correctly in both directions', () => {
    expect(getAlternateRoutePath('contactSuccess', 'en')).toBe('/pt/contacto/obrigado');
    expect(getAlternateRoutePath('contactSuccess', 'pt')).toBe('/contact/success');
  });

  it('maps privacy, termsOfUse, accessibility, termsOfSale correctly', () => {
    expect(getAlternateRoutePath('privacy', 'en')).toBe('/pt/privacidade');
    expect(getAlternateRoutePath('termsOfUse', 'en')).toBe('/pt/termos-de-uso');
    expect(getAlternateRoutePath('accessibility', 'en')).toBe('/pt/acessibilidade');
    expect(getAlternateRoutePath('termsOfSale', 'en')).toBe('/pt/condicoes-de-venda');
  });

  it('maps the home route', () => {
    expect(getAlternateRoutePath('home', 'en')).toBe('/pt');
    expect(getAlternateRoutePath('home', 'pt')).toBe('/');
  });

  it('maps a destination route via slug (identical across languages)', () => {
    expect(getAlternateRoutePath({ destinationId: 'algarve' }, 'en')).toBe('/pt/algarve');
    expect(getAlternateRoutePath({ destinationId: 'algarve' }, 'pt')).toBe('/algarve');
  });
});
