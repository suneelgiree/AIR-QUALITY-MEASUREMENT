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

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get or update user profile"""
    user = request.user
    if request.method == 'GET':
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)
    elif request.method == 'PATCH':
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Re-fetch user from DB to ensure fresh data
            user.refresh_from_db()
            refreshed_serializer = UserProfileSerializer(user)
            return Response(refreshed_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)