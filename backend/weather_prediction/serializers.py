from rest_framework import serializers
from .models import WeatherPrediction

class WeatherPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeatherPrediction
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

class WeatherForecastRequestSerializer(serializers.Serializer):
    days_ahead = serializers.IntegerField(min_value=1, max_value=7, default=1)
