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
        {/* Content for other settings */}
      </div>
    </div>
  );
} 