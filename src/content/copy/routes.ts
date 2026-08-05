import { getAlternateLocalePath } from '../../lib/getAlternateLocalePath';

/**
 * Single source of truth for every non-destination page's PT/EN paths.
 *
 * Destination pages are deliberately NOT listed here — their slugs are
 * identical across languages (e.g. /algarve <-> /en/algarve), so they're
 * addressed via `{ destinationId }` in `CurrentRoute` instead, and their
 * alternate path is derived with the prefix-mapping logic in
 * `getAlternateLocalePath`, which is correct for that specific case.
 */
export const routes = {
  home: { pt: '/', en: '/en' },
  contact: { pt: '/contacto', en: '/en/contact' },
  contactSuccess: { pt: '/contacto/obrigado', en: '/en/contact/success' },
  privacy: { pt: '/privacidade', en: '/en/privacy' },
  termsOfUse: { pt: '/termos-de-uso', en: '/en/terms-of-use' },
  accessibility: { pt: '/acessibilidade', en: '/en/accessibility' },
  termsOfSale: { pt: '/condicoes-de-venda', en: '/en/terms-of-sale' },
} as const;

export type RouteKey = keyof typeof routes;

/** Identifies which page a component is currently rendering, for the language switcher. */
export type CurrentRoute = RouteKey | { destinationId: string };

/** Returns the given route's path for a specific language. */
export function getRoutePath(route: RouteKey, lang: 'pt' | 'en'): string {
  return routes[route][lang];
}

/** Given the page currently being rendered, returns the equivalent page's path in the other language. */
export function getAlternateRoutePath(currentRoute: CurrentRoute, lang: 'pt' | 'en'): string {
  if (typeof currentRoute === 'object') {
    const currentPath = lang === 'pt' ? `/${currentRoute.destinationId}` : `/en/${currentRoute.destinationId}`;
    return getAlternateLocalePath(currentPath, lang);
  }

  const alternateLang = lang === 'pt' ? 'en' : 'pt';
  return routes[currentRoute][alternateLang];
}
