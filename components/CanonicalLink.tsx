'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { getCanonicalUrl } from '@/lib/canonical';

/**
 * Injects canonical link into document head for SEO.
 * Uses current pathname so each page gets the correct canonical URL.
 */
export function CanonicalLink() {
  const pathname = usePathname();
  const canonical = getCanonicalUrl(pathname ?? '/');

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;
  }, [canonical]);

  return null;
}
