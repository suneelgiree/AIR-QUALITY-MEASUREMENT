from rest_framework import serializers
from .models import AirQualityData

class AirQualityDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = AirQualityData
        fields = '__all__'
        read_only_fields = ('user', 'timestamp')
