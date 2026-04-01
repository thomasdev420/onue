import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Production/staging: require NextAuth session for /dashboard (except /dashboard/selection)
 * and JSON 401 for /api/user/*.
 * Development: skip (local devAccessGranted + layout behavior unchanged).
 * If NEXTAUTH_SECRET is missing, skip (layout still handles UX; fix env for real protection).
 */
export async function middleware(request) {
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret,
    secureCookie: process.env.NODE_ENV === 'production',
  });

  if (pathname.startsWith('/dashboard/selection')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/user')) {
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', detail: 'Sign in required' },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const login = new URL('/login', request.url);
      login.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/user/:path*'],
};
