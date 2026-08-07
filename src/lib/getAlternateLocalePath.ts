export function getAlternateLocalePath(
  pathname: string,
  currentLang: 'pt' | 'en'
): string {
  if (currentLang === 'en') {
    return pathname === '/' ? '/pt' : `/pt${pathname}`;
  }

  const stripped = pathname.replace(/^\/pt/, '');
  return stripped === '' ? '/' : stripped;
}
