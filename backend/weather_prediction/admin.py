from django.contrib import admin
from .models import WeatherPrediction

@admin.register(WeatherPrediction)
class WeatherPredictionAdmin(admin.ModelAdmin):
    list_display = ['user', 'location', 'prediction_date', 'predicted_temperature', 'confidence_score']
    list_filter = ['prediction_date', 'predicted_condition']
    search_fields = ['user__email', 'location']
