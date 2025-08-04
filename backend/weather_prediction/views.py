from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
# Import just the top-level services
from utils.services import WeatherService, PredictionService 

class WeatherForecastView(APIView):
    """Provides a real 7-day weather forecast using the Open-Meteo API."""
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        lat = user.latitude
        lon = user.longitude

        if not lat or not lon:
            return Response(
                {"error": "User profile must have latitude and longitude set."},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Note: This now calls the refined weather service method
        forecast_data = WeatherService.get_7_day_weather_forecast(lat, lon)
        if forecast_data is None:
            return Response(
                {"error": "Could not retrieve weather forecast data at this time."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        return Response({"forecast": forecast_data})

class AQIPredictionView(APIView):
    """
    Provides a competitive 7-day AQI forecast by running all available models
    and highlighting the best result.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        lat = user.latitude
        lon = user.longitude

        if not lat or not lon:
            return Response(
                {"error": "User profile must have latitude and longitude for prediction."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Call the new top-level method to get the complete analysis
        prediction_analysis = PredictionService.get_best_aqi_forecast(lat, lon)

        if not prediction_analysis or 'error' in prediction_analysis:
            return Response(
                prediction_analysis or {"error": "Could not generate AQI prediction."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(prediction_analysis)