import React from "react";

export default function CaptionInput({ captionText, setCaptionText }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Add Caption</h2>
      <input
        type="text"
        value={captionText}
        onChange={(e) => setCaptionText(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff4514]/20 focus:border-[#ff4514] transition"
        placeholder="Enter your caption..."
      />
    </div>
  );
} 