import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { CalendarEvent, useEventStore } from '../stores/eventStore';
import { formatTime } from '../utils/dateUtils';

interface MonthViewProps {
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
}

const MonthView = ({ currentDate, onEventClick, onDateClick }: MonthViewProps) => {
  const [days, setDays] = useState<Date[]>([]);
  const [events, setEvents] = useState<{ [key: string]: CalendarEvent[] }>({});
  
  const { getEventsForDateRange } = useEventStore();
  
  useEffect(() => {
    // Calculate the range of dates to display
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    // Create array of dates for the view
    const dateArray: Date[] = [];
    let day = startDate;
    
    while (day <= endDate) {
      dateArray.push(new Date(day));
      day = addDays(day, 1);
    }
    
    setDays(dateArray);
    
    // Get events for this range
    const eventsInRange = getEventsForDateRange(startDate, endDate);
    
    // Group events by date
    const eventsByDate: { [key: string]: CalendarEvent[] } = {};
    
    eventsInRange.forEach(event => {
      const startDateStr = format(parseISO(event.startDate), 'yyyy-MM-dd');
      
      if (!eventsByDate[startDateStr]) {
        eventsByDate[startDateStr] = [];
      }
      
      eventsByDate[startDateStr].push(event);
    });
    
    setEvents(eventsByDate);
  }, [currentDate, getEventsForDateRange]);
  
  const getEventsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return events[dateStr] || [];
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="calendar-grid calendar-day-header bg-gray-50 border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={index} className="py-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      <div className="calendar-grid">
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <div
              key={i}
              className={`calendar-day min-h-[100px] p-1 ${
                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
              } ${isToday ? 'bg-primary-50' : ''}`}
              onClick={() => onDateClick(day)}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-medium ${
                  isToday ? 'h-6 w-6 bg-primary-600 text-white rounded-full flex items-center justify-center' : ''
                }`}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="overflow-y-auto max-h-[80px]">
                {dayEvents.slice(0, 3).map((event, index) => (
                  <div
                    key={`${event.id}-${index}`}
                    className={`calendar-event event-${event.color || 'primary'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    title={event.title}
                  >
                    {!event.isAllDay && (
                      <span className="text-xs font-medium">
                        {formatTime(event.startDate)}
                      </span>
                    )}
                    <span className="ml-1">{event.title}</span>
                  </div>
                ))}
                
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 pl-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;