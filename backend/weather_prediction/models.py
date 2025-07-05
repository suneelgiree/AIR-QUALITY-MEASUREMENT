from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class WeatherPrediction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='weather_predictions')
    location = models.CharField(max_length=255)
    prediction_date = models.DateField()
    predicted_temperature = models.FloatField()
    predicted_humidity = models.FloatField()
    predicted_pressure = models.FloatField()
    predicted_wind_speed = models.FloatField()
    predicted_condition = models.CharField(max_length=100)
    confidence_score = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.prediction_date}"
