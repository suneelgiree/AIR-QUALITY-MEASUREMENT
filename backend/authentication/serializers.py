from rest_framework import serializers
from .models import CustomUser

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm password")

    class Meta:
        model = CustomUser
        # --- CORRECTED: Using 'full_name' to match your form and the updated model ---
        fields = ('email', 'full_name', 'location', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        # --- CORRECTED: Passing 'full_name' to the create_user method ---
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            location=validated_data.get('location', '')
        )
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # --- CORRECTED: Simplified to match the updated model ---
        fields = (
            'id', 'email', 'full_name', 'location', 'latitude', 
            'longitude', 'api_key'
        )
        read_only_fields = ('api_key',)