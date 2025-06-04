import { z } from 'zod';
import { RecurrenceType, WeekdayType, MonthlyPositionType } from '../stores/eventStore';

// Schema for user registration
export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Schema for user login
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Schema for creating/editing events
export const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isAllDay: z.boolean().default(false),
  recurrence: z.object({
    type: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'] as const),
    interval: z.number().int().positive().optional(),
    weekdays: z.array(z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const)).optional(),
    monthlyType: z.enum(['byDay', 'byDate'] as const).optional(),
    monthlyPosition: z.enum(['first', 'second', 'third', 'fourth', 'last'] as const).optional(),
    monthlyDay: z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const).optional(),
    endDate: z.string().nullable().optional(),
    count: z.number().int().positive().nullable().optional(),
  }),
  repeat_weekdays: z.array(z.number().int().min(0).max(6)).optional(),
  color: z.enum(['primary', 'secondary', 'accent']).optional(),
  calendar: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    color: z.string().optional(),
  }).optional(),
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
}).refine(data => {
  // If recurrence type is weekly and weekdays is provided, it should have at least one day
  if (data.recurrence.type === 'weekly' && data.recurrence.weekdays) {
    return data.recurrence.weekdays.length > 0;
  }
  return true;
}, {
  message: 'Please select at least one weekday',
  path: ['recurrence.weekdays'],
}).refine(data => {
  // If recurrence type is monthly and monthlyType is byDay, both position and day should be set
  if (data.recurrence.type === 'monthly' && data.recurrence.monthlyType === 'byDay') {
    return !!data.recurrence.monthlyPosition && !!data.recurrence.monthlyDay;
  }
  return true;
}, {
  message: 'Please select both position and day for monthly recurrence',
  path: ['recurrence.monthlyPosition'],
});

export type EventFormValues = z.infer<typeof eventSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;