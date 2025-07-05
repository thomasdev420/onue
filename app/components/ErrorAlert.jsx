import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorAlert({ 
  error, 
  onDismiss, 
  className = "",
  showIcon = true 
}) {
  if (!error) return null;

  return (
    <div className={`bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded ${className}`}>
      <div className="flex items-center gap-2">
        {showIcon && <AlertCircle size={16} />}
        <span className="text-sm font-medium flex-1">{error}</span>
        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="text-red-500 hover:text-red-700 transition-colors"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
} 