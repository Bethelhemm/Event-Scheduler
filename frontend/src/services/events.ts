import api from './api';

export interface EventData {
  id?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  recurrence: {
    type: string;
    interval?: number;
    weekdays?: string[];
    monthlyType?: string;
    monthlyPosition?: string;
    monthlyDay?: string;
    endDate?: string | null;
    count?: number | null;
  };
  repeat_weekdays?: number[];
  color: string;
  calendar: {
    id: string;
  };
}

// Create a new event
export const createEvent = async (data: EventData) => {
  const response = await api.post('/events/', data);
  return response.data;
};

// Update an existing event
export const updateEvent = async (id: string, data: EventData) => {
  const response = await api.put(`/events/${id}/`, data);
  return response.data;
};

// Fetch events list
export const fetchEvents = async () => {
  const response = await api.get('/events/');
  return response.data;
};

// Fetch single event by id
export const fetchEventById = async (id: string) => {
  const response = await api.get(`/events/${id}/`);
  return response.data;
};

// Delete event by id
export const deleteEvent = async (id: string) => {
  const response = await api.delete(`/events/${id}/`);
  return response.data;
};

// Delete an instance of a recurring event by date
export const deleteEventInstance = async (id: string, date: string) => {
  const response = await api.post(`/events/${id}/delete_instance/`, { date });
  return response.data;
};

// Modify an instance of a recurring event by date with modifications
export const modifyEventInstance = async (id: string, date: string, modifications: any) => {
  const response = await api.post(`/events/${id}/modify_instance/`, { date, modifications });
  return response.data;
};
