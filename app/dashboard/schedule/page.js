'use client';

import { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar as CalendarIcon } from 'lucide-react';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function Schedule() {
  const [events, setEvents] = useState([
    {
      title: 'Product Launch Video',
      start: new Date(2024, 5, 2, 10, 0), // Example event on the 2nd of June 2024
      end: new Date(2024, 5, 2, 11, 0),
      type: 'video',
    },
  ]);

  const eventStyleGetter = (event) => {
    let backgroundColor = '#ff4514';
    if (event.type === 'video') {
      backgroundColor = '#4285F4';
    } else if (event.type === 'meme') {
      backgroundColor = '#34A853';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  // Custom day rendering to highlight specific dates like in the image
  const dayPropGetter = (date) => {
    const day = date.getDate();
    const month = date.getMonth(); // 0-indexed
    const year = date.getFullYear();

    // Check if it's June 2nd, 2025 (as in the image)
    // Note: For a dynamic calendar, you'd need to adjust this logic
    if (day === 2 && month === 5 && year === 2025) {
       return {
        className: 'highlight-day',
       };
    }
    return {};
  };


  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        {/* Header Title */}
        <h1 className="text-2xl font-bold text-gray-800">Content Calendar</h1>
        {/* Navigation and Date (handled by react-big-calendar) */}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Removed the event legend and Add Event button */}

        <div className="h-[700px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            eventPropGetter={eventStyleGetter}
            dayPropGetter={dayPropGetter}
            views={['month']}
            defaultView="month"
            selectable
            onSelectEvent={(event) => console.log(event)}
            onSelectSlot={(slotInfo) => console.log(slotInfo)}
          />
        </div>
      </div>

      <style jsx>{`
        .rbc-calendar {
          font-family: inherit; /* Use the site's font */
        }
        
        .rbc-header {
          color: #525252; /* Match day name color */
          font-weight: normal; /* Not bold */
        }
        
        .rbc-month-view {
           border: none; /* Remove outer border */
        }

        .rbc-header, .rbc-day-bg {
            border-right: 1px solid #e5e7eb; /* Subtle right border */
             border-bottom: 1px solid #e5e7eb; /* Subtle bottom border */
        }

         .rbc-header:last-child, .rbc-day-bg:last-child {
             border-right: none; /* Remove right border on last day */
         }

         .rbc-row-segment .rbc-event-content {
            /* Adjust event content if needed */
         }

         .rbc-row {
             border-bottom: none; /* Remove row borders, handled by day-bg */
         }
         
         .rbc-date-cell {
            text-align: left; /* Align date numbers to the left */
            padding: 5px; /* Add some padding */
            color: #525252; /* Match date number color */
            font-size: 0.9em; /* Adjust font size */
         }
         
         .rbc-toolbar button {
             /* Style navigation buttons */
             background-color: #f3f4f6; /* Light gray background */
             border: 1px solid #d1d5db; /* Subtle border */
             border-radius: 4px; /* Rounded corners */
             padding: 4px 8px; /* Adjust padding */
             color: #374151; /* Darker text */
             margin: 0 2px; /* Space between buttons */
         }

         .rbc-toolbar button:hover {
              background-color: #e5e7eb; /* Darker on hover */
         }

         .rbc-toolbar button:active {
             background-color: #d1d5db; /* Even darker when active */
         }

          .rbc-toolbar span.rbc-toolbar-label {
              /* Style month/year label */
              font-size: 1.1em; /* Slightly larger font */
              font-weight: 600; /* Semi-bold */
              color: #374151; /* Darker text */
              margin: 0 10px; /* Space around label */
          }

          /* Style for the highlighted day (June 2nd) */
          .rbc-day-bg.highlight-day {
               /* Specific styling for the background if needed */
          }

          .rbc-date-cell .highlight-day-circle {
              /* Style for the blue circle */
              display: inline-flex; /* Use flexbox to center the number */
              justify-content: center;
              align-items: center;
              width: 24px; /* Circle size */
              height: 24px; /* Circle size */
              background-color: #4285F4; /* Blue color */
              color: white; /* White text */
              border-radius: 50%; /* Make it round */
              font-size: 1em; /* Adjust font size */
              font-weight: bold; /* Bold number */
              margin-right: 4px; /* Space between circle and other content if any */
          }

          /* To put the number inside the circle on the 2nd day */
          .rbc-date-cell.highlight-day > a {
               display: none; /* Hide the default date number */
          }

          .rbc-date-cell.highlight-day::before {
              content: '2'; /* Add the number 2 */
              display: inline-flex;
              justify-content: center;
              align-items: center;
              width: 24px;
              height: 24px;
              background-color: #4285F4;
              color: white;
              border-radius: 50%;
              font-size: 1em;
              font-weight: bold;
              margin-right: 4px;
              position: absolute; /* Position absolutely within the cell */
              top: 5px; /* Adjust position from top */
              left: 5px; /* Adjust position from left */
          }
      `}</style>
    </div>
  );
} 