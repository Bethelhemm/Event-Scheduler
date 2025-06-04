import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, format, isAfter, isBefore, parseISO } from 'date-fns';
import * as eventService from '../services/events';

console.log('EventStore loaded');

export type RecurrenceType = 
  | 'none' 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'yearly' 
  | 'custom';

export type WeekdayType = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

export type MonthlyPositionType = 
  | 'first' 
  | 'second' 
  | 'third' 
  | 'fourth' 
  | 'last';

export interface RecurrenceRule {
  type: RecurrenceType;
  interval?: number;
  weekdays?: WeekdayType[];
  monthlyType?: 'byDay' | 'byDate';
  monthlyPosition?: MonthlyPositionType;
  monthlyDay?: WeekdayType;
  endDate?: string | null;
  count?: number | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  recurrence: RecurrenceRule;
  color?: 'primary' | 'secondary' | 'accent';
  calendar?: {
    id: string;
    name: string;
    color: string;
  };
  deletedInstances?: string[];
  modifiedInstances?: { [date: string]: Partial<CalendarEvent> };
}

interface EventState {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  deleteEventInstance: (id: string, date: string) => Promise<void>;
  updateEventInstance: (id: string, date: string, modifications: Partial<CalendarEvent>) => Promise<void>;
  getEventsForDateRange: (start: Date, end: Date) => CalendarEvent[];
  getUpcomingEvents: (limit?: number) => CalendarEvent[];
  fetchEvents: () => Promise<void>;
}

const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      events: [],
      
      fetchEvents: async () => {
        const events = await eventService.getEvents();
        set({ events });
      },
      
      addEvent: async (eventData) => {
        await eventService.createEvent(eventData);
        await get().fetchEvents();
      },
      
      updateEvent: async (id, updatedEventData) => {
        const updatedEvent = await eventService.updateEvent(id, updatedEventData);
        set((state) => ({
          events: state.events.map((event) => 
            event.id === id ? updatedEvent : event
          ),
        }));
      },
      
      deleteEvent: async (id) => {
        await eventService.deleteEvent(id);
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        }));
      },
      
      deleteEventInstance: async (id, date) => {
        const updatedEvent = await eventService.deleteEventInstance(id, date);
        set((state) => ({
          events: state.events.map((event) => 
            event.id === id ? updatedEvent : event
          ),
        }));
      },

      updateEventInstance: async (id, date, modifications) => {
        const updatedEvent = await eventService.modifyEventInstance(id, date, modifications);
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? updatedEvent : event
          ),
        }));
      },
      
      getEventsForDateRange: (start, end) => {
        const { events } = get();
        const result: CalendarEvent[] = [];
        
        events.forEach(event => {
          if (event.recurrence.type === 'none') {
            const eventStart = parseISO(event.startDate);
            const eventEnd = parseISO(event.endDate);
            
            if (isBefore(eventStart, end) && isAfter(eventEnd, start)) {
              result.push(event);
            }
            return;
          }
          
          const eventStart = parseISO(event.startDate);
          const eventDuration = parseISO(event.endDate).getTime() - eventStart.getTime();
          let currentDate = new Date(eventStart);
          let occurrences = 0;
          const maxOccurrences = event.recurrence.count || 100;
          
          while (isBefore(currentDate, end) && occurrences < maxOccurrences) {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            if (event.deletedInstances?.includes(dateStr)) {
              currentDate = addDays(currentDate, event.recurrence.interval || 1);
              continue;
            }
            
            if (isAfter(currentDate, start)) {
              const occurrenceEnd = new Date(currentDate.getTime() + eventDuration);
              
              if (event.modifiedInstances && event.modifiedInstances[dateStr]) {
                result.push({
                  ...event,
                  ...event.modifiedInstances[dateStr],
                  startDate: format(currentDate, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
                  endDate: format(occurrenceEnd, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
                });
              } else {
                result.push({
                  ...event,
                  startDate: format(currentDate, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
                  endDate: format(occurrenceEnd, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
                });
              }
            }
            
            currentDate = addDays(currentDate, event.recurrence.interval || 1);
            occurrences++;
          }
        });
        
        return result;
      },
      
      getUpcomingEvents: (limit = 10) => {
        const today = new Date();
        const nextMonth = addDays(today, 30);
        
        const events = get().getEventsForDateRange(today, nextMonth);
        
        return events
          .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())
          .slice(0, limit);
      },
    }),
    {
      name: 'event-storage',
    }
  )
);

export { useEventStore };
