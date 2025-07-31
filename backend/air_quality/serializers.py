from rest_framework import serializers
from .models import AirQualityData, AirQualityRecord, AQIPrediction

class AirQualityDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = AirQualityData
        fields = '__all__'
        read_only_fields = ('user', 'timestamp')

class AQIPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AQIPrediction
        fields = ['id', 'hours_ahead', 'predicted_aqi', 'model_used', 'created_at', 'confidence']

class AirQualityRecordSerializer(serializers.ModelSerializer):
    # Include nested predictions
    predictions = AQIPredictionSerializer(many=True, read_only=True)
    
    class Meta:
        model = AirQualityRecord
        fields = [
            'id', 'aqi', 'pm25', 'pm10', 'temperature', 'humidity', 
            'pressure', 'category', 'location', 'timestamp', 'predictions'
        ]
        read_only_fields = ('user', 'timestamp')

class AirQualityDashboardSerializer(serializers.Serializer):
    api_data = AirQualityDataSerializer(required=False)
    sensor_data = AirQualityRecordSerializer(required=False)
    # For stats and additional metrics
    average_aqi = serializers.FloatField(required=False)
    min_aqi = serializers.FloatField(required=False)
    max_aqi = serializers.FloatField(required=False)
    trend = serializers.CharField(required=False)

# Serializer for validating sensor file uploads from device/cloud
class SensorFileUploadSerializer(serializers.Serializer):
    filename = serializers.CharField()
    timestamp = serializers.CharField()
    data = serializers.CharField()
    location = serializers.CharField(required=False)