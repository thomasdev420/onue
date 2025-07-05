'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isDev) {
      // In development, redirect to dashboard immediately (no login needed)
      router.push('/dashboard');
    }
  }, [router, isDev]);

  // In production, show Google login
  if (isDev) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-sm w-full">
        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Sign In
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Please sign in with Google to continue.
        </p>
        <button
          onClick={() => window.location.href = '/api/auth/signin/google'}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
} 