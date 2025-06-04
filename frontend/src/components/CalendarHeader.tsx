import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';

type ViewType = 'month' | 'week' | 'day';

interface CalendarHeaderProps {
  currentDate: Date;
  view: ViewType;
  onDateChange: (date: Date) => void;
  onViewChange: (view: ViewType) => void;
  onAddEvent: () => void;
}

const CalendarHeader = ({
  currentDate,
  view,
  onDateChange,
  onViewChange,
  onAddEvent,
}: CalendarHeaderProps) => {
  
  const handlePrevious = () => {
    switch (view) {
      case 'month':
        onDateChange(subMonths(currentDate, 1));
        break;
      case 'week':
        onDateChange(subWeeks(currentDate, 1));
        break;
      case 'day':
        onDateChange(subDays(currentDate, 1));
        break;
    }
  };
  
  const handleNext = () => {
    switch (view) {
      case 'month':
        onDateChange(addMonths(currentDate, 1));
        break;
      case 'week':
        onDateChange(addWeeks(currentDate, 1));
        break;
      case 'day':
        onDateChange(addDays(currentDate, 1));
        break;
    }
  };
  
  const handleToday = () => {
    onDateChange(new Date());
  };
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
      <div className="flex items-center">
        <button
          onClick={handlePrevious}
          className="btn btn-outline btn-sm mr-1"
          aria-label="Previous"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={handleNext}
          className="btn btn-outline btn-sm mr-4"
          aria-label="Next"
        >
          <ChevronRight size={16} />
        </button>
        
        <h2 className="text-xl font-semibold">
          {view === 'month' && format(currentDate, 'MMMM yyyy')}
          {view === 'week' && `Week of ${format(currentDate, 'MMMM d, yyyy')}`}
          {view === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h2>
      </div>
      
      <div className="flex items-center space-x-2">
        <button onClick={handleToday} className="btn btn-outline btn-sm">
          Today
        </button>
        
        <div className="bg-white border border-gray-300 rounded-md overflow-hidden flex">
          <button
            onClick={() => onViewChange('month')}
            className={`px-3 py-1 text-sm ${view === 'month' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            Month
          </button>
          <button
            onClick={() => onViewChange('week')}
            className={`px-3 py-1 text-sm ${view === 'week' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            Week
          </button>
          <button
            onClick={() => onViewChange('day')}
            className={`px-3 py-1 text-sm ${view === 'day' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            Day
          </button>
        </div>
        
        <button onClick={onAddEvent} className="btn btn-primary btn-sm">
          Add Event
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;