import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ 
  size = 32, 
  text = "Loading...", 
  className = "",
  showText = true 
}) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className="animate-spin text-gray-500" size={size} />
      {showText && text && (
        <span className="mt-2 text-gray-600 text-sm">{text}</span>
      )}
    </div>
  );
} 