import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SENSITIVE_PARAMS = ['email', 'password'];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Strip email/password from login and register URLs (security: avoid logging credentials)
  if (pathname === '/login' || pathname === '/register') {
    const hasSensitive = SENSITIVE_PARAMS.some((p) => searchParams.has(p));
    if (hasSensitive) {
      const url = request.nextUrl.clone();
      SENSITIVE_PARAMS.forEach((p) => url.searchParams.delete(p));
      return NextResponse.redirect(url, 302);
    }
  }

  return NextResponse.next();
}
