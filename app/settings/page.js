'use client';

import { useSession, signOut } from "next-auth/react";
import Image from 'next/image';

export default function Settings() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Settings</h1>

      <div className="max-w-md bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h2>
        {status === "loading" ? (
          <p className="text-gray-800 font-semibold text-sm">Loading...</p>
        ) : user ? (
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <Image 
                src={user.image} 
                alt="Profile" 
                width={64} 
                height={64} 
                className="rounded-full border-2 border-gray-200"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 font-semibold text-base truncate">{user.name}</p>
              <p className="text-gray-500 text-sm truncate mb-2">{user.email}</p>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-[#ff4514] text-sm hover:underline"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">Please sign in to view account information.</p>
        )}
      </div>
    </div>
  );
} 