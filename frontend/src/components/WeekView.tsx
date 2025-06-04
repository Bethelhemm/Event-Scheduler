import React from 'react';
import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, addHours, setHours, setMinutes } from 'date-fns';
import { CalendarEvent, useEventStore } from '../stores/eventStore';

interface WeekViewProps {
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
}

const WeekView = ({ currentDate, onEventClick, onTimeSlotClick }: WeekViewProps) => {
  const [days, setDays] = useState<Date[]>([]);
  const [events, setEvents] = useState<{ [key: string]: CalendarEvent[] }>({});
  
  const { getEventsForDateRange } = useEventStore();
  
  // Create time slots for a day (hours)
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);
  
  useEffect(() => {
    // Calculate the range of dates to display
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(weekStart);
    
    // Create array of dates for the week
    const dateArray: Date[] = [];
    let day = weekStart;
    
    while (day <= weekEnd) {
      dateArray.push(new Date(day));
      day = addDays(day, 1);
    }
    
    setDays(dateArray);
    
    // Get events for this range
    const eventsInRange = getEventsForDateRange(weekStart, weekEnd);
    
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
    <div className="bg-white rounded-lg shadow overflow-auto">
      <div className="flex">
        {/* Time column */}
        <div className="w-16 border-r">
          <div className="h-12 border-b"></div> {/* Empty header */}
          {timeSlots.map((hour) => (
            <div key={hour} className="h-16 text-xs text-gray-500 text-right pr-2 pt-1 border-b">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
          ))}
        </div>
        
        {/* Day columns */}
        <div className="flex-1 grid grid-cols-7">
          {/* Headers */}
          {days.map((day, index) => {
            const isToday = isSameDay(day, new Date());
            
            return (
              <div key={index} className={`h-12 border-b border-r text-center py-2 ${isToday ? 'bg-primary-50' : ''}`}>
                <div className="text-sm font-medium">{format(day, 'EEE')}</div>
                <div className={`text-sm ${isToday ? 'h-6 w-6 bg-primary-600 text-white rounded-full mx-auto flex items-center justify-center' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
          
          {/* Time slots */}
          {timeSlots.map((hour) => (
            <React.Fragment key={hour}>
              {days.map((day, dayIndex) => {
                const dateWithHour = setHours(setMinutes(day, 0), hour);
                const dayEvents = getEventsForDay(day).filter(event => {
                  const eventHour = parseISO(event.startDate).getHours();
                  return eventHour === hour;
                });
                
                return (
                  <div 
                    key={dayIndex} 
                    className="h-16 border-b border-r relative"
                    onClick={() => onTimeSlotClick(dateWithHour)}
                  >
                    {dayEvents.map((event, i) => (
                      <div
                        key={`${event.id}-${i}`}
                        className={`absolute top-0 left-0 right-0 mx-1 mt-1 p-1 rounded-sm text-xs cursor-pointer event-${event.color || 'primary'}`}
                        style={{ zIndex: 10 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="truncate">{format(parseISO(event.startDate), 'h:mm a')}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekView;