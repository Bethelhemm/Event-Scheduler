import { useState } from 'react';
import CalendarHeader from '../components/CalendarHeader';
import MonthView from '../components/MonthView';
import WeekView from '../components/WeekView';
import DayView from '../components/DayView';
import EventModal from '../components/EventModal';
import { CalendarEvent, useEventStore } from '../stores/eventStore';
import { EventFormValues } from '../utils/validationSchemas';
import { parseISO } from 'date-fns';

type ViewType = 'month' | 'week' | 'day';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  
  const { addEvent, updateEvent, deleteEvent, deleteEventInstance } = useEventStore();
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalMode('view');
    setModalOpen(true);
  };
  
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setModalMode('create');
    setModalOpen(true);
  };
  
  const handleAddEvent = () => {
    setSelectedDate(currentDate);
    setSelectedEvent(null);
    setModalMode('create');
    setModalOpen(true);
  };
  
  const handleEditEvent = () => {
    if (selectedEvent) {
      setModalMode('edit');
    }
  };
  
  const handleSaveEvent = (data: EventFormValues) => {
    if (modalMode === 'create') {
      // Fix optional description and calendar fields for addEvent
      const eventData = {
        ...data,
        description: data.description || '',
        calendar: data.calendar && data.calendar.id ? {
          id: data.calendar.id,
          name: data.calendar.name || '',
          color: data.calendar.color || '',
        } : undefined,
      };
      addEvent(eventData);
    } else if (modalMode === 'edit' && selectedEvent) {
      // Fix optional description and calendar fields for updateEvent
      const eventData = {
        ...data,
        description: data.description || '',
        calendar: data.calendar && data.calendar.id ? {
          id: data.calendar.id,
          name: data.calendar.name || '',
          color: data.calendar.color || '',
        } : undefined,
      };
      updateEvent(selectedEvent.id, eventData);
    }
    setModalOpen(false);
  };
  
  const handleDeleteEvent = () => {
    if (selectedEvent) {
      if (modalMode === 'view') {
        // If we're viewing an event occurrence, delete just that instance
        const eventDate = parseISO(selectedEvent.startDate);
        const dateStr = eventDate.toISOString().split('T')[0];
        deleteEventInstance(selectedEvent.id, dateStr);
      } else {
        // Otherwise delete the entire event
        deleteEvent(selectedEvent.id);
      }
      setModalOpen(false);
    }
  };
  
  return (
    <div>
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onDateChange={setCurrentDate}
        onViewChange={setView}
        onAddEvent={handleAddEvent}
      />
      
      <div className="mt-4">
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        )}
        
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleDateClick}
          />
        )}
        
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleDateClick}
          />
        )}
      </div>
      
      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={selectedEvent ? handleDeleteEvent : undefined}
        defaultValues={selectedEvent || undefined}
        selectedDate={selectedDate || undefined}
        mode={modalMode}
        onEdit={handleEditEvent}
      />
    </div>
  );

};

export default CalendarPage;
