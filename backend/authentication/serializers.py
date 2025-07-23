from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from air_quality.models import AirQualityData

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'password_confirm', 'full_name', 'location')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data['full_name'],
            location=validated_data['location']
        )
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    latest_air_quality = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'location', 'latitude', 'longitude', 
                 'created_at', 'latest_air_quality')

    def get_latest_air_quality(self, obj):
        latest = obj.air_quality_data.first()
        if latest:
            return {
                'aqi': latest.aqi,
                'pm25': latest.pm25,
                'pm10': latest.pm10,
                'timestamp': latest.timestamp
            }
        return None
