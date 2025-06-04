import { useState, useEffect } from 'react';
import { format, parseISO, setHours, setMinutes } from 'date-fns';
import { CalendarEvent, useEventStore } from '../stores/eventStore';

interface DayViewProps {
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
}

const DayView = ({ currentDate, onEventClick, onTimeSlotClick }: DayViewProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  const { getEventsForDateRange } = useEventStore();
  
  // Create time slots for a day (hours)
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);
  
  useEffect(() => {
    // Get events for this day
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const eventsForDay = getEventsForDateRange(startOfDay, endOfDay);
    setEvents(eventsForDay);
  }, [currentDate, getEventsForDateRange]);
  
  const getEventsForHour = (hour: number) => {
    return events.filter(event => {
      const eventStart = parseISO(event.startDate);
      return eventStart.getHours() === hour;
    });
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-auto">
      <div className="flex">
        {/* Time column */}
        <div className="w-20 border-r flex-shrink-0">
          <div className="h-12 border-b text-center py-3 font-medium">
            {format(currentDate, 'EEEE')}
          </div>
          {timeSlots.map((hour) => (
            <div key={hour} className="h-20 text-sm text-gray-500 text-right pr-2 pt-1 border-b">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
          ))}
        </div>
        
        {/* Day column */}
        <div className="flex-1">
          <div className="h-12 border-b text-center py-3 font-medium">
            {format(currentDate, 'MMMM d, yyyy')}
          </div>
          
          {/* Time slots */}
          {timeSlots.map((hour) => {
            const dateWithHour = setHours(setMinutes(currentDate, 0), hour);
            const hourEvents = getEventsForHour(hour);
            
            return (
              <div 
                key={hour} 
                className="h-20 border-b relative"
                onClick={() => onTimeSlotClick(dateWithHour)}
              >
                {hourEvents.map((event, i) => (
                  <div
                    key={`${event.id}-${i}`}
                    className={`absolute top-0 left-0 right-0 mx-2 mt-1 p-2 rounded-sm text-sm cursor-pointer event-${event.color || 'primary'}`}
                    style={{ zIndex: 10 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                  >
                    <div className="font-medium">{event.title}</div>
                    <div>{format(parseISO(event.startDate), 'h:mm a')} - {format(parseISO(event.endDate), 'h:mm a')}</div>
                    {event.description && (
                      <div className="text-xs mt-1 truncate">{event.description}</div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayView;