import requests
import numpy as np
from datetime import datetime, timedelta
from django.conf import settings

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
            # Simple prediction with some randomness
            temp_change = np.random.normal(0, 2) * day * 0.5
            humidity_change = np.random.normal(0, 5) * day * 0.3
            pressure_change = np.random.normal(0, 10) * day * 0.2
            
            predicted_temp = current_temp + temp_change
            predicted_humidity = max(0, min(100, current_humidity + humidity_change))
            predicted_pressure = current_pressure + pressure_change
            predicted_wind = max(0, current_wind_speed + np.random.normal(0, 2))
            
            # Simple weather condition prediction
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
