import { getAlternateLocalePath } from '../../lib/getAlternateLocalePath';

/**
 * Single source of truth for every non-destination page's PT/EN paths.
 *
 * Destination pages are deliberately NOT listed here — their slugs are
 * identical across languages (e.g. /algarve <-> /pt/algarve), so they're
 * addressed via `{ destinationId }` in `CurrentRoute` instead, and their
 * alternate path is derived with the prefix-mapping logic in
 * `getAlternateLocalePath`, which is correct for that specific case.
 */
export const routes = {
  home: { pt: '/pt', en: '/' },
  contact: { pt: '/pt/contacto', en: '/contact' },
  contactSuccess: { pt: '/pt/contacto/obrigado', en: '/contact/success' },
  privacy: { pt: '/pt/privacidade', en: '/privacy' },
  termsOfUse: { pt: '/pt/termos-de-uso', en: '/terms-of-use' },
  accessibility: { pt: '/pt/acessibilidade', en: '/accessibility' },
  termsOfSale: { pt: '/pt/condicoes-de-venda', en: '/terms-of-sale' },
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
    const currentPath = lang === 'en' ? `/${currentRoute.destinationId}` : `/pt/${currentRoute.destinationId}`;
    return getAlternateLocalePath(currentPath, lang);
  }

  const alternateLang = lang === 'pt' ? 'en' : 'pt';
  return routes[currentRoute][alternateLang];
}
