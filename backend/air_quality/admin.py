from django.contrib import admin
# --- Corrected Imports ---
# Remove the old 'Prediction' model and add the new forecast models
from .models import AirQualityReading, SensorFileUpload, AQIForecast, ForecastDataPoint

# Inline class to show data points directly within the forecast admin page
class ForecastDataPointInline(admin.TabularInline):
    model = ForecastDataPoint
    extra = 0 # Don't show extra empty forms for adding new points
    readonly_fields = ('date', 'predicted_aqi') # Make the fields read-only
    can_delete = False # Don't allow deleting data points from here

@admin.register(AQIForecast)
class AQIForecastAdmin(admin.ModelAdmin):
    """
    Admin view for the main forecast object.
    """
    list_display = ('generated_at', 'latitude', 'longitude')
    readonly_fields = ('generated_at', 'latitude', 'longitude')
    inlines = [ForecastDataPointInline] # This line nests the data points inside

@admin.register(AirQualityReading)
class AirQualityReadingAdmin(admin.ModelAdmin):
    """
    Admin view for individual air quality readings.
    """
    list_display = ('timestamp', 'location_name', 'aqi', 'source', 'user')
    list_filter = ('source', 'user', 'timestamp')
    search_fields = ('location_name', 'user__email')

@admin.register(SensorFileUpload)
class SensorFileUploadAdmin(admin.ModelAdmin):
    """
    Admin view for sensor file uploads.
    """
    list_display = ('timestamp', 'filename', 'user')
    list_filter = ('user',)
    search_fields = ('filename', 'user__email')

# We no longer register the old Prediction model.