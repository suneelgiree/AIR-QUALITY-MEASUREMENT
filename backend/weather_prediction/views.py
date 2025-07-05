from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import WeatherPrediction
from .serializers import WeatherPredictionSerializer, WeatherForecastRequestSerializer
from utils.services import WeatherService, WeatherPredictionModel

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_weather(request):
    """Get current weather for user's location"""
    user = request.user
    
    if not user.latitude or not user.longitude:
        return Response({
            'error': 'User location not available'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    weather_data = WeatherService.get_weather_data(user.latitude, user.longitude)
    if not weather_data:
        return Response({
            'error': 'Failed to fetch weather data'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'location': user.location,
        'weather': weather_data
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def weather_forecast(request):
    """AI-powered weather prediction"""
    serializer = WeatherForecastRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user = request.user
    days_ahead = serializer.validated_data['days_ahead']
    
    if not user.latitude or not user.longitude:
        return Response({
            'error': 'User location not available'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get current weather
    current_weather = WeatherService.get_weather_data(user.latitude, user.longitude)
    if not current_weather:
        return Response({
            'error': 'Failed to fetch current weather data'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Generate predictions
    predictions = WeatherPredictionModel.predict_weather(current_weather, days_ahead)
    
    # Save predictions to database
    for prediction in predictions:
        WeatherPrediction.objects.create(
            user=user,
            location=user.location,
            prediction_date=prediction['date'],
            predicted_temperature=prediction['temperature'],
            predicted_humidity=prediction['humidity'],
            predicted_pressure=prediction['pressure'],
            predicted_wind_speed=prediction['wind_speed'],
            predicted_condition=prediction['condition'],
            confidence_score=prediction['confidence']
        )
    
    return Response({
        'location': user.location,
        'current_weather': {
            'temperature': current_weather['main']['temp'],
            'humidity': current_weather['main']['humidity'],
            'pressure': current_weather['main']['pressure'],
            'wind_speed': current_weather['wind']['speed'],
            'condition': current_weather['weather'][0]['description']
        },
        'predictions': predictions,
        'model_info': {
            'type': 'Simple Linear Regression',
            'features_used': ['temperature', 'humidity', 'pressure', 'wind_speed']
        }
    })
