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

  const handleSlotClick = (day, hour) => {
    setSelectedSlot({ day, hour });
    // TODO: Implement scheduling logic
  };

  // Get the day of the week from the selected date
  const selectedDay = selectedDate ? days[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1] : null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="text-sm font-medium text-gray-500">Time</div>
            {days.map(day => (
              <div 
                key={day} 
                className="text-sm font-medium text-gray-500 text-center py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 gap-2 mb-1">
              <div className="text-sm text-gray-500 py-2">
                {formatHour(hour)}
              </div>
              {days.map(day => {
                const platform = getPlatformForTime(day, hour);
                const colors = platform ? platformColors[platform] : {
                  bg: 'bg-gray-50',
                  border: 'border-gray-200',
                  hover: 'hover:bg-gray-100'
                };

                return (
                  <button
                    key={`${day}-${hour}`}
                    onClick={() => handleSlotClick(day, hour)}
                    className={`
                      py-2 rounded transition-colors
                      ${colors.bg} ${colors.border} ${colors.hover}
                      ${selectedSlot?.day === day && selectedSlot?.hour === hour 
                        ? 'ring-2 ring-blue-500' 
                        : ''
                      }
                    `}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-col gap-4">
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