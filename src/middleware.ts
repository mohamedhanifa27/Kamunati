// [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT]
import { NextResponse } from 'next/server';
import { auth } from '../auth';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role;

  const isApiAdminRoute = nextUrl.pathname.startsWith('/api/admin');
  const isAdminPageRoute = nextUrl.pathname.startsWith('/admin');
  const isApiAccountRoute = nextUrl.pathname.startsWith('/api/account');
  const isSettingsPageRoute = nextUrl.pathname.startsWith('/settings');

  // 1. Protect Admin API Routes (Defense in depth: return structured JSON, never HTML redirect)
  if (isApiAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
  }

  // 2. Protect Admin Page Routes
  if (isAdminPageRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login?callbackUrl=' + encodeURIComponent(nextUrl.pathname), nextUrl));
    }
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', nextUrl));
    }
  }

  // 3. Protect Account & Password API Routes
  if (isApiAccountRoute && !isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  // 4. Protect User Settings Routes
  if (isSettingsPageRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login?callbackUrl=' + encodeURIComponent(nextUrl.pathname), nextUrl));
  }

  const response = NextResponse.next();

  // 5. Enforce baseline security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
});

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/settings/:path*',
    '/api/account/:path*',
  ],
};
