"use client";

import { useSession } from "next-auth/react";

export default function Avatars() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-center">
          <h1 className="text-2xl font-bold text-gray-800">UGC Avatar Generator</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Create New Avatar</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Reference Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Style Preferences</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg">
                    <option>Professional</option>
                    <option>Casual</option>
                    <option>Creative</option>
                  </select>
                </div>
                <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition">
                  Generate Avatar
                </button>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Avatars</h2>
              <div className="grid grid-cols-2 gap-4">
                {/* Placeholder for avatar grid */}
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">No avatars yet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 