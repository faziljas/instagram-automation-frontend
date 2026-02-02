/**
 * Canonical URL utilities for SEO.
 * Ensures consistent canonical tags: https, no trailing slash (except root).
 */

const DEFAULT_BASE = 'https://logicdm.app';

/**
 * Normalize a base URL to use https.
 */
function ensureHttps(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_BASE;
  if (trimmed.startsWith('http://')) {
    return 'https://' + trimmed.slice(7);
  }
  if (!trimmed.startsWith('https://')) {
    return 'https://' + trimmed;
  }
  return trimmed;
}

/**
 * Normalize path: remove trailing slash except for root.
 * /terms/ -> /terms, / -> /
 */
function normalizePath(pathname: string): string {
  const trimmed = (pathname || '/').trim();
  if (trimmed === '/' || trimmed === '') return '/';
  return trimmed.replace(/\/+$/, '') || '/';
}

/**
 * Build canonical URL for the current page.
 * - Uses https
 * - No trailing slash (except root)
 * - Defaults to base domain when path is /
 */
export function getCanonicalUrl(pathname?: string | null): string {
  const base = ensureHttps(
    process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_BASE
  );
  const baseUrl = base.replace(/\/+$/, '');
  const path = normalizePath(pathname || '/');
  return path === '/' ? baseUrl + '/' : `${baseUrl}${path}`;
}
