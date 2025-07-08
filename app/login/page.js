'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession, getSession } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState(null);
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isDev) {
      // In development, redirect to dashboard immediately (no login needed)
      router.push('/dashboard');
    }
  }, [router, isDev]);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (session && !isDev) {
      console.log('✅ User already authenticated, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [session, router, isDev]);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setError(null);
      
      console.log('🚀 Starting Google sign-in...');
      
      const result = await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: false // Don't redirect automatically, we'll handle it
      });
      
      console.log('📋 Sign-in result:', result);
      
      if (result?.error) {
        console.error('❌ Sign-in error:', result.error);
        setError(`Sign-in failed: ${result.error}`);
      } else if (result?.ok) {
        console.log('✅ Sign-in successful, redirecting...');
        router.push('/dashboard');
      } else {
        console.log('⏳ Sign-in in progress...');
        // The sign-in process will handle the redirect
      }
    } catch (error) {
      console.error('💥 Sign-in exception:', error);
      setError(`Sign-in failed: ${error.message}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDebugSession = async () => {
    try {
      console.log('🔍 Debugging session...');
      const session = await getSession();
      console.log('📋 Current session:', session);
      console.log('📊 Session status:', status);
      console.log('👤 Session data:', session);
    } catch (error) {
      console.error('❌ Debug error:', error);
    }
  };

  // In development, show loading while redirecting
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

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
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
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className={`w-full font-semibold py-2 px-4 rounded-lg transition-colors ${
            isSigningIn 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isSigningIn ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing in...
            </div>
          ) : (
            'Sign in with Google'
          )}
        </button>
        
        {/* Debug button for troubleshooting */}
        <button
          onClick={handleDebugSession}
          className="w-full mt-4 text-xs text-gray-500 hover:text-gray-700"
        >
          Debug Session
        </button>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Status: {status}</p>
          <p>Session: {session ? 'Present' : 'None'}</p>
        </div>
      </div>
    </div>
  );
} 