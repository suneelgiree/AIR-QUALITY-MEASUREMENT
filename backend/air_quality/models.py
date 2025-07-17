from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
User = get_user_model()

# existing model intact
class AirQualityData(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='air_quality_data')
    location = models.CharField(max_length=255)
    aqi = models.IntegerField()  # Air Quality Index
    pm25 = models.FloatField()  # PM2.5 concentration
    timestamp = models.DateTimeField(default=timezone.now)

    # additional fields to match sensor data (optional)
    pm10 = models.FloatField(null=True, blank=True)  # PM10 concentration
    co = models.FloatField(null=True, blank=True)    # CO concentration
    no2 = models.FloatField(null=True, blank=True)   # NO2 concentration
    so2 = models.FloatField(null=True, blank=True)   # SO2 concentration
    o3 = models.FloatField(null=True, blank=True)    # O3 concentration
    
    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.email} - {self.location} - {self.aqi} - {self.pm25} - {self.timestamp}"

# New model for sensor-based AQI calculations
class AirQualityRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sensor_air_quality')
    aqi = models.FloatField()  # Calculated AQI from sensor data
    pm25 = models.FloatField()  # PM2.5 concentration from sensor
    pm10 = models.FloatField(default=0)  # PM10 concentration from sensor
    temperature = models.FloatField(null=True, blank=True)  # Temperature in °C
    humidity = models.FloatField(null=True, blank=True)     # Humidity in %
    pressure = models.FloatField(null=True, blank=True)     # Pressure in hPa
    category = models.CharField(max_length=50)  # Air quality category/status
    timestamp = models.DateTimeField(default=timezone.now)
    
    # Optional location fields to match existing model
    location = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"Sensor AQI: {self.aqi} ({self.category}) at {self.timestamp}"

# New model for AQI predictions
class AQIPrediction(models.Model):
    air_quality_record = models.ForeignKey(AirQualityRecord, on_delete=models.CASCADE, related_name='predictions')
    hours_ahead = models.IntegerField(default=24)  # How many hours ahead is this prediction
    predicted_aqi = models.FloatField()  # Predicted AQI value
    model_used = models.CharField(max_length=100)  # Which model made this prediction
    created_at = models.DateTimeField(default=timezone.now)
    confidence = models.FloatField(null=True, blank=True)  # Optional confidence score
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Prediction: {self.predicted_aqi} AQI in {self.hours_ahead}h using {self.model_used}"