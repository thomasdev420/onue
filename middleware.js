import { NextResponse } from 'next/server';

export async function middleware(request) {
  // For static export, bypass all middleware
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/user/:path*',
  ],
}; 