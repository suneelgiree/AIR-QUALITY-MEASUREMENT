from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import logging

from .models import AirQualityData, AirQualityRecord, AQIPrediction
from .serializers import AirQualityDataSerializer, AirQualityRecordSerializer
from utils.services import WeatherService, AQICalculatorService, PredictionService

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
        aqi_data = {
            'aqi': air_quality['aqi'],
            'pm25': air_quality['pm25'],
            'pm10': air_quality['pm10'],
        }
        weather = WeatherService.get_weather_data(user.latitude, user.longitude)
        if weather:
            aqi_data['temperature'] = weather['main'].get('temp')
            aqi_data['humidity'] = weather['main'].get('humidity')
            aqi_data['pressure'] = weather['main'].get('pressure')
        prediction = PredictionService.predict_aqi(aqi_data)
        air_quality['prediction'] = prediction
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
        """Update air quality using sensor data (simulation, API, or real sensor)"""
        try:
            use_api = request.data.get('use_api', False)
            use_real_sensor = request.data.get('use_real_sensor', False)

            if use_api:
                user = request.user
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
                    'pressure': sensor_data.get('pressure')
                }
                data_source = 'OpenWeatherMap API'
            elif use_real_sensor:
                # Read from real hardware sensor
                sensor_data = AQICalculatorService.read_real_sensor_data()
                if not sensor_data:
                    return Response({'error': 'Failed to read from real sensor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                aqi_data = AQICalculatorService.calculate_aqi_from_data(sensor_data)
                data_source = 'Real Sensor'
            else:
                # Use simulation data
                sensor_data = AQICalculatorService.read_sensor_data(use_simulated=True)
                aqi_data = AQICalculatorService.calculate_aqi_from_data(sensor_data)
                data_source = 'Local Sensors (Simulation)'

            record = AirQualityRecord.objects.create(
                user=request.user,
                aqi=aqi_data['aqi'],
                pm25=aqi_data['pm25'],
                pm10=aqi_data['pm10'],
                temperature=aqi_data.get('temperature'),
                humidity=aqi_data.get('humidity'),
                pressure=aqi_data.get('pressure'),
                category=aqi_data['category'] if 'category' in aqi_data else 'Unknown'
            )

            prediction_models = PredictionService.get_available_models()
            if not prediction_models:
                prediction_models = ['ridge_model.pkl', 'random_forest_model.pkl']
            predictions = []
            for model_name in prediction_models[:2]:
                prediction = PredictionService.predict_aqi(aqi_data, model_name=model_name)
                if 'error' not in prediction:
                    AQIPrediction.objects.create(
                        air_quality_record=record,
                        hours_ahead=24,
                        predicted_aqi=prediction['predicted_aqi_24h'],
                        model_used=model_name
                    )
                predictions.append(prediction)

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