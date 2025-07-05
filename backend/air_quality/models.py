# air_quality/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
User = get_user_model()

class AirQualityData(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='air_quality_data')
    location = models.CharField(max_length=255)
    aqi = models.IntegerField()  # Air Quality Index
    pm25 = models.FloatField()  # PM2.5 concentration
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user.email} - {self.location} - {self.aqi} - {self.pm25} - {self.timestamp}"
