import requests
import os
import sys
import json
import numpy as np
import joblib
import serial
import re
import time
from pathlib import Path
from datetime import datetime, timedelta
from django.conf import settings

BASE_DIR = Path(settings.BASE_DIR)
SIMULATION_DIR = BASE_DIR.parent / 'simulation'
PREDICTION_DIR = BASE_DIR.parent / 'prediction'

if str(SIMULATION_DIR) not in sys.path:
    sys.path.append(str(SIMULATION_DIR))

if str(PREDICTION_DIR) not in sys.path:
    sys.path.append(str(PREDICTION_DIR))

try:
    from AQI_Calculator import AQICalculator
except ImportError as e:
    print(f"Error importing AQI_Calculator: {e}")

class WeatherService:
    @staticmethod
    def geocode_location(location):
        try:
            api_key = settings.OPENWEATHER_API_KEY
            url = f"http://api.openweathermap.org/geo/1.0/direct?q={location}&limit=1&appid={api_key}"
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                if data:
                    return data[0]['lat'], data[0]['lon']
        except Exception as e:
            print(f"Error geocoding location: {e}")
        return None, None

    @staticmethod
    def get_air_quality_data(lat, lon):
        try:
            api_key = settings.OPENWEATHER_API_KEY
            url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={api_key}"
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                return {
                    'aqi': data['list'][0]['main']['aqi'],
                    'pm25': data['list'][0]['components']['pm2_5'],
                    'pm10': data['list'][0]['components']['pm10'],
                    'co': data['list'][0]['components']['co'],
                    'no2': data['list'][0]['components']['no2'],
                    'so2': data['list'][0]['components']['so2'],
                    'o3': data['list'][0]['components']['o3']
                }
        except Exception as e:
            print(f"Error fetching air quality data: {e}")
        return None

    @staticmethod
    def get_weather_data(lat, lon):
        try:
            api_key = settings.OPENWEATHER_API_KEY
            url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
            response = requests.get(url)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"Error fetching weather data: {e}")
        return None

    @staticmethod
    def get_additional_weather_features(lat, lon):
        return {
            'dew_point_2m (°C)': 0,
            'apparent_temperature (°C)': 0,
            'precipitation (mm)': 0,
            'rain (mm)': 0,
            'snowfall (cm)': 0,
            'snow_depth (m)': 0,
            'weather_code (wmo code)': 0,
            'surface_pressure (hPa)': 0,
            'cloud_cover (%)': 0,
            'cloud_cover_low (%)': 0,
            'cloud_cover_mid (%)': 0,
            'cloud_cover_high (%)': 0,
            'et0_fao_evapotranspiration (mm)': 0,
            'vapour_pressure_deficit (kPa)': 0,
            'wind_speed_100m (km/h)': 0,
            'wind_direction_100m (°)': 0,
            'soil_temperature_0_to_7cm (°C)': 0,
            'soil_temperature_7_to_28cm (°C)': 0,
            'soil_temperature_28_to_100cm (°C)': 0,
            'soil_temperature_100_to_255cm (°C)': 0,
            'soil_moisture_0_to_7cm (m³/m³)': 0,
            'soil_moisture_7_to_28cm (m³/m³)': 0,
            'soil_moisture_28_to_100cm (m³/m³)': 0,
            'soil_moisture_100_to_255cm (m³/m³)': 0,
        }

class WeatherPredictionModel:
    @staticmethod
    def predict_weather(current_weather, days_ahead):
        predictions = []
        current_temp = current_weather['main']['temp']
        current_humidity = current_weather['main']['humidity']
        current_pressure = current_weather['main']['pressure']
        current_wind_speed = current_weather['wind']['speed']
        for day in range(1, days_ahead + 1):
            temp_change = np.random.normal(0, 2) * day * 0.5
            humidity_change = np.random.normal(0, 5) * day * 0.3
            pressure_change = np.random.normal(0, 10) * day * 0.2
            predicted_temp = current_temp + temp_change
            predicted_humidity = max(0, min(100, current_humidity + humidity_change))
            predicted_pressure = current_pressure + pressure_change
            predicted_wind = max(0, current_wind_speed + np.random.normal(0, 2))
            if predicted_temp < 0:
                condition = "Snow"
            elif predicted_humidity > 80 and predicted_temp > 10:
                condition = "Rain"
            elif predicted_humidity < 30:
                condition = "Clear"
            else:
                condition = "Cloudy"
            prediction_date = datetime.now() + timedelta(days=day)
            predictions.append({
                'date': prediction_date.date(),
                'temperature': round(predicted_temp, 1),
                'humidity': round(predicted_humidity, 1),
                'pressure': round(predicted_pressure, 1),
                'wind_speed': round(predicted_wind, 1),
                'condition': condition,
                'confidence': max(0.6, 0.9 - (day * 0.1))
            })
        return predictions

