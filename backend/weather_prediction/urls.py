from django.urls import path
from . import views

urlpatterns = [
    path('current/', views.current_weather, name='current_weather'),
    path('forecast/', views.weather_forecast, name='weather_forecast'),
]
