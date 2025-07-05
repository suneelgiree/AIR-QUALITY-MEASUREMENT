from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/air-quality/', include('air_quality.urls')),
    path('api/weather/', include('weather_prediction.urls')),
]
