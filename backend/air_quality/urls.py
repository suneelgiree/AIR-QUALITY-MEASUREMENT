from django.urls import path
from . import views

urlpatterns = [
    path('update/', views.update_air_quality, name='update_air_quality'),
    path('history/', views.air_quality_history, name='air_quality_history'),
]
