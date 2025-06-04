from django.db import models
from django.contrib.auth.models import User
from django.db.models import JSONField
from django.contrib.postgres.fields import ArrayField
import calendar

def empty_list():
    return []


class Calendar(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calendars')
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=20, default='blue')

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class Event(models.Model):
    REPEAT_CHOICES = [
        ('none', 'None'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('nth_weekday', 'Nth Weekday'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    calendar = models.ForeignKey(
        Calendar, on_delete=models.SET_NULL, null=True, blank=True, related_name='events'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    repeat_type = models.CharField(max_length=20, choices=REPEAT_CHOICES, default='none')
    repeat_until = models.DateField(null=True, blank=True)
    nth_weekday = models.PositiveSmallIntegerField(null=True, blank=True)  # 0 = Monday
    nth_week = models.PositiveSmallIntegerField(null=True, blank=True)     # 1 = first, 2 = second

    deleted_instances = ArrayField(
        models.DateField(), default=empty_list, blank=True
    )

    modified_instances = JSONField(
        default=dict, blank=True
    )

    repeat_weekdays = ArrayField(
        models.IntegerField(choices=[(i, calendar.day_name[i]) for i in range(7)]),
        blank=True,
        default=empty_list,
        help_text="List of weekdays the event repeats on (0=Monday, ..., 6=Sunday)"
    )

    def __str__(self):
        return f"{self.title} ({self.user.username})"