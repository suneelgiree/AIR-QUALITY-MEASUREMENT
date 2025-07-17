from django.urls import path
from . import views

urlpatterns = [
    # API-based endpoints
    path('update/', views.update_air_quality, name='update_air_quality'),
    path('history/', views.air_quality_history, name='air_quality_history'),
    
    # New sensor-based endpoints
    path('sensor/update/', views.AirQualityUpdateView.as_view(), name='sensor_air_quality_update'),
    path('sensor/history/', views.AirQualityHistoryView.as_view(), name='sensor_air_quality_history'),
    
    # Combined dashboard view
    path('dashboard/', views.AirQualityDashboardView.as_view(), name='air_quality_dashboard'),
]