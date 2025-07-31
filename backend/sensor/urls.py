from django.urls import path
from .views import AQILogList

urlpatterns = [
    path('aqi-log/', AQILogList.as_view(), name='aqi-log-list'),
]