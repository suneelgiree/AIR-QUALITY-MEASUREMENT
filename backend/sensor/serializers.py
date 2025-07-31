from rest_framework import serializers
from sensor.models import AQILog

class AQILogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AQILog
        fields = '__all__'