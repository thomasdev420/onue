import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route.js";

export async function GET(request) {
  console.log('🔍 Debug auth endpoint called');
  
  const authStatus = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    issues: [],
    ready: false,
    recommendations: []
  };

  // Check environment variables
  if (!process.env.NEXTAUTH_SECRET) {
    authStatus.issues.push('NEXTAUTH_SECRET is missing');
  } else if (process.env.NEXTAUTH_SECRET.length < 32) {
    authStatus.issues.push('NEXTAUTH_SECRET is too short (should be at least 32 characters)');
  }

  if (!process.env.NEXTAUTH_URL) {
    authStatus.issues.push('NEXTAUTH_URL is missing');
  } else {
    authStatus.nexauthUrl = process.env.NEXTAUTH_URL;
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    authStatus.issues.push('GOOGLE_CLIENT_ID is missing');
  }

  if (!process.env.GOOGLE_CLIENT_SECRET) {
    authStatus.issues.push('GOOGLE_CLIENT_SECRET is missing');
  }

  // Check if all required variables are present
  authStatus.ready = authStatus.issues.length === 0;

  // Add recommendations
  authStatus.recommendations = [];
  
  if (!authStatus.ready) {
    authStatus.recommendations.push('Fix the issues listed above');
  }
  
  if (process.env.NODE_ENV === 'production') {
    authStatus.recommendations.push('Ensure Google OAuth redirect URI includes: https://your-domain.vercel.app/api/auth/callback/google');
  }

  // Add current request information
  authStatus.request = {
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    method: request.method
  };

  console.log('📊 Auth status:', authStatus);

  return Response.json(authStatus, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
} 