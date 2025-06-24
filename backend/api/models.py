from django.db import models

class AirQuality(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    location = models.CharField(max_length=100)
    pm25 = models.FloatField()
    pm10 = models.FloatField()
    temperature = models.FloatField()
    humidity = models.FloatField()
    prediction = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.location} @ {self.timestamp}"

