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

# Add simulation and prediction directories to Python path
BASE_DIR = Path(settings.BASE_DIR)
SIMULATION_DIR = BASE_DIR.parent / 'simulation'
PREDICTION_DIR = BASE_DIR.parent / 'prediction'

if str(SIMULATION_DIR) not in sys.path:
    sys.path.append(str(SIMULATION_DIR))

if str(PREDICTION_DIR) not in sys.path:
    sys.path.append(str(PREDICTION_DIR))

# Import from simulation directory - use the class-based implementation
try:
    from AQI_Calculator import AQICalculator
except ImportError as e:
    print(f"Error importing AQI_Calculator: {e}")
    # No fallback needed since we'll handle this in the AQICalculatorService

class WeatherService:
    @staticmethod
    def geocode_location(location):
        """Convert location name to coordinates"""
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
        """Fetch air quality data from OpenWeatherMap API"""
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
        """Fetch weather data from OpenWeatherMap API"""
        try:
            api_key = settings.OPENWEATHER_API_KEY
            url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
            response = requests.get(url)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"Error fetching weather data: {e}")
        return None

class WeatherPredictionModel:
    @staticmethod
    def predict_weather(current_weather, days_ahead):
        """Simple weather prediction model"""
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
        """Get or create AQI calculator instance"""
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
        """Read sensor data from simulation files or real sensors"""
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
                pass # In production, implement real sensor reading here
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
        """Read air quality data from real hardware sensor (Arduino)"""
        try:
            ser = serial.Serial(serial_port, baudrate, timeout=timeout)
            time.sleep(2)  # Wait for Arduino to reset
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
        """Calculate AQI using data from sensors"""
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
        """Get list of available prediction models"""
        models = []
        for file in PREDICTION_DIR.glob('*.pkl'):
            if file.name.endswith('_model.pkl'):
                models.append(file.name)
        return models
    
    @staticmethod
    def predict_aqi(aqi_data, model_name='ridge_model.pkl'):
        try:
            model_path = PREDICTION_DIR / model_name
            if not model_path.exists():
                print(f"Model file not found: {model_path}")
                return {'error': f"Model not found: {model_name}"}
            model = joblib.load(model_path)
            features = [
                aqi_data.get('aqi', 0),
                aqi_data.get('pm25', 0),
                aqi_data.get('pm10', 0),
                aqi_data.get('temperature', 25),
                aqi_data.get('humidity', 50),
                aqi_data.get('pressure', 1013)
            ]
            X = np.array(features).reshape(1, -1)
            prediction = model.predict(X)[0]
            return {
                'predicted_aqi_24h': float(prediction),
                'model_used': model_name
            }
        except Exception as e:
            import traceback
            print(f"Error predicting with {model_name}: {str(e)}")
            print(traceback.format_exc())
            return {'error': str(e)}