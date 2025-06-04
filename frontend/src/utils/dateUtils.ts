import { addDays, addMonths, addWeeks, addYears, format, getDay, getDate, getDaysInMonth, isAfter, isSameDay, parseISO, isValid } from 'date-fns';
import { MonthlyPositionType, RecurrenceRule, WeekdayType } from '../stores/eventStore';

// Map day of week number to WeekdayType
export const dayNumberToWeekday = (day: number): WeekdayType => {
  const map: Record<number, WeekdayType> = {
    0: 'SU',
    1: 'MO',
    2: 'TU',
    3: 'WE',
    4: 'TH',
    5: 'FR',
    6: 'SA',
  };
  return map[day];
};

// Safely parse a date string or Date object, return null if invalid
export const safeParseDate = (date: string | Date | null | undefined): Date | null => {
  if (!date) return null;
  let d: Date;
  if (typeof date === 'string') {
    d = parseISO(date);
  } else if (date instanceof Date) {
    d = date;
  } else {
    return null;
  }
  return isValid(d) ? d : null;
};

// Safely format a date, return fallback text if invalid
export const safeFormatDate = (date: string | Date | null | undefined, fallback: string = 'Invalid date', formatStr: string = 'PPP'): string => {
  const d = safeParseDate(date);
  if (!d) return fallback;
  return format(d, formatStr);
};

// Safely format time, return fallback text if invalid
export const safeFormatTime = (date: string | Date | null | undefined, fallback: string = 'Invalid time'): string => {
  const d = safeParseDate(date);
  if (!d) return fallback;
  return format(d, 'h:mm a');
};

// Map WeekdayType to day of week number
export const weekdayToDayNumber = (weekday: WeekdayType): number => {
  const map: Record<WeekdayType, number> = {
    'SU': 0,
    'MO': 1,
    'TU': 2,
    'WE': 3,
    'TH': 4,
    'FR': 5,
    'SA': 6,
  };
  return map[weekday];
};

// Format date for display
export const formatDate = (date: Date | string, formatStr: string = 'PPP'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      throw new Error('Invalid date');
    }
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('formatDate error:', error, 'input:', date);
    return 'Invalid date';
  }
};

// Format time for display
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'h:mm a');
};

// Format date and time for display
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'PPP p');
};

// Get the week number of the year
export const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Get the nth occurrence of a weekday in a month
export const getNthWeekdayOfMonth = (
  year: number,
  month: number, // 0-indexed (0 = January)
  weekday: WeekdayType,
  position: MonthlyPositionType
): Date | null => {
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = getDaysInMonth(firstDayOfMonth);
  const targetDayNumber = weekdayToDayNumber(weekday);
  
  if (position === 'last') {
    // Start from the last day of the month and go backwards
    let day = daysInMonth;
    while (day > 0) {
      const date = new Date(year, month, day);
      if (getDay(date) === targetDayNumber) {
        return date;
      }
      day--;
    }
  } else {
    let count = 0;
    let positionNumber = 0;
    
    switch (position) {
      case 'first': positionNumber = 0; break;
      case 'second': positionNumber = 1; break;
      case 'third': positionNumber = 2; break;
      case 'fourth': positionNumber = 3; break;
    }
    
    // Find the nth occurrence
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (getDay(date) === targetDayNumber) {
        if (count === positionNumber) {
          return date;
        }
        count++;
      }
    }
  }
  
  return null; // Not found
};

// Get human-readable recurrence description
export const getRecurrenceDescription = (rule: RecurrenceRule): string => {
  if (rule.type === 'none') {
    return 'One-time event';
  }
  
  const interval = rule.interval || 1;
  let intervalText = interval > 1 ? `every ${interval} ` : '';
  
  switch (rule.type) {
    case 'daily':
      return `Repeats ${intervalText}${interval > 1 ? 'days' : 'day'}`;
      
    case 'weekly':
      if (rule.weekdays && rule.weekdays.length > 0) {
        const weekdayNames = rule.weekdays.map(wd => {
          const dayMap: Record<WeekdayType, string> = {
            'MO': 'Monday',
            'TU': 'Tuesday',
            'WE': 'Wednesday',
            'TH': 'Thursday',
            'FR': 'Friday',
            'SA': 'Saturday',
            'SU': 'Sunday',
          };
          return dayMap[wd];
        });
        
        if (interval > 1) {
          return `Repeats every ${interval} weeks on ${weekdayNames.join(', ')}`;
        } else {
          return `Repeats weekly on ${weekdayNames.join(', ')}`;
        }
      }
      return `Repeats ${intervalText}${interval > 1 ? 'weeks' : 'week'}`;
      
    case 'monthly':
      if (rule.monthlyType === 'byDay' && rule.monthlyPosition && rule.monthlyDay) {
        const positionMap: Record<MonthlyPositionType, string> = {
          'first': 'first',
          'second': 'second',
          'third': 'third',
          'fourth': 'fourth',
          'last': 'last',
        };
        
        const dayMap: Record<WeekdayType, string> = {
          'MO': 'Monday',
          'TU': 'Tuesday',
          'WE': 'Wednesday',
          'TH': 'Thursday',
          'FR': 'Friday',
          'SA': 'Saturday',
          'SU': 'Sunday',
        };
        
        return `Repeats on the ${positionMap[rule.monthlyPosition]} ${dayMap[rule.monthlyDay]} of ${intervalText}${interval > 1 ? 'months' : 'month'}`;
      }
      return `Repeats ${intervalText}${interval > 1 ? 'months' : 'month'}`;
      
    case 'yearly':
      return `Repeats ${intervalText}${interval > 1 ? 'years' : 'year'}`;
      
    default:
      return 'Custom recurrence';
  }
};

// Calculate next occurrences of a recurring event
export const getNextOccurrences = (
  startDate: Date | string,
  rule: RecurrenceRule,
  count: number = 5
): Date[] => {
  const occurrences: Date[] = [];
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  let current = new Date(start);
  
  // Return empty array for non-recurring events
  if (rule.type === 'none') {
    return [current];
  }
  
  // Check end date if it exists
  const endDate = rule.endDate ? parseISO(rule.endDate) : null;
  
  // Calculate occurrences
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      occurrences.push(current);
      continue;
    }
    
    const interval = rule.interval || 1;
    
    switch (rule.type) {
      case 'daily':
        current = addDays(current, interval);
        break;
        
      case 'weekly':
        // Simple implementation - doesn't handle weekday selection properly
        current = addWeeks(current, interval);
        break;
        
      case 'monthly':
        if (rule.monthlyType === 'byDay' && rule.monthlyPosition && rule.monthlyDay) {
          // Handle "nth weekday of month" recurrence
          const nextMonth = addMonths(current, interval);
          const targetDate = getNthWeekdayOfMonth(
            nextMonth.getFullYear(),
            nextMonth.getMonth(),
            rule.monthlyDay,
            rule.monthlyPosition
          );
          
          if (targetDate) {
            current = targetDate;
          } else {
            // Fallback to same day
            current = addMonths(current, interval);
          }
        } else {
          // Same day of month
          current = addMonths(current, interval);
        }
        break;
        
      case 'yearly':
        current = addYears(current, interval);
        break;
        
      default:
        // For custom recurrence, just add a day as a fallback
        current = addDays(current, 1);
    }
    
    // Check if we've reached the end date
    if (endDate && isAfter(current, endDate)) {
      break;
    }
    
    occurrences.push(current);
  }
  
  return occurrences;
};