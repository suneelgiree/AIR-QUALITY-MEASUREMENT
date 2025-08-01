from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import WeatherPrediction
from .serializers import WeatherPredictionSerializer
from utils.services import WeatherService, WeatherPredictionModel
from datetime import datetime

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_weather(request):
    """Get current weather for user's location or a specified location."""
    user = request.user
    location_name = request.query_params.get('location', user.location)

    if not location_name:
        return Response({'error': 'User location not available and no location specified'}, status=status.HTTP_400_BAD_REQUEST)

    lat, lon = WeatherService.geocode_location(location_name)
    if not lat or not lon:
        return Response({'error': f'Could not find location: {location_name}'}, status=status.HTTP_400_BAD_REQUEST)

    weather_data = WeatherService.get_weather_data(lat, lon)
    if not weather_data:
        return Response({'error': 'Failed to fetch weather data'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'location': location_name,
        'weather': weather_data
    })

# --- FIX: Changed to GET and simplified logic ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def weather_forecast(request):
    """AI-powered 7-day weather prediction, now correctly handling GET requests."""
    user = request.user
    # Get location from query parameter, fall back to user's default location
    location_name = request.query_params.get('location', user.location)
    days_ahead = 7  # The frontend is designed for a 7-day forecast

    if not location_name:
        return Response({'error': 'User location not available and no location specified'}, status=status.HTTP_400_BAD_REQUEST)

    # Use the service to geocode the location name
    lat, lon = WeatherService.geocode_location(location_name)
    if lat is None or lon is None:
        return Response({'error': f'Could not find location: {location_name}'}, status=status.HTTP_404_NOT_FOUND)

    # Get current weather for the specified location to use as a base for prediction
    current_weather = WeatherService.get_weather_data(lat, lon)
    if not current_weather:
        return Response({
            'error': 'Failed to fetch current weather data for prediction base.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Generate predictions using the model
    predictions = WeatherPredictionModel.predict_weather(current_weather, days_ahead)
    
    # Save predictions to the database (this can be done in the background)
    for prediction in predictions:
        WeatherPrediction.objects.create(
            user=user,
            location=location_name,
            prediction_date=prediction['date'],
            predicted_temperature=prediction['temperature'],
            predicted_humidity=prediction['humidity'],
            predicted_pressure=prediction['pressure'],
            predicted_wind_speed=prediction['wind_speed'],
            predicted_condition=prediction['condition'],
            confidence_score=prediction['confidence']
        )
    
    # --- FIX: Return the predictions array directly ---
    # The frontend expects a JSON array: [ {...}, {...}, ... ]
    return Response(predictions)