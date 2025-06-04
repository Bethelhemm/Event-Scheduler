from rest_framework import serializers
from .models import Event, Calendar
import logging
from django.utils.dateparse import parse_datetime

logger = logging.getLogger(__name__)

class CalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calendar
        fields = ['id', 'name', 'color']

class EventSerializer(serializers.ModelSerializer):
    deleted_instances = serializers.ListField(
        child=serializers.DateField(),
        required=False,
        allow_empty=True,
        default=list
    )
    modified_instances = serializers.JSONField(required=False, default=dict)
    calendar = CalendarSerializer(read_only=True)
    calendar_id = serializers.PrimaryKeyRelatedField(
        queryset=Calendar.objects.all(),
        source='calendar',
        write_only=True,
        required=False,
        allow_null=True,
    )
    repeat_weekdays = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=6),
        required=False,
        allow_empty=True
    )

    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['user']

    def validate(self, data):
        errors = {}
        title = data.get('title')
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if not title:
            errors['title'] = ['This field is required.']

        if not start_time:
            errors['start_time'] = ['This field is required.']
        else:
            if not isinstance(start_time, (str, type(None))):
                # Already a datetime object, skip parsing
                pass
            else:
                dt = parse_datetime(start_time) if isinstance(start_time, str) else None
                if dt is None:
                    errors['start_time'] = ['Invalid datetime format. Use ISO 8601 format.']

        if not end_time:
            errors['end_time'] = ['This field is required.']
        else:
            if not isinstance(end_time, (str, type(None))):
                pass
            else:
                dt = parse_datetime(end_time) if isinstance(end_time, str) else None
                if dt is None:
                    errors['end_time'] = ['Invalid datetime format. Use ISO 8601 format.']

        if errors:
            logger.error(f"Validation errors in EventSerializer: {errors}")
            raise serializers.ValidationError(errors)

        return super().validate(data)

class EventOccurrenceSerializer(serializers.Serializer):
    original_event_id = serializers.IntegerField()
    title = serializers.CharField()
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
