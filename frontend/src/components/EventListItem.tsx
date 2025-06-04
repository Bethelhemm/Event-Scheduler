import { CalendarEvent } from '../stores/eventStore';
import { safeFormatDate, safeFormatTime, getRecurrenceDescription } from '../utils/dateUtils';
import { Calendar, RefreshCw } from 'lucide-react';

interface EventListItemProps {
  event: CalendarEvent;
  onClick: () => void;
}

const EventListItem = ({ event, onClick }: EventListItemProps) => {
  console.log('EventListItem rendering event:', event);
  console.log('startDate:', event.startDate, 'endDate:', event.endDate);

  const isValidDateString = (dateStr: string | undefined | null): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
  };

  const displayStartDate = isValidDateString(event.startDate) ? safeFormatDate(event.startDate) : 'Invalid date';
  const displayStartTime = isValidDateString(event.startDate) ? safeFormatTime(event.startDate) : 'Invalid time';
  const displayEndTime = isValidDateString(event.endDate) ? safeFormatTime(event.endDate) : 'Invalid time';

  return (
    <div 
      className={`card mb-3 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-${event.color || 'primary'}-500`}
      onClick={onClick}
    >
      <div className="p-4">
        <h3 className="text-lg font-medium mb-2">{event.title}</h3>
        
        <div className="flex items-start text-sm text-gray-600 mb-2">
          <Calendar size={16} className="mr-1 mt-0.5 flex-shrink-0" />
          <div>
            {event.isAllDay ? (
              <span>{displayStartDate}</span>
            ) : (
              <span>
                {displayStartDate} {displayStartTime} - {displayEndTime}
              </span>
            )}
          </div>
        </div>
        
        {event.recurrence.type !== 'none' && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <RefreshCw size={16} className="mr-1 flex-shrink-0" />
            <span>{getRecurrenceDescription(event.recurrence)}</span>
          </div>
        )}
        
        {event.description && (
          <div className="text-sm text-gray-700 mt-2 line-clamp-2">
            {event.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventListItem;
