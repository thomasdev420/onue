'use client';

import MonthlyCalendar from './components/MonthlyCalendar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Schedule() {
  const router = useRouter();
  const [slidesToSchedule, setSlidesToSchedule] = useState([]);

  useEffect(() => {
    // Read slides from localStorage
    const slidesData = localStorage.getItem('slidesToSchedule');
    if (slidesData) {
      try {
        const parsedSlides = JSON.parse(slidesData);
        setSlidesToSchedule(parsedSlides);
        // Optionally clear localStorage after reading
        // localStorage.removeItem('slidesToSchedule');
      } catch (error) {
        console.error('Error parsing slides from localStorage:', error);
      }
    }
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Schedule</h1>
      {slidesToSchedule.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Content to Schedule</h2>
          <div className="flex flex-wrap gap-4">
            {slidesToSchedule.map((slide, idx) => (
              <div key={slide.id || idx} className="bg-white rounded-lg shadow p-4 flex flex-col items-center w-48">
                {slide.image && slide.image.image_url && (
                  <Image 
                    src={slide.image.image_url} 
                    alt={slide.image.title || 'Slide image'} 
                    width={192}
                    height={112}
                    className="w-full h-28 object-cover rounded mb-2" 
                  />
                )}
                <div className="text-sm text-gray-700 text-center line-clamp-3">
                  {slide.texts && slide.texts[0] && slide.texts[0].content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <MonthlyCalendar />
    </div>
  );
} 