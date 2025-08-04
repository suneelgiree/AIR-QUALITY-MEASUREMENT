from django.urls import path
from . import views

app_name = 'air_quality'

urlpatterns = [
    # --- PUBLIC ENDPOINTS ---
    path('latest-reading/', views.LatestAQIView.as_view(), name='latest-aqi-reading'),
    path('forecast/latest/', views.LatestForecastView.as_view(), name='latest-forecast'),
    # --- NEW: URL for the public history fallback ---
    path('public-history/', views.PublicHistoryView.as_view(), name='public-history'),
    
    # --- AUTHENTICATED & SENSOR ENDPOINTS ---
    path('record/', views.AirQualityRecordView.as_view(), name='air_quality_record'),
    path('history/', views.AirQualityHistoryView.as_view(), name='air_quality_history'),
    path('sensor/upload/', views.SensorFileUploadView.as_view(), name='sensor_file_upload'),

    # --- PROXY URL TO FIX CORS ---
    path('external/aqi-proxy/', views.ExternalAQIProxyView.as_view(), name='external_aqi_proxy'),
]