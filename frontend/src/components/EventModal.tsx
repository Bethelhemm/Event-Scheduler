import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema, EventFormValues } from '../utils/validationSchemas';
import { CalendarEvent, RecurrenceType, WeekdayType, MonthlyPositionType } from '../stores/eventStore';
import { format, parseISO } from 'date-fns';
import { getRecurrenceDescription } from '../utils/dateUtils';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: () => void;
  defaultValues?: CalendarEvent;
  selectedDate?: Date;
  mode: 'create' | 'edit' | 'view';
  onEdit?: () => void;
}

const EventModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  defaultValues,
  selectedDate,
  mode,
  onEdit,
}: EventModalProps) => {
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: defaultValues ? {
      ...defaultValues,
      calendar: defaultValues.calendar || { id: '', name: '', color: '' }
    } : {
      title: '',
      description: '',
      startDate: selectedDate 
        ? format(selectedDate, "yyyy-MM-dd'T'HH:mm")
        : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endDate: selectedDate 
        ? format(new Date(selectedDate.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm") 
        : format(new Date(Date.now() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      isAllDay: false,
      recurrence: {
        type: 'none',
        interval: 1,
        weekdays: [],
        endDate: null,
        count: null,
      },
      repeat_weekdays: [],
      color: 'primary',
      calendar: {
        id: '',
        name: '',
        color: ''
      }
    }
  });
  
  const recurrenceType = watch('recurrence.type');
  const monthlyType = watch('recurrence.monthlyType');
  
  useEffect(() => {
    // When recurrence type changes, reset relevant fields
    if (recurrenceType === 'none') {
      setValue('recurrence.interval', undefined);
      setValue('recurrence.weekdays', undefined);
      setValue('recurrence.monthlyType', undefined);
      setValue('recurrence.monthlyPosition', undefined);
      setValue('recurrence.monthlyDay', undefined);
      setValue('recurrence.endDate', null);
      setValue('recurrence.count', null);
    } else if (recurrenceType === 'weekly') {
      setValue('recurrence.interval', 1);
      setValue('recurrence.weekdays', defaultValues?.recurrence.weekdays || []);
      setValue('recurrence.monthlyType', undefined);
      setValue('recurrence.monthlyPosition', undefined);
      setValue('recurrence.monthlyDay', undefined);
    } else if (recurrenceType === 'monthly') {
      setValue('recurrence.interval', 1);
      setValue('recurrence.weekdays', undefined);
      setValue('recurrence.monthlyType', 'byDate');
    }
  }, [recurrenceType, setValue, defaultValues]);
  
  if (!isOpen) return null;
  
  const weekdays: { value: WeekdayType; label: string }[] = [
    { value: 'MO', label: 'Monday' },
    { value: 'TU', label: 'Tuesday' },
    { value: 'WE', label: 'Wednesday' },
    { value: 'TH', label: 'Thursday' },
    { value: 'FR', label: 'Friday' },
    { value: 'SA', label: 'Saturday' },
    { value: 'SU', label: 'Sunday' },
  ];
  
  const monthlyPositions: { value: MonthlyPositionType; label: string }[] = [
    { value: 'first', label: 'First' },
    { value: 'second', label: 'Second' },
    { value: 'third', label: 'Third' },
    { value: 'fourth', label: 'Fourth' },
    { value: 'last', label: 'Last' },
  ];
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {mode === 'create' ? 'Add Event' : mode === 'edit' ? 'Edit Event' : 'Event Details'}
              </h3>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
                  {mode === 'view' ? (
                    <div className="mt-4">
                      <h2 className="text-xl font-semibold">{defaultValues?.title}</h2>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">When: </span>
                          {defaultValues?.isAllDay
                            ? format(parseISO(defaultValues.startDate), 'MMMM d, yyyy') + ' (All day)'
                            : `${format(parseISO(defaultValues!.startDate), 'MMMM d, yyyy h:mm a')} - ${format(parseISO(defaultValues!.endDate), 'h:mm a')}`
                          }
                        </p>
                        
                        {defaultValues?.recurrence.type !== 'none' && (
                          <p className="mt-1">
                            <span className="font-medium">Repeats: </span>
                            {getRecurrenceDescription(defaultValues!.recurrence)}
                          </p>
                        )}
                        
                        {defaultValues?.description && (
                          <div className="mt-3">
                            <span className="font-medium">Description: </span>
                            <p className="mt-1 whitespace-pre-wrap">{defaultValues.description}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-5 flex space-x-3 justify-end">
                            {mode === 'view' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (defaultValues?.id) {
                                    const url = `/backend/events/${defaultValues.id}/export_ics/`;
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `event_${defaultValues.id}.ics`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }
                                }}
                                className="btn btn-outline"
                              >
                                Export .ics
                              </button>
                            )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={onDelete}
                            className="btn btn-outline text-error-600 hover:bg-error-50"
                          >
                            Delete
                          </button>
                        )}
                        {onEdit && (
                          <button
                            type="button"
                            onClick={onEdit}
                            className="btn btn-outline"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                          }}
                          className="btn btn-primary"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
              <form onSubmit={handleSubmit(onSave)} className="mt-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="title">
                    Title
                  </label>
                  <input
                    id="title"
                    {...register('title')}
                    className="form-input"
                  />
                  {errors.title && (
                    <span className="form-error">{errors.title.message}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="description">
                    Description (optional)
                  </label>
                  <textarea
                    id="description"
                    {...register('description')}
                    className="form-input"
                    rows={3}
                  />
                  {errors.description && (
                    <span className="form-error">{errors.description.message}</span>
                  )}
                </div>
                
                <div className="flex space-x-4">
                  <div className="form-group flex-1">
                    <label className="form-label" htmlFor="startDate">
                      Start
                    </label>
                    <input
                      id="startDate"
                      type="datetime-local"
                      {...register('startDate')}
                      className="form-input"
                    />
                    {errors.startDate && (
                      <span className="form-error">{errors.startDate.message}</span>
                    )}
                  </div>
                  
                  <div className="form-group flex-1">
                    <label className="form-label" htmlFor="endDate">
                      End
                    </label>
                    <input
                      id="endDate"
                      type="datetime-local"
                      {...register('endDate')}
                      className="form-input"
                    />
                    {errors.endDate && (
                      <span className="form-error">{errors.endDate.message}</span>
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <div className="flex items-center">
                    <input
                      id="isAllDay"
                      type="checkbox"
                      {...register('isAllDay')}
                      className="form-checkbox"
                    />
                    <label className="ml-2 text-sm text-gray-700" htmlFor="isAllDay">
                      All day
                    </label>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="calendar">
                    Calendar
                  </label>
                  <select
                    id="calendar"
                    {...register('calendar.id' as const)}
                    className="form-select"
                  >
                    <option value="">None</option>
                    {/* TODO: Replace with dynamic calendar list */}
                    <option value="1">Work</option>
                    <option value="2">Personal</option>
                    <option value="3">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="color">
                    Color
                  </label>
                  <select
                    id="color"
                    {...register('color')}
                    className="form-select"
                  >
                    <option value="primary">Blue</option>
                    <option value="secondary">Teal</option>
                    <option value="accent">Purple</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="recurrenceType">
                    Repeat
                  </label>
                  <select
                    id="recurrenceType"
                    {...register('recurrence.type')}
                    className="form-select"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                
                {recurrenceType !== 'none' && (
                  <div className="pl-4 border-l-2 border-gray-200 mb-4">
                    <div className="form-group">
                      <label className="form-label" htmlFor="interval">
                        Repeat every
                      </label>
                      <div className="flex items-center">
                        <input
                          id="interval"
                          type="number"
                          min="1"
                          max="99"
                          {...register('recurrence.interval', { valueAsNumber: true })}
                          className="form-input w-20"
                        />
                        <span className="ml-2">
                          {recurrenceType === 'daily' && 'day(s)'}
                          {recurrenceType === 'weekly' && 'week(s)'}
                          {recurrenceType === 'monthly' && 'month(s)'}
                          {recurrenceType === 'yearly' && 'year(s)'}
                        </span>
                      </div>
                    </div>
                    
                    {recurrenceType === 'weekly' && (
                      <div className="form-group">
                        <label className="form-label">Repeat on</label>
                        <div className="grid grid-cols-7 gap-1">
                          <Controller
                            control={control}
                            name="recurrence.weekdays"
                            render={({ field }) => (
                              <>
                                {weekdays.map((day) => (
                                  <label
                                    key={day.value}
                                    className="flex items-center justify-center"
                                  >
                                    <input
                                      type="checkbox"
                                      value={day.value}
                                      checked={field.value?.includes(day.value)}
                                      onChange={(e) => {
                                        const value = e.target.value as WeekdayType;
                                        const currentValues = field.value || [];
                                        
                                        if (e.target.checked) {
                                          field.onChange([...currentValues, value]);
                                        } else {
                                          field.onChange(
                                            currentValues.filter((v) => v !== value)
                                          );
                                        }
                                      }}
                                      className="form-checkbox"
                                    />
                                    <span className="ml-1 text-xs">{day.label.substring(0, 1)}</span>
                                  </label>
                                ))}
                              </>
                            )}
                          />
                        </div>
                        {errors.recurrence?.weekdays && (
                          <span className="form-error">{errors.recurrence.weekdays.message}</span>
                        )}
                      </div>
                    )}
                    
                    {recurrenceType === 'monthly' && (
                      <div className="form-group">
                        <label className="form-label">Repeat by</label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="byDate"
                              checked={monthlyType === 'byDate'}
                              onChange={() => setValue('recurrence.monthlyType', 'byDate')}
                              className="form-radio"
                            />
                            <span className="ml-2 text-sm">Day of month</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="byDay"
                              checked={monthlyType === 'byDay'}
                              onChange={() => setValue('recurrence.monthlyType', 'byDay')}
                              className="form-radio"
                            />
                            <span className="ml-2 text-sm">Day of week</span>
                          </label>
                        </div>
                        
                        {monthlyType === 'byDay' && (
                          <div className="mt-2 flex space-x-2">
                            <select
                              {...register('recurrence.monthlyPosition')}
                              className="form-select"
                            >
                              {monthlyPositions.map((pos) => (
                                <option key={pos.value} value={pos.value}>
                                  {pos.label}
                                </option>
                              ))}
                            </select>
                            
                            <select
                              {...register('recurrence.monthlyDay')}
                              className="form-select"
                            >
                              {weekdays.map((day) => (
                                <option key={day.value} value={day.value}>
                                  {day.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label className="form-label">Ends</label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="endType"
                            value="never"
                            checked={!watch('recurrence.endDate') && !watch('recurrence.count')}
                            onChange={() => {
                              setValue('recurrence.endDate', null);
                              setValue('recurrence.count', null);
                            }}
                            className="form-radio"
                          />
                          <span className="ml-2 text-sm">Never</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="endType"
                            value="onDate"
                            checked={!!watch('recurrence.endDate')}
                            onChange={() => {
                              setValue('recurrence.endDate', format(new Date(), 'yyyy-MM-dd'));
                              setValue('recurrence.count', null);
                            }}
                            className="form-radio"
                          />
                          <span className="ml-2 text-sm">On date</span>
                        </label>
                        
                        {!!watch('recurrence.endDate') && (
                          <input
                            type="date"
                            {...register('recurrence.endDate')}
                            className="form-input mt-1 ml-6 w-full sm:w-auto"
                          />
                        )}
                        
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="endType"
                            value="afterOccurrences"
                            checked={!!watch('recurrence.count')}
                            onChange={() => {
                              setValue('recurrence.endDate', null);
                              setValue('recurrence.count', 10);
                            }}
                            className="form-radio"
                          />
                          <span className="ml-2 text-sm">After</span>
                        </label>
                        
                        {!!watch('recurrence.count') && (
                          <div className="flex items-center ml-6 mt-1">
                            <input
                              type="number"
                              min="1"
                              max="999"
                              {...register('recurrence.count', { valueAsNumber: true })}
                              className="form-input w-20"
                            />
                            <span className="ml-2 text-sm">occurrences</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-5 flex space-x-3 justify-end">
                  {mode === 'edit' && onDelete && (
                    <button
                      type="button"
                      onClick={onDelete}
                      className="btn btn-outline text-error-600 hover:bg-error-50"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {mode === 'create' ? 'Create' : 'Update'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;