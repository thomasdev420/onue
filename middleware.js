import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  // Bypass all auth in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // (Production logic below)
  const token = await getToken({ req: request });
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/api/user/');

  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/user/:path*',
  ],
}; 