import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SENSITIVE_PARAMS = ['email', 'password'];

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname, searchParams } = url;

  // 1. HTTP → HTTPS (301 permanent - good for SEO)
  if (request.headers.get('x-forwarded-proto') === 'http') {
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  // 2. www → non-www (301 permanent - unified canonical for GSC)
  const host = request.headers.get('host') || '';
  if (host.toLowerCase().startsWith('www.')) {
    const newHost = host.replace(/^www\./i, '');
    const redirectUrl = new URL(`${url.pathname}${url.search}`, `https://${newHost}`);
    return NextResponse.redirect(redirectUrl, 301);
  }

  // 3. Trailing slash (except root): /terms/ → /terms (301 permanent)
  if (pathname !== '/' && pathname.endsWith('/')) {
    url.pathname = pathname.replace(/\/+$/, '') || '/';
    return NextResponse.redirect(url, 301);
  }

  // 4. Strip email/password from login and register URLs (security: avoid logging credentials)
  if (pathname === '/login' || pathname === '/register') {
    const hasSensitive = SENSITIVE_PARAMS.some((p) => searchParams.has(p));
    if (hasSensitive) {
      SENSITIVE_PARAMS.forEach((p) => url.searchParams.delete(p));
      return NextResponse.redirect(url, 302);
    }
  }

  return NextResponse.next();
}
