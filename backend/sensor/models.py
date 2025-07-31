from django.db import models

class AQILog(models.Model):
    timestamp = models.DateTimeField()
    overall_aqi = models.IntegerField()
    dominant_pollutant = models.CharField(max_length=20)
    dominant_concentration = models.FloatField()
    individual_aqis = models.JSONField()
    concentrations = models.JSONField()
    category_info = models.JSONField()