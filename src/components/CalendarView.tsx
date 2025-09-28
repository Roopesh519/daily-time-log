'use client';

import { useState } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarViewProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (date: string) => void;
  selectedDate: string;
}

export default function CalendarView({ isOpen, onClose, onDateSelect, selectedDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  if (!isOpen) return null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the first day of the week for the month
  const firstDayOfWeek = monthStart.getDay();
  const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (firstDayOfWeek - i));
    return date;
  });

  const allDays = [...daysBeforeMonth, ...daysInMonth];

  const handleDateClick = (date: Date) => {
    onDateSelect(format(date, 'yyyy-MM-dd'));
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Select Date</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                >
                  Today
                </button>
              </div>
              
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {allDays.map((day, index) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = isSameDay(day, parseISO(selectedDate));
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(day)}
                    className={`
                      h-10 w-10 text-sm rounded-md transition-colors
                      ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                      ${isSelected 
                        ? 'bg-blue-600 text-white' 
                        : isToday 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'hover:bg-gray-100'
                      }
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

