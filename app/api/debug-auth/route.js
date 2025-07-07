export async function GET() {
  const authStatus = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    nextauth: {
      secret: !!process.env.NEXTAUTH_SECRET,
      url: process.env.NEXTAUTH_URL || 'MISSING',
      secretLength: process.env.NEXTAUTH_SECRET ? process.env.NEXTAUTH_SECRET.length : 0
    },
    google: {
      clientId: !!process.env.GOOGLE_CLIENT_ID,
      clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      clientIdPrefix: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...' : 'MISSING'
    },
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sessionTokenName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
    },
    issues: []
  };

  // Check for common issues
  if (!process.env.NEXTAUTH_SECRET) {
    authStatus.issues.push('NEXTAUTH_SECRET is missing');
  } else if (process.env.NEXTAUTH_SECRET.length < 32) {
    authStatus.issues.push('NEXTAUTH_SECRET is too short (should be at least 32 characters)');
  }

  if (!process.env.NEXTAUTH_URL) {
    authStatus.issues.push('NEXTAUTH_URL is missing');
  } else if (process.env.NEXTAUTH_URL.includes('localhost') && process.env.NODE_ENV === 'production') {
    authStatus.issues.push('NEXTAUTH_URL contains localhost in production');
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    authStatus.issues.push('GOOGLE_CLIENT_ID is missing');
  }

  if (!process.env.GOOGLE_CLIENT_SECRET) {
    authStatus.issues.push('GOOGLE_CLIENT_SECRET is missing');
  }

  // Check if all required variables are present
  authStatus.ready = authStatus.issues.length === 0;

  return Response.json(authStatus);
} 