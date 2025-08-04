from django.db import models
from django.conf import settings
from django.utils import timezone

# --- Keep your existing models like AirQualityReading and SensorFileUpload ---

class AirQualityReading(models.Model):
    # ... your existing AirQualityReading model definition ...
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    source = models.CharField(max_length=20, choices=[('api', 'API'), ('sensor', 'Sensor'), ('FRIEND_API', 'Friend API')], default='api')
    timestamp = models.DateTimeField(default=timezone.now)
    location_name = models.CharField(max_length=255, null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    # Core AQI and pollutant data
    aqi = models.IntegerField(null=True, blank=True, help_text="Overall Air Quality Index")
    pm25 = models.FloatField(null=True, blank=True, verbose_name="PM2.5")
    pm10 = models.FloatField(null=True, blank=True, verbose_name="PM10")
    co = models.FloatField(null=True, blank=True, verbose_name="CO")
    no2 = models.FloatField(null=True, blank=True, verbose_name="NO2")
    so2 = models.FloatField(null=True, blank=True, verbose_name="SO2")
    o3 = models.FloatField(null=True, blank=True, verbose_name="Ozone (O3)")
    category = models.CharField(max_length=100, null=True, blank=True)
    
    # Store the full, raw response from the source API or sensor
    raw_data = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"AQI {self.aqi} at {self.location_name} on {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

class SensorFileUpload(models.Model):
    # ... your existing SensorFileUpload model definition ...
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    filename = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    data = models.TextField() # Storing file content as text
    location = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.filename} uploaded by {self.user.email} at {self.timestamp}"


# --- ADD THESE NEW MODELS ---

class AQIForecast(models.Model):
    """
    Represents a single 7-day forecast generation event.
    It acts as a parent container for the individual daily data points.
    """
    generated_at = models.DateTimeField(auto_now_add=True)
    latitude = models.FloatField()
    longitude = models.FloatField()

    def __str__(self):
        return f"Forecast for ({self.latitude}, {self.longitude}) generated at {self.generated_at}"


class ForecastDataPoint(models.Model):
    """
    Represents a single day's data point within a 7-day forecast.
    """
    forecast = models.ForeignKey(AQIForecast, related_name='data_points', on_delete=models.CASCADE)
    date = models.DateField()
    predicted_aqi = models.FloatField()

    class Meta:
        # Ensures that each forecast has only one prediction per date
        unique_together = ('forecast', 'date')
        ordering = ['date']

    def __str__(self):
        return f"{self.date}: Predicted AQI {self.predicted_aqi}"