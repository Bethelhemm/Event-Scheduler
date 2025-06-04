from rest_framework import viewsets, permissions
from .models import Event
from .serializers import EventSerializer, EventOccurrenceSerializer
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .utils import expand_event

import logging
from datetime import datetime
from django.http import HttpResponse
from icalendar import Calendar, Event as ICalEvent

logger = logging.getLogger(__name__)

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        logger.info(f"User {self.request.user} requested events")
        queryset = Event.objects.filter(user=self.request.user)
        calendar_id = self.request.query_params.get('calendar_id')
        if calendar_id is not None:
            queryset = queryset.filter(calendar_id=calendar_id)
        return queryset

    def perform_create(self, serializer):
        logger.info(f"User {self.request.user} creating event with data: {self.request.data}")
        try:
            serializer.save(user=self.request.user)
        except Exception as e:
            logger.error(f"Error creating event: {e}")
            raise

    def perform_update(self, serializer):
        logger.info(f"User {self.request.user} updating event with data: {self.request.data}")
        try:
            serializer.save(user=self.request.user)
        except Exception as e:
            logger.error(f"Error updating event: {e}")
            raise

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def delete_instance(self, request, pk=None):
        import sys
        try:
            event = self.get_object()
            date_str = request.data.get('date')
            if not date_str:
                return Response({'error': 'Date is required'}, status=400)
        
            try:
                date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format, expected YYYY-MM-DD'}, status=400)

            # Initialize deleted_instances if None
            if event.deleted_instances is None:
                event.deleted_instances = []
            logger.debug(f"delete_instance: event.deleted_instances before check: {event.deleted_instances}")

            # Make sure it's a list or convert to list
            if not isinstance(event.deleted_instances, list):
                try:
                    event.deleted_instances = list(event.deleted_instances)
                    logger.debug(f"delete_instance: converted deleted_instances to list: {event.deleted_instances}")
                except Exception as e:
                    logger.error(f"delete_instance: failed to convert deleted_instances to list: {e}", exc_info=True)
                    print(f"delete_instance: failed to convert deleted_instances to list: {e}", file=sys.stderr)
                    return Response({'error': 'deleted_instances is not a list and cannot be converted'}, status=500)

            # Add date to deleted_instances
            if date_obj.isoformat() not in event.deleted_instances:
                event.deleted_instances.append(date_obj.isoformat())
                event.save()
                logger.debug(f"delete_instance: appended date {date_obj.isoformat()} to deleted_instances")

            serializer = self.get_serializer(event)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in delete_instance for event {event.id if 'event' in locals() else 'unknown'}: {e}", exc_info=True)
            print(f"Error in delete_instance: {e}", file=sys.stderr)
            return Response({'error': 'Internal server error'}, status=500)


    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def modify_instance(self, request, pk=None):
        event = self.get_object()
        date_str = request.data.get('date')
        modifications = request.data.get('modifications')
        if not date_str or not modifications:
            return Response({'error': 'Date and modifications are required'}, status=400)
        try:
            datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format, expected YYYY-MM-DD'}, status=400)

        event.modified_instances[date_str] = modifications
        event.save()
        serializer = self.get_serializer(event)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def export_ics(self, request, pk=None):
        event = self.get_object()
        cal = Calendar()
        cal.add('prodid', '-//Event Scheduler//')
        cal.add('version', '2.0')

        occurrences = expand_event(event)
        for occ in occurrences:
            ical_event = ICalEvent()
            ical_event.add('uid', f"{event.id}-{occ['start_time'].isoformat()}")
            ical_event.add('summary', occ['title'])
            ical_event.add('dtstart', occ['start_time'])
            ical_event.add('dtend', occ['end_time'])
            cal.add_component(ical_event)

        response = HttpResponse(cal.to_ical(), content_type='text/calendar')
        response['Content-Disposition'] = f'attachment; filename=event_{event.id}.ics'
        return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expanded_events(request):
    user = request.user
    events = Event.objects.filter(user=user)
    all_occurrences = []

    for event in events:
        occurrences = expand_event(event)
        all_occurrences.extend(occurrences)

    serializer = EventOccurrenceSerializer(all_occurrences, many=True)
    return Response(serializer.data)
