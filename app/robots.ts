import { MetadataRoute } from 'next';
import { getCanonicalBase } from '@/lib/canonical';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getCanonicalBase();

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/pricing',
          '/login',
          '/register',
          '/privacy',
          '/terms',
          '/refund-policy',
          '/contact',
        ],
        disallow: [
          '/dashboard/*',
          '/api/*',
          '/auth/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
