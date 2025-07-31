from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
import logging
import json
import csv
from io import StringIO

from .models import AirQualityData, AirQualityRecord, AQIPrediction
from .serializers import AirQualityDataSerializer, AirQualityRecordSerializer
from utils.services import WeatherService, AQICalculatorService, PredictionService
from authentication.models import CustomUser

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_air_quality(request):
    """Update air quality data for user's location using OpenWeatherMap API"""
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
    record = AirQualityData.objects.create(
        user=user,
        location=user.location,
        **air_quality
    )

    # Add prediction capability to existing view
    try:
        # Get previous AQI for user if available
        previous_record = AirQualityRecord.objects.filter(user=user).order_by('-timestamp').first()
        previous_aqi = previous_record.aqi if previous_record else 0

        # Prepare full feature set for prediction
        features = PredictionService.fetch_full_feature_set(user.latitude, user.longitude, previous_aqi=previous_aqi)
        # Now predict for 7 days (24h increments)
        predictions = []
        for hours_ahead in [24, 48, 72, 96, 120, 144, 168]:
            pred = PredictionService.predict_aqi_from_features(features, model_name='svr_model.pkl', hours_ahead=hours_ahead)
            predictions.append({
                "hours_ahead": hours_ahead,
                "predicted_aqi": pred.get('predicted_aqi', pred.get('predicted_aqi_24h', None)),
                "model_used": "svr_model.pkl",
                "confidence": pred.get('confidence', None)
            })
        air_quality['predictions'] = predictions
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        air_quality['prediction_error'] = str(e)

    return Response({
        'message': 'Air quality data updated successfully',
        'data': air_quality
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def air_quality_history(request):
    """Get air quality history for user from OpenWeatherMap data"""
    history = AirQualityData.objects.filter(user=request.user).order_by('-timestamp')[:30]
    serializer = AirQualityDataSerializer(history, many=True)
    return Response(serializer.data)


class AirQualityUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Update air quality using sensor data (simulation, API, or real sensor) and return 7-day predictions"""
        try:
            use_api = request.data.get('use_api', False)
            use_real_sensor = request.data.get('use_real_sensor', False)
            user = request.user

            if use_api:
                if not user.latitude or not user.longitude:
                    return Response({'error': 'User location not available'}, status=status.HTTP_400_BAD_REQUEST)
                air_quality = WeatherService.get_air_quality_data(user.latitude, user.longitude)
                if not air_quality:
                    return Response({'error': 'Failed to fetch air quality data'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                sensor_data = {
                    'pm25': air_quality['pm25'],
                    'pm10': air_quality['pm10'],
                }
                weather = WeatherService.get_weather_data(user.latitude, user.longitude)
                if weather:
                    sensor_data['temperature'] = weather['main'].get('temp')
                    sensor_data['humidity'] = weather['main'].get('humidity')
                    sensor_data['pressure'] = weather['main'].get('pressure')
                aqi_data = {
                    'aqi': air_quality['aqi'],
                    'pm25': air_quality['pm25'],
                    'pm10': air_quality['pm10'],
                    'category': 'Unknown',
                    'temperature': sensor_data.get('temperature'),
                    'humidity': sensor_data.get('humidity'),
                    'pressure': sensor_data.get('pressure'),
                    'location': user.location
                }
                data_source = 'OpenWeatherMap API'
            elif use_real_sensor:
                # Read from real hardware sensor
                sensor_data = AQICalculatorService.read_real_sensor_data()
                if not sensor_data:
                    return Response({'error': 'Failed to read from real sensor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                aqi_data = AQICalculatorService.calculate_aqi_from_data(sensor_data)
                aqi_data['location'] = user.location
                data_source = 'Real Sensor'
            else:
                # Use simulation data
                sensor_data = AQICalculatorService.read_sensor_data(use_simulated=True)
                aqi_data = AQICalculatorService.calculate_aqi_from_data(sensor_data)
                aqi_data['location'] = user.location
                data_source = 'Local Sensors (Simulation)'

            record = AirQualityRecord.objects.create(
                user=user,
                aqi=aqi_data['aqi'],
                pm25=aqi_data['pm25'],
                pm10=aqi_data['pm10'],
                temperature=aqi_data.get('temperature'),
                humidity=aqi_data.get('humidity'),
                pressure=aqi_data.get('pressure'),
                category=aqi_data.get('category', 'Unknown'),
                location=aqi_data.get('location', 'Unknown')
            )

            # Predict AQI for next 7 days in 24h increments using SVR model
            previous_record = AirQualityRecord.objects.filter(user=user).order_by('-timestamp').first()
            previous_aqi = previous_record.aqi if previous_record else 0
            lat = getattr(user, 'latitude', None)
            lon = getattr(user, 'longitude', None)
            features = PredictionService.fetch_full_feature_set(lat, lon, previous_aqi=previous_aqi)

            predictions = []
            for hours_ahead in [24, 48, 72, 96, 120, 144, 168]:
                pred = PredictionService.predict_aqi_from_features(features, model_name='svr_model.pkl', hours_ahead=hours_ahead)
                AQIPrediction.objects.create(
                    air_quality_record=record,
                    hours_ahead=hours_ahead,
                    predicted_aqi=pred.get('predicted_aqi', pred.get('predicted_aqi_24h', None)),
                    model_used="svr_model.pkl"
                )
                predictions.append({
                    "hours_ahead": hours_ahead,
                    "predicted_aqi": pred.get('predicted_aqi', pred.get('predicted_aqi_24h', None)),
                    "model_used": "svr_model.pkl",
                    "confidence": pred.get('confidence', None)
                })

            response_data = {
                **aqi_data,
                'id': record.id,
                'predictions': predictions,
                'data_source': data_source
            }

            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error updating air quality: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to update air quality data", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AirQualityHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get air quality history from local sensor records"""
        try:
            records = AirQualityRecord.objects.filter(user=request.user).order_by('-timestamp')[:100]
            serializer = AirQualityRecordSerializer(records, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching air quality history: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch air quality history", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AirQualityDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get comprehensive air quality dashboard data combining API and sensor data"""
        try:
            latest_sensor_record = AirQualityRecord.objects.filter(user=request.user).order_by('-timestamp').first()
            sensor_data = AirQualityRecordSerializer(latest_sensor_record).data if latest_sensor_record else None

            latest_api_record = AirQualityData.objects.filter(user=request.user).order_by('-timestamp').first()
            api_data = AirQualityDataSerializer(latest_api_record).data if latest_api_record else None

            sensor_history = AirQualityRecord.objects.filter(user=request.user).order_by('-timestamp')[:10]
            sensor_history_data = AirQualityRecordSerializer(sensor_history, many=True).data

            api_history = AirQualityData.objects.filter(user=request.user).order_by('-timestamp')[:10]
            api_history_data = AirQualityDataSerializer(api_history, many=True).data

            dashboard_data = {
                'current': {
                    'sensor_data': sensor_data,
                    'api_data': api_data,
                },
                'history': {
                    'sensor_data': sensor_history_data,
                    'api_data': api_history_data,
                }
            }

            return Response(dashboard_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error retrieving dashboard data: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to retrieve dashboard data", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SensorFileUploadView(APIView):
    permission_classes = [AllowAny]  # Change to IsAuthenticated if you want to secure the endpoint

    def post(self, request):
        """
        Accept sensor logs (JSON or CSV) uploaded from device/cloud.
        Expected payload:
          - filename (.json or .csv)
          - timestamp (when generated)
          - data (file content as string)
          - location (optional: device/location name)
        """
        filename = request.data.get('filename')
        timestamp = request.data.get('timestamp')
        data = request.data.get('data')
        device_location = request.data.get('location', 'Unknown')

        if not filename or not data:
            return Response({'error': 'Missing filename or data.'}, status=status.HTTP_400_BAD_REQUEST)

        records_created = 0

        try:
            # Use a default/system user for sensor uploads, or map device_id to user
            user = CustomUser.objects.first()

            if filename.endswith('.json'):
                sensor_data = json.loads(data)
                if isinstance(sensor_data, dict):
                    sensor_data = [sensor_data]
                for entry in sensor_data:
                    AirQualityRecord.objects.create(
                        user=user,
                        aqi=entry.get('overall_aqi', 0),
                        pm25=entry.get('concentrations', {}).get('PM2.5', 0),
                        pm10=entry.get('concentrations', {}).get('PM10', 0),
                        temperature=None,
                        humidity=None,
                        pressure=None,
                        category=entry.get('category_info', {}).get('category', 'Unknown'),
                        location=device_location,
                        timestamp=timestamp or None  # Or entry['timestamp'] if available
                    )
                    records_created += 1

            elif filename.endswith('.csv'):
                reader = csv.reader(StringIO(data))
                for row in reader:
                    # Example: timestamp, pm1, pm25, pm10, aqi, dom_pollutant, dom_conc
                    if len(row) < 7:
                        continue
                    AirQualityRecord.objects.create(
                        user=user,
                        aqi=row[4],
                        pm25=row[2],
                        pm10=row[3],
                        temperature=None,
                        humidity=None,
                        pressure=None,
                        category=row[5],
                        location=device_location,
                        timestamp=row[0]
                    )
                    records_created += 1

            return Response({
                'message': f"{records_created} records ingested from {filename}.",
                'filename': filename,
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error ingesting sensor file: {str(e)}", exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)