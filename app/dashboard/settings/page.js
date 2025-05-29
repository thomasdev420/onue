'use client';

import { useSession, signOut } from "next-auth/react";
import Image from 'next/image';
import Link from 'next/link';

export default function Settings() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Settings</h1>

      <div className="max-w-md bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h2>
        {/* Display Google Account Details */}
        {status === "loading" ? (
          <p className="text-gray-800 font-semibold text-sm">Loading...</p>
        ) : user ? (
          <div className="flex items-center gap-4">
            <img
              src={user.image}
              alt="Google Profile"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="text-gray-800 font-semibold text-sm">{user.name}</p>
              <p className="text-gray-500 text-xs">{user.email}</p>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-blue-500 text-xs hover:underline mt-1"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-800 font-semibold text-sm">Not signed in</p>
            <Link href="/api/auth/signin">
              <span className="text-blue-500 text-xs hover:underline">Sign in with Google</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 