from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, expanded_events

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='events')

urlpatterns = [
    path('', include(router.urls)),
    path('events/expanded/', expanded_events, name='expanded-events'),
    path('events/<int:pk>/export_ics/', EventViewSet.as_view({'get': 'export_ics'}), name='event-export-ics'),
]
