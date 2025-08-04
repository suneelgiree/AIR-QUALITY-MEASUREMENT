from rest_framework import serializers
from .models import AirQualityReading, AQIForecast, ForecastDataPoint, SensorFileUpload

# --- NEW: Serializer for individual data points in a forecast ---
class ForecastDataPointSerializer(serializers.ModelSerializer):
    """
    Formats a single day's forecast data point.
    """
    class Meta:
        model = ForecastDataPoint
        fields = ['date', 'predicted_aqi']


# --- NEW: Serializer for the main forecast object ---
class AQIForecastSerializer(serializers.ModelSerializer):
    """
    Formats the main forecast object, nesting the 7-day data points within it.
    This provides a complete forecast package in a single API response.
    """
    # This line tells the serializer to find the related data points,
    # format them using the ForecastDataPointSerializer, and nest them
    # under the key 'data_points'.
    data_points = ForecastDataPointSerializer(many=True, read_only=True)

    class Meta:
        model = AQIForecast
        fields = ['generated_at', 'latitude', 'longitude', 'data_points']


# --- Existing Serializers ---
class AirQualityReadingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    class Meta:
        model = AirQualityReading
        fields = '__all__'


class SensorFileUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SensorFileUpload
        fields = '__all__'