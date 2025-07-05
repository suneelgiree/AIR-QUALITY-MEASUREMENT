from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import AirQualityData
from .serializers import AirQualityDataSerializer
from utils.services import WeatherService

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_air_quality(request):
    """Update air quality data for user's location"""
    user = request.user
    
    if not user.latitude or not user.longitude:
        return Response({
            'error': 'User location not available'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    air_quality = WeatherService.get_air_quality_data(user.latitude, user.longitude)
    if not air_quality:
        return Response({
            'error': 'Failed to fetch air quality data'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Create new air quality record
    AirQualityData.objects.create(
        user=user,
        location=user.location,
        **air_quality
    )
    
    return Response({
        'message': 'Air quality data updated successfully',
        'data': air_quality
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def air_quality_history(request):
    """Get air quality history for user"""
    history = AirQualityData.objects.filter(user=request.user)[:30]
    serializer = AirQualityDataSerializer(history, many=True)
    return Response(serializer.data)
