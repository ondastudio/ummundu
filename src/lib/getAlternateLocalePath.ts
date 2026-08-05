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
