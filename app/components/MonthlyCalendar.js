'use client';

import { useState } from 'react';
import PostingCalendar from './PostingCalendar';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MonthlyCalendar() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showTimeCalendar, setShowTimeCalendar] = useState(false);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    setShowTimeCalendar(true);
  };

  const handleBackToMonth = () => {
    setShowTimeCalendar(false);
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear();
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  if (showTimeCalendar && selectedDate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBackToMonth}
            className="flex items-center gap-2 text-gray-800 hover:text-gray-600 transition"
          >
            <ArrowLeft size={20} />
            <span>Back to Calendar</span>
          </button>
          <h2 className="text-xl font-semibold">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </h2>
        </div>
        <PostingCalendar selectedDate={selectedDate} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="flex items-center gap-2 text-gray-800 hover:text-gray-600 transition"
        >
          <ChevronLeft size={20} />
          <span>Previous Month</span>
        </button>
        <h2 className="text-xl font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button
          onClick={handleNextMonth}
          className="flex items-center gap-2 text-gray-800 hover:text-gray-600 transition"
        >
          <span>Next Month</span>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`
                  aspect-square p-2 text-center rounded-lg transition-colors
                  ${isToday(day) ? 'bg-blue-50 text-blue-600' : ''}
                  ${isSelected(day) 
                    ? 'bg-[#ff4514]/10 text-[#ff4514] border-2 border-[#ff4514] font-medium' 
                    : 'hover:bg-gray-100'
                  }
                  ${!isToday(day) && !isSelected(day) ? 'text-gray-700' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
} 