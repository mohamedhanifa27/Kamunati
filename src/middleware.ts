import { NextResponse } from 'next/server';
import { auth } from '../auth';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role;

  const isAdminRoute = nextUrl.pathname.startsWith('/admin');
  const isUserRoute = nextUrl.pathname.startsWith('/settings');

  // Protect Admin Routes
  if (isAdminRoute && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  // Protect User Settings Routes
  if (isUserRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/api/auth/signin', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/settings/:path*'],
};