class AQICalculatorService:
    _calculator = None

    @classmethod
    def get_calculator(cls):
        if cls._calculator is None:
            try:
                cls._calculator = AQICalculator()
            except NameError:
                print("AQICalculator class not available, creating minimal implementation")
                from dataclasses import dataclass
                @dataclass
                class MinimalAQICalculator:
                    def calculate_aqi(self, pm25=None, pm10=None):
                        if pm25 is not None:
                            pm25_aqi = min(500, int(pm25 * 2))
                        else:
                            pm25_aqi = 0
                        if pm10 is not None:
                            pm10_aqi = min(500, int(pm10))
                        else:
                            pm10_aqi = 0
                        overall_aqi = max(pm25_aqi, pm10_aqi)
                        return {
                            'timestamp': datetime.now().isoformat(),
                            'overall_aqi': overall_aqi,
                            'dominant_pollutant': 'PM2.5' if pm25_aqi >= pm10_aqi else 'PM10',
                            'dominant_concentration': pm25 if pm25_aqi >= pm10_aqi else pm10,
                            'individual_aqis': {'PM2.5': pm25_aqi, 'PM10': pm10_aqi},
                            'concentrations': {'PM2.5': pm25, 'PM10': pm10}
                        }
                    def get_aqi_category(self, aqi_value):
                        if aqi_value <= 50:
                            return {'category': 'Good', 'color': 'Green'}
                        elif aqi_value <= 100:
                            return {'category': 'Moderate', 'color': 'Yellow'}
                        elif aqi_value <= 150:
                            return {'category': 'Unhealthy for Sensitive Groups', 'color': 'Orange'}
                        elif aqi_value <= 200:
                            return {'category': 'Unhealthy', 'color': 'Red'}
                        elif aqi_value <= 300:
                            return {'category': 'Very Unhealthy', 'color': 'Purple'}
                        else:
                            return {'category': 'Hazardous', 'color': 'Maroon'}
                cls._calculator = MinimalAQICalculator()
        return cls._calculator

    @staticmethod
    def read_sensor_data(use_simulated=True):
        try:
            data = {}
            if use_simulated:
                pms_file = SIMULATION_DIR / 'pms7003_data.json'
                if pms_file.exists():
                    with open(pms_file, 'r') as f:
                        pms_data = json.load(f)
                        if isinstance(pms_data, list) and pms_data:
                            latest = pms_data[-1]
                            data['pm25'] = latest.get('pm2_5_standard', 0)
                            data['pm10'] = latest.get('pm10_standard', 0)
                        else:
                            data['pm25'] = pms_data.get('pm2_5_standard', pms_data.get('pm25', 0))
                            data['pm10'] = pms_data.get('pm10_standard', pms_data.get('pm10', 0))
                bme_file = SIMULATION_DIR / 'bme280_data.json'
                if bme_file.exists():
                    with open(bme_file, 'r') as f:
                        bme_data = json.load(f)
                        if isinstance(bme_data, list) and bme_data:
                            latest = bme_data[-1]
                            data['temperature'] = latest.get('temperature')
                            data['humidity'] = latest.get('humidity')
                            data['pressure'] = latest.get('pressure')
                        else:
                            data['temperature'] = bme_data.get('temperature')
                            data['humidity'] = bme_data.get('humidity')
                            data['pressure'] = bme_data.get('pressure')
            else:
                pass
            data['timestamp'] = datetime.now().isoformat()
            return data
        except Exception as e:
            print(f"Error reading sensor data: {str(e)}")
            return {
                'pm25': 15.0,
                'pm10': 30.0,
                'temperature': 25.0,
                'humidity': 50.0,
                'pressure': 1013.0,
                'timestamp': datetime.now().isoformat()
            }

    @staticmethod
    def read_real_sensor_data(serial_port='/dev/ttyUSB0', baudrate=9600, timeout=2):
        try:
            ser = serial.Serial(serial_port, baudrate, timeout=timeout)
            time.sleep(2)
            line = ser.readline().decode(errors='ignore').strip()
            ser.close()
            match = re.findall(r"PM1\.0:\s*(\d+)\s*µg/m3\s*\|\s*PM2\.5:\s*(\d+)\s*µg/m3\s*\|\s*PM10:\s*(\d+)\s*µg/m3", line)
            if match:
                pm1, pm25, pm10 = map(float, match[0])
                return {
                    'pm25': pm25,
                    'pm10': pm10,
                    'pm1_0': pm1,
                    'timestamp': datetime.now().isoformat()
                }
        except Exception as e:
            print(f"Error reading sensor: {e}")
        return None

    @classmethod
    def calculate_aqi_from_data(cls, sensor_data):
        try:
            calculator = cls.get_calculator()
            pm25 = float(sensor_data.get('pm25', 0))
            pm10 = float(sensor_data.get('pm10', 0))
            aqi_result = calculator.calculate_aqi(pm25=pm25, pm10=pm10)
            category_info = calculator.get_aqi_category(aqi_result['overall_aqi'])
            return {
                'aqi': aqi_result['overall_aqi'],
                'aqi_pm25': aqi_result['individual_aqis'].get('PM2.5', 0),
                'aqi_pm10': aqi_result['individual_aqis'].get('PM10', 0),
                'pm25': pm25,
                'pm10': pm10,
                'category': category_info['category'],
                'color': category_info['color'],
                'description': category_info.get('description', ''),
                'temperature': sensor_data.get('temperature'),
                'humidity': sensor_data.get('humidity'),
                'pressure': sensor_data.get('pressure'),
                'timestamp': sensor_data.get('timestamp')
            }
        except Exception as e:
            import traceback
            print(f"Error calculating AQI: {str(e)}")
            print(traceback.format_exc())
            raise

