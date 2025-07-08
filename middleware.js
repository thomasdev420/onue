import { NextResponse } from 'next/server';

export async function middleware(request) {
  // For static export, bypass all middleware to let client-side handle auth
  // This is more reliable for private browsers and different cookie policies
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/user/:path*',
  ],
}; 