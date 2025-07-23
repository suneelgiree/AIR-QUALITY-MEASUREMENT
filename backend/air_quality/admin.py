from django.contrib import admin
from .models import AirQualityData

@admin.register(AirQualityData)
class AirQualityDataAdmin(admin.ModelAdmin):
    list_display = ['user', 'location', 'aqi', 'pm25', 'timestamp']
    list_filter = ['aqi', 'timestamp']
    search_fields = ['user__email', 'location']