class PredictionService:
    @staticmethod
    def get_available_models():
        models = []
        for file in PREDICTION_DIR.glob('*.pkl'):
            if file.name.endswith('_model.pkl'):
                models.append(file.name)
        return models

    @staticmethod
    def fetch_full_feature_set(lat, lon, previous_aqi=0, hours_ahead=24):
        """
        Fetch and compile all 31 features for AQI prediction.
        Optionally adjust features for hours_ahead (stub: same features for each day).
        """
        features = {
            'temperature_2m (°C)': 0, 'relative_humidity_2m (%)': 0, 'dew_point_2m (°C)': 0,
            'apparent_temperature (°C)': 0, 'precipitation (mm)': 0, 'rain (mm)': 0,
            'snowfall (cm)': 0, 'snow_depth (m)': 0, 'weather_code (wmo code)': 0,
            'pressure_msl (hPa)': 0, 'surface_pressure (hPa)': 0, 'cloud_cover (%)': 0,
            'cloud_cover_low (%)': 0, 'cloud_cover_mid (%)': 0, 'cloud_cover_high (%)': 0,
            'et0_fao_evapotranspiration (mm)': 0, 'vapour_pressure_deficit (kPa)': 0,
            'wind_speed_10m (km/h)': 0, 'wind_speed_100m (km/h)': 0,
            'wind_direction_10m (°)': 0, 'wind_direction_100m (°)': 0,
            'wind_gusts_10m (km/h)': 0, 'soil_temperature_0_to_7cm (°C)': 0,
            'soil_temperature_7_to_28cm (°C)': 0, 'soil_temperature_28_to_100cm (°C)': 0,
            'soil_temperature_100_to_255cm (°C)': 0, 'soil_moisture_0_to_7cm (m³/m³)': 0,
            'soil_moisture_7_to_28cm (m³/m³)': 0, 'soil_moisture_28_to_100cm (m³/m³)': 0,
            'soil_moisture_100_to_255cm (m³/m³)': 0, 'prev_us_aqi': previous_aqi
        }
        weather = WeatherService.get_weather_data(lat, lon)
        if weather:
            main = weather.get('main', {})
            wind = weather.get('wind', {})
            clouds = weather.get('clouds', {})
            rain = weather.get('rain', {})
            snow = weather.get('snow', {})
            weather_code = weather.get('weather', [{}])[0].get('id', 0)
            features['temperature_2m (°C)'] = main.get('temp', 0)
            features['relative_humidity_2m (%)'] = main.get('humidity', 0)
            features['pressure_msl (hPa)'] = main.get('pressure', 0)
            features['wind_speed_10m (km/h)'] = wind.get('speed', 0)
            features['wind_direction_10m (°)'] = wind.get('deg', 0)
            features['wind_gusts_10m (km/h)'] = wind.get('gust', 0)
            features['cloud_cover (%)'] = clouds.get('all', 0)
            features['rain (mm)'] = rain.get('1h', 0)
            features['snowfall (cm)'] = snow.get('1h', 0)
            features['weather_code (wmo code)'] = weather_code
        additional = WeatherService.get_additional_weather_features(lat, lon)
        for k, v in additional.items():
            features[k] = v
        # Optionally adjust features for hours_ahead (if you have time-series forecasting)
        features['hours_ahead'] = hours_ahead
        return features

    @staticmethod
    def predict_aqi_from_features(features, model_name='ridge_model.pkl', hours_ahead=24):
        """
        Predict AQI using features for the specified prediction horizon.
        """
        try:
            model_path = PREDICTION_DIR / model_name
            if not model_path.exists():
                print(f"Model file not found: {model_path}")
                return {'error': f"Model not found: {model_name}"}
            model = joblib.load(model_path)
            feature_names = [
                'temperature_2m (°C)', 'relative_humidity_2m (%)', 'dew_point_2m (°C)', 'apparent_temperature (°C)',
                'precipitation (mm)', 'rain (mm)', 'snowfall (cm)', 'snow_depth (m)',
                'weather_code (wmo code)', 'pressure_msl (hPa)', 'surface_pressure (hPa)',
                'cloud_cover (%)', 'cloud_cover_low (%)', 'cloud_cover_mid (%)', 'cloud_cover_high (%)',
                'et0_fao_evapotranspiration (mm)', 'vapour_pressure_deficit (kPa)', 'wind_speed_10m (km/h)',
                'wind_speed_100m (km/h)', 'wind_direction_10m (°)', 'wind_direction_100m (°)',
                'wind_gusts_10m (km/h)', 'soil_temperature_0_to_7cm (°C)', 'soil_temperature_7_to_28cm (°C)',
                'soil_temperature_28_to_100cm (°C)', 'soil_temperature_100_to_255cm (°C)',
                'soil_moisture_0_to_7cm (m³/m³)', 'soil_moisture_7_to_28cm (m³/m³)',
                'soil_moisture_28_to_100cm (m³/m³)', 'soil_moisture_100_to_255cm (m³/m³)',
                'prev_us_aqi', 'hours_ahead'
            ]
            X = np.array([features[name] for name in feature_names]).reshape(1, -1)
            prediction = model.predict(X)[0]
            return {
                f'predicted_aqi_{hours_ahead}h': float(prediction),
                'model_used': model_name,
                'hours_ahead': hours_ahead
            }
        except Exception as e:
            import traceback
            print(f"Error predicting with {model_name}: {str(e)}")
            print(traceback.format_exc())
            return {'error': str(e)}

    @staticmethod
    def predict_aqi_7_days(lat, lon, previous_aqi=0, model_name='svr_model.pkl'):
        """
        Predict AQI for each 24h interval up to 7 days ahead.
        Returns a list of predictions for [24, 48, ..., 168] hours.
        """
        predictions = []
        for hours_ahead in [24, 48, 72, 96, 120, 144, 168]:
            features = PredictionService.fetch_full_feature_set(lat, lon, previous_aqi=previous_aqi, hours_ahead=hours_ahead)
            prediction = PredictionService.predict_aqi_from_features(features, model_name=model_name, hours_ahead=hours_ahead)
            predictions.append({
                "hours_ahead": hours_ahead,
                "predicted_aqi": prediction.get(f'predicted_aqi_{hours_ahead}h', prediction.get('predicted_aqi_24h', None)),
                "model_used": prediction.get("model_used", model_name),
                "confidence": prediction.get("confidence", None)
            })
        return predictions