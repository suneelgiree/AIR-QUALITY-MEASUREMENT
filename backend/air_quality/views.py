from django.conf import settings
from rest_framework import status, generics, views, serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
import logging
import json
import requests
from django.http import JsonResponse

from authentication.permissions import HasAPIKey
from .models import AirQualityReading, AQIForecast, SensorFileUpload
from .serializers import (
    SensorFileUploadSerializer, 
    AQIForecastSerializer
)
from utils.services import WeatherService

logger = logging.getLogger(__name__)


# --- FIX: Define the correct AirQualityReadingSerializer directly in the view ---
# This ensures the database field `pm2_5` is correctly mapped to the JSON output field `pm25`.
class AirQualityReadingSerializer(serializers.ModelSerializer):
    # Explicitly define the field to map `pm25` (JSON) from `pm2_5` (database model)
    pm25 = serializers.FloatField(source='pm2_5', read_only=True)

    class Meta:
        model = AirQualityReading
        # Ensure all necessary fields are included in the API response
        fields = [
            'id', 'user', 'source', 'location_name', 'latitude', 'longitude',
            'timestamp', 'aqi', 'pm25', 'pm10', 'co', 'no2', 'so2', 'o3',
            'category', 'raw_data'
        ]
        read_only_fields = ['id', 'timestamp', 'user']


# --- PUBLIC-FACING API VIEWS ---

class LatestAQIView(generics.RetrieveAPIView):
    """
    An unauthenticated API endpoint to retrieve the single most recent air quality reading.
    """
    serializer_class = AirQualityReadingSerializer # Use the corrected serializer
    permission_classes = [AllowAny]

    def get_object(self):
        """Overrides default lookup to return the latest reading."""
        return AirQualityReading.objects.order_by('-timestamp').first()


class LatestForecastView(generics.RetrieveAPIView):
    """
    An unauthenticated API endpoint that returns the most recently generated 7-day forecast,
    complete with all its data points.
    """
    serializer_class = AQIForecastSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        """Overrides default lookup to return the latest forecast."""
        return AQIForecast.objects.prefetch_related('data_points').order_by('-generated_at').first()


class PublicHistoryView(generics.ListAPIView):
    """
    Provides a list of the most recent public AirQualityReadings, not filtered by user.
    This is used by the frontend as a fallback if a user has no personal history.
    """
    permission_classes = [AllowAny]
    serializer_class = AirQualityReadingSerializer # Use the corrected serializer
    queryset = AirQualityReading.objects.all().order_by('-timestamp')[:10]


# --- USER-AUTHENTICATED AND SENSOR API VIEWS ---

class AirQualityRecordView(views.APIView):
    """
    Handles fetching and creating Air Quality Readings for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Returns the most recent AirQualityReading for the authenticated user."""
        try:
            latest_reading = AirQualityReading.objects.filter(user=request.user).latest('timestamp')
            serializer = AirQualityReadingSerializer(latest_reading) # Use the corrected serializer
            return Response(serializer.data)
        except AirQualityReading.DoesNotExist:
            return Response({"message": "No air quality data found for this user."}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        """Creates a new AirQualityReading from an external API based on user's location."""
        user = request.user
        if not user.latitude or not user.longitude:
            return Response({'error': 'User profile must have latitude and longitude set.'}, status=status.HTTP_400_BAD_REQUEST)

        air_quality_data = WeatherService.get_air_quality_data(user.latitude, user.longitude)
        if not air_quality_data:
            return Response({'error': 'Failed to fetch air quality data from external API.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # --- FIX: Save to the correct `pm2_5` model field ---
        reading = AirQualityReading.objects.create(
            user=user, source='api', location_name=user.location, latitude=user.latitude,
            longitude=user.longitude, aqi=air_quality_data.get('aqi'),
            pm2_5=air_quality_data.get('pm25'), # Corrected field name
            pm10=air_quality_data.get('pm10'),
            co=air_quality_data.get('co'), no2=air_quality_data.get('no2'),
            so2=air_quality_data.get('so2'), o3=air_quality_data.get('o3'),
            category=air_quality_data.get('category'), raw_data=air_quality_data
        )
        serializer = AirQualityReadingSerializer(reading)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AirQualityHistoryView(generics.ListAPIView):
    """
    Provides a list of historical AirQualityReadings for the authenticated user
    directly from the database.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AirQualityReadingSerializer # Use the corrected serializer

    def get_queryset(self):
        """Filters readings based on the authenticated user and optional query params."""
        user = self.request.user
        queryset = AirQualityReading.objects.filter(user=user)
        source = self.request.query_params.get('source')
        if source in ['api', 'sensor']:
            queryset = queryset.filter(source=source)
        return queryset.order_by('-timestamp')[:100]


class SensorFileUploadView(generics.CreateAPIView):
    """
    Endpoint for devices to upload sensor data files, secured with an API Key.
    """
    serializer_class = SensorFileUploadSerializer
    permission_classes = [HasAPIKey]

    def perform_create(self, serializer):
        validated_data = serializer.validated_data
        filename = validated_data['filename']
        data_content = validated_data['data']
        user = self.request.user

        try:
            logger.info(f"User '{user.email}' successfully uploaded file '{filename}'.")
        except Exception as e:
            logger.error(f"Error ingesting sensor file '{filename}' for user '{user.email}': {e}", exc_info=True)
            raise serializers.ValidationError({'error': 'Failed to process file data.', 'detail': str(e)})


# --- PROXY VIEW TO FIX CORS ERROR ---
class ExternalAQIProxyView(views.APIView):
    """
    A proxy view to fetch data from the external AWS Lambda function.
    This solves the browser's CORS issue by having the server make the request.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        external_url = 'https://f2whboqd6l.execute-api.us-east-1.amazonaws.com/default/getAQIData'
        try:
            response = requests.get(external_url, timeout=10)
            response.raise_for_status()
            data = json.loads(response.text)
            return JsonResponse(data, safe=False)
        except requests.exceptions.RequestException as e:
            logger.error(f"Proxy view failed to fetch data from external source: {e}")
            return JsonResponse({'error': f'Failed to fetch data from external source: {e}'}, status=502)
        except json.JSONDecodeError as e:
            logger.error(f"Proxy view failed to decode JSON from external source: {e}")
            return JsonResponse({'error': 'Failed to decode response from external source.'}, status=502)