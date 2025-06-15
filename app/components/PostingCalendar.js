'use client';

import { useState } from 'react';

// Optimal posting times for each platform
const platformTimes = {
  TikTok: {
    Monday: [
      { start: 7, end: 9 },
      { start: 11, end: 13 },
      { start: 18, end: 20 }
    ],
    Tuesday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 },
      { start: 19, end: 21 }
    ],
    Wednesday: [
      { start: 8, end: 10 },
      { start: 12, end: 14 },
      { start: 19, end: 21 }
    ],
    Thursday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 },
      { start: 19, end: 21 }
    ],
    Friday: [
      { start: 7, end: 9 },
      { start: 12, end: 14 },
      { start: 17, end: 19 }
    ],
    Saturday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 },
      { start: 18, end: 20 }
    ],
    Sunday: [
      { start: 9, end: 11 },
      { start: 15, end: 17 },
      { start: 19, end: 21 }
    ]
  },
  Instagram: {
    Monday: [
      { start: 8, end: 10 },
      { start: 12, end: 14 },
      { start: 17, end: 19 }
    ],
    Tuesday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 },
      { start: 18, end: 20 }
    ],
    Wednesday: [
      { start: 8, end: 10 },
      { start: 12, end: 14 },
      { start: 17, end: 19 }
    ],
    Thursday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 },
      { start: 18, end: 20 }
    ],
    Friday: [
      { start: 8, end: 10 },
      { start: 12, end: 14 },
      { start: 17, end: 19 }
    ],
    Saturday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 },
      { start: 17, end: 19 }
    ],
    Sunday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 },
      { start: 17, end: 19 }
    ]
  },
  Facebook: {
    Monday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 },
      { start: 18, end: 20 }
    ],
    Tuesday: [
      { start: 8, end: 10 },
      { start: 12, end: 14 },
      { start: 17, end: 19 }
    ],
    Wednesday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 },
      { start: 18, end: 20 }
    ],
    Thursday: [
      { start: 8, end: 10 },
      { start: 12, end: 14 },
      { start: 17, end: 19 }
    ],
    Friday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 },
      { start: 18, end: 20 }
    ],
    Saturday: [
      { start: 8, end: 10 },
      { start: 12, end: 14 },
      { start: 17, end: 19 }
    ],
    Sunday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 },
      { start: 17, end: 19 }
    ]
  },
  LinkedIn: {
    Monday: [
      { start: 8, end: 10 },
      { start: 12, end: 14 },
      { start: 16, end: 18 }
    ],
    Tuesday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 },
      { start: 17, end: 19 }
    ],
    Wednesday: [
      { start: 8, end: 10 },
      { start: 12, end: 14 },
      { start: 16, end: 18 }
    ],
    Thursday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 },
      { start: 17, end: 19 }
    ],
    Friday: [
      { start: 8, end: 10 },
      { start: 12, end: 14 },
      { start: 16, end: 18 }
    ],
    Saturday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 }
    ],
    Sunday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 }
    ]
  },
  X: {
    Monday: [
      { start: 7, end: 9 },
      { start: 11, end: 13 },
      { start: 17, end: 19 }
    ],
    Tuesday: [
      { start: 8, end: 10 },
      { start: 12, end: 14 },
      { start: 18, end: 20 }
    ],
    Wednesday: [
      { start: 7, end: 9 },
      { start: 11, end: 13 },
      { start: 17, end: 19 }
    ],
    Thursday: [
      { start: 8, end: 10 },
      { start: 12, end: 14 },
      { start: 18, end: 20 }
    ],
    Friday: [
      { start: 7, end: 9 },
      { start: 11, end: 13 },
      { start: 17, end: 19 }
    ],
    Saturday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 },
      { start: 17, end: 19 }
    ],
    Sunday: [
      { start: 9, end: 11 },
      { start: 13, end: 15 },
      { start: 17, end: 19 }
    ]
  }
};

const platformColors = {
  TikTok: {
    bg: 'bg-green-100',
    border: 'border-green-300',
    hover: 'hover:bg-green-200'
  },
  Instagram: {
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    hover: 'hover:bg-purple-200'
  },
  Facebook: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    hover: 'hover:bg-blue-200'
  },
  LinkedIn: {
    bg: 'bg-red-100',
    border: 'border-red-300',
    hover: 'hover:bg-red-200'
  },
  X: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    hover: 'hover:bg-yellow-200'
  }
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hours = Array.from({ length: 24 }, (_, i) => i);

export default function PostingCalendar({ selectedDate }) {
  const [selectedSlot, setSelectedSlot] = useState(null);

  const getPlatformForTime = (day, hour) => {
    for (const [platform, times] of Object.entries(platformTimes)) {
      if (times[day]?.some(time => hour >= time.start && hour < time.end)) {
        return platform;
      }
    }
    return null;
  };

  const formatHour = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  const handleSlotClick = (hour) => {
    setSelectedSlot(hour);
    // TODO: Implement scheduling logic
  };

  // Get the day of the week from the selected date
  const selectedDay = selectedDate ? days[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1] : null;

  if (!selectedDay) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
        Select a day to view optimal posting times
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Selected Day Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">{selectedDay}</h2>
      </div>

      {/* Time Slots */}
      <div className="space-y-2">
        {hours.map(hour => {
          const platform = getPlatformForTime(selectedDay, hour);
          const colors = platform ? platformColors[platform] : {
            bg: 'bg-gray-50',
            border: 'border-gray-200',
            hover: 'hover:bg-gray-100'
          };

          return (
            <button
              key={hour}
              onClick={() => handleSlotClick(hour)}
              className={`
                w-full p-3 rounded-lg transition-colors
                ${colors.bg} ${colors.border} ${colors.hover}
                ${selectedSlot === hour ? 'ring-2 ring-blue-500' : ''}
                flex items-center justify-between
              `}
            >
              <span className="text-sm font-medium text-gray-700">
                {formatHour(hour)}
              </span>
              {platform && (
                <span className="text-sm text-gray-600">
                  {platform}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
          {Object.entries(platformColors).map(([platform, colors]) => (
            <div key={platform} className="flex items-center gap-2">
              <div className={`w-4 h-4 ${colors.bg} ${colors.border} rounded`} />
              <span>{platform}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 italic">
          *Broad optimal times to post, this will change based on performance of your content
        </p>
      </div>
    </div>
  );
} 