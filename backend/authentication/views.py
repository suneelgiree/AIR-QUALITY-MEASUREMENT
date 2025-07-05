from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import UserRegistrationSerializer, UserProfileSerializer
from utils.services import WeatherService
from air_quality.models import AirQualityData

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User registration with location and air quality data"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Geocode location
        lat, lon = WeatherService.geocode_location(user.location)
        if lat and lon:
            user.latitude = lat
            user.longitude = lon
            user.save()
            
            # Fetch and store air quality data
            # air_quality = WeatherService.get_air_quality_data(lat, lon)
            # if air_quality:
            #     AirQualityData.objects.create(
            #         user=user,
            #         location=user.location,
            #         **air_quality
            #     )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'User registered successfully',
            'user_id': user.id,
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'location': user.location,
            'coordinates': {'lat': lat, 'lon': lon} if lat and lon else None
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """User login"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'error': 'Email and password required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=email, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Login successful',
            'user_id': user.id,
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': {
                'email': user.email,
                'full_name': user.full_name,
                'location': user.location
            }
        })
    
    return Response({
        'error': 'Invalid credentials'
    }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get user profile"""
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)
