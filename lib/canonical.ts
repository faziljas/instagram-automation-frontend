/**
 * Canonical URL utilities for SEO.
 * Ensures consistent canonical tags: https, non-www, no trailing slash (except root).
 * Single source of truth for logicdm.app URL structure to avoid GSC "Page with redirect" errors.
 */

const DEFAULT_BASE = 'https://logicdm.app';

/**
 * Normalize a base URL: https, non-www, no trailing slash.
 * Used for canonical tags, sitemap, auth redirects - ensures Googlebot sees one URL per page.
 */
export function getCanonicalBase(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_BASE).trim();
  let url = raw;
  if (url.startsWith('http://')) url = 'https://' + url.slice(7);
  else if (!url.startsWith('https://')) url = 'https://' + url;
  // Prefer non-www (strip www. for consistency with sitemap/canonical)
  if (url.includes('://www.')) {
    url = url.replace('://www.', '://');
  }
  return url.replace(/\/+$/, '') || DEFAULT_BASE;
}

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
  const baseUrl = getCanonicalBase();
  const path = normalizePath(pathname || '/');
  return path === '/' ? baseUrl + '/' : `${baseUrl}${path}`;
}
