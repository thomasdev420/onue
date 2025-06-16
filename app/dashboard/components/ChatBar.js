import { ChevronUp } from 'lucide-react';
import Link from 'next/link';

export default function ChatBar({ actions = [] }) {
  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      {/* Chat Input Area (no outer box) */}
      <div className="flex items-stretch gap-4">
        {/* Input and right controls (no left icons) */}
        <div className="flex-1 flex flex-col gap-3 mx-auto">
          <div className="flex items-center bg-white rounded-2xl border border-gray-200 px-6 py-4 shadow-sm">
            <textarea
              className="flex-1 min-h-[48px] max-h-32 resize-none bg-transparent outline-none text-lg text-gray-800 placeholder-gray-400 border-none shadow-none"
              placeholder="What are we building today?"
            />
            <div className="flex items-center gap-2 ml-4">
              <button className="ml-2 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"><ChevronUp size={22} /></button>
            </div>
          </div>
          {/* Action Buttons Row - horizontal, scrollable if needed */}
          <div className="flex gap-3 justify-center mt-2 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {actions.map((action, idx) => (
              action.href ? (
                <Link
                  key={idx}
                  href={action.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 text-sm font-medium"
                >
                  {action.icon}
                  {action.label}
                </Link>
              ) : (
                <button
                  key={idx}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 text-sm font-medium"
                >
                  {action.icon}
                  {action.label}
                </button>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 