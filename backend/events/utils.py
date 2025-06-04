from datetime import timedelta, datetime
from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY, YEARLY, MO, TU, WE, TH, FR, SA, SU
import calendar

WEEKDAY_MAP = {
    0: MO,
    1: TU,
    2: WE,
    3: TH,
    4: FR,
    5: SA,
    6: SU,
}

def expand_event(event):
    occurrences = []
    rule = None

    start = event.start_time
    end = event.end_time
    repeat_until = event.repeat_until or (start.date() + timedelta(days=30))
    deleted_dates = set(event.deleted_instances or [])
    modified_instances = event.modified_instances or {}
    count_limit = getattr(event, 'repeat_count', None) or None

    if event.repeat_type == 'none':
        if start.date() not in deleted_dates:
            occurrence = {
                'original_event_id': event.id,
                'title': event.title,
                'start_time': start,
                'end_time': end,
            }
            if str(start.date()) in modified_instances:
                occurrence.update(modified_instances[str(start.date())])
            occurrences.append(occurrence)
        return occurrences

    interval = getattr(event, 'repeat_interval', 1)
    if interval is None or interval < 1:
        interval = 1

    if event.repeat_type == 'daily':
        rule = rrule(DAILY, dtstart=start, until=repeat_until, interval=interval, count=count_limit)
    elif event.repeat_type == 'weekly':
        # Support selected weekdays if available
        byweekday = None
        if hasattr(event, 'repeat_weekdays') and event.repeat_weekdays:
            byweekday = [WEEKDAY_MAP[day] for day in event.repeat_weekdays if day in WEEKDAY_MAP]
        rule = rrule(WEEKLY, dtstart=start, until=repeat_until, interval=interval, count=count_limit, byweekday=byweekday)
    elif event.repeat_type == 'monthly':
        rule = rrule(MONTHLY, dtstart=start, until=repeat_until, interval=interval, count=count_limit)
    elif event.repeat_type == 'yearly':
        rule = rrule(YEARLY, dtstart=start, until=repeat_until, interval=interval, count=count_limit)
    elif event.repeat_type == 'nth_weekday':
        # Generate nth weekday of each month
        current = start
        occurrences_count = 0
        while current.date() <= repeat_until:
            if count_limit and occurrences_count >= count_limit:
                break
            year = current.year
            month = current.month
            weekday = event.nth_weekday  # e.g. 4 for Friday
            week = event.nth_week        # e.g. 2 for 2nd Friday

            c = calendar.Calendar()
            month_days = [day for day in c.itermonthdates(year, month) if day.weekday() == weekday and day.month == month]
            if len(month_days) >= week:
                nth_day = month_days[week - 1]
                new_start = datetime.combine(nth_day, start.time())
                new_end = new_start + (end - start)
                if new_start.date() <= repeat_until and new_start.date() not in deleted_dates:
                    occurrence = {
                        'original_event_id': event.id,
                        'title': event.title,
                        'start_time': new_start,
                        'end_time': new_end,
                    }
                    if str(new_start.date()) in modified_instances:
                        occurrence.update(modified_instances[str(new_start.date())])
                    occurrences.append(occurrence)
                    occurrences_count += 1
            # Go to next month
            if month == 12:
                current = current.replace(year=year + 1, month=1)
            else:
                current = current.replace(month=month + 1)

        return occurrences

    # For daily, weekly, monthly, yearly
    for dt in rule:
        if dt.date() in deleted_dates:
            continue
        new_start = dt
        new_end = new_start + (end - start)
        occurrence = {
            'original_event_id': event.id,
            'title': event.title,
            'start_time': new_start,
            'end_time': new_end,
        }
        if str(new_start.date()) in modified_instances:
            occurrence.update(modified_instances[str(new_start.date())])
        occurrences.append(occurrence)

    return occurrences
