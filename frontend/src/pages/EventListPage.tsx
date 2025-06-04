import { useState } from 'react';
import { CalendarEvent, useEventStore } from '../stores/eventStore';
import EventListItem from '../components/EventListItem';
import EventModal from '../components/EventModal';
import { EventFormValues } from '../utils/validationSchemas';
import { parseISO } from 'date-fns';
import { Plus, Search } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';

const EventListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  
  const { events, addEvent, updateEvent, deleteEvent, deleteEventInstance } = useEventStore();
  
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalMode('view');
    setModalOpen(true);
  };
  
  const handleAddEvent = () => {
    setSelectedEvent(null);
    setModalMode('create');
    setModalOpen(true);
  };
  
  const handleSaveEvent = async (data: EventFormValues) => {
    if (modalMode === 'create') {
      await addEvent({ ...data, description: data.description || '' });
    } else if (modalMode === 'edit' && selectedEvent) {
      await updateEvent(selectedEvent.id, data);
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
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl font-semibold">Event List</h1>
        
        <div className="flex w-full sm:w-auto space-x-2">
          <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search events..."
              className="form-input pl-9"
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <button onClick={handleAddEvent} className="btn btn-primary">
            <Plus size={16} className="mr-1" />
            Add Event
          </button>
        </div>
      </div>
      
      <div>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No events found.</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <ErrorBoundary key={event.id}>
              <EventListItem 
                event={event} 
                onClick={() => handleEventClick(event)} 
              />
            </ErrorBoundary>
          ))
        )}
      </div>
      
      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={selectedEvent ? handleDeleteEvent : undefined}
        defaultValues={selectedEvent || undefined}
        mode={modalMode}
      />
    </div>
  );
};

export default EventListPage;
