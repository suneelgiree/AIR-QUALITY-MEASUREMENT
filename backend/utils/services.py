# --- Standard and Third-Party Imports ---
import requests
import traceback
from django.conf import settings

# Graceful Import for the AQI Calculator Module from the 'prediction' directory
try:
    # This assumes your AQI_Calculator.py is in a directory added to PYTHONPATH
    from AQI_Calculator import AQICalculator
except ImportError:
    print("Warning: AQICalculator module not found. A fallback will be used.")
    AQICalculator = None 

# =============================================================================
# --- SERVICE CLASSES ---
# =============================================================================

class WeatherService:
    """Handles all interactions with external weather and air quality APIs."""
    OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
    
    @staticmethod
    def get_air_quality_data(lat: float, lon: float) -> dict | None:
        """
        Fetches the current air quality measurements from an external provider (e.g., OpenWeatherMap).
        This is used when a user manually requests a new reading.
        """
        try:
            # Assumes OPENWEATHER_API_KEY is in your settings.py
            api_key = settings.OPENWEATHER_API_KEY
            url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={api_key}"
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()['list'][0]
            
            components = data.get('components', {})
            aqi_data = AQICalculatorService.calculate_aqi_from_data({
                'pm25': components.get('pm2_5', 0),
                'pm10': components.get('pm10', 0),
            })
            
            # Return a structured dictionary that can be used to create an AirQualityReading
            return {
                'aqi': aqi_data.get('aqi'),
                'category': aqi_data.get('category'),
                'pm25': components.get('pm2_5'),
                'pm10': components.get('pm10'),
                'co': components.get('co'),
                'no2': components.get('no2'),
                'so2': components.get('so2'),
                'o3': components.get('o3'),
                'raw_data': data # Store the original response for reference
            }
        except (requests.RequestException, KeyError, IndexError) as e:
            print(f"Error fetching live air quality data: {e}")
            return None

    @staticmethod
    def get_7_day_weather_forecast(lat: float, lon: float) -> list | None:
        """
        Fetches a 7-day weather forecast from Open-Meteo.
        This is used exclusively by the prediction engine.
        """
        params = {
            "latitude": lat, "longitude": lon,
            "daily": ["weather_code", "temperature_2m_max", "temperature_2m_min", "apparent_temperature_max", "precipitation_sum", "rain_sum", "snowfall_sum", "wind_speed_10m_max", "wind_gusts_10m_max", "et0_fao_evapotranspiration", "vapour_pressure_deficit_max"],
            "timezone": "auto", "forecast_days": 7,
        }
        try:
            response = requests.get(WeatherService.OPEN_METEO_URL, params=params)
            response.raise_for_status()
            data = response.json().get('daily', {})
            
            forecasts, time_data = [], data.get('time', [])
            for i in range(len(time_data)):
                # Map API fields to the feature names expected by the ML models
                forecasts.append({
                    'date': data['time'][i],
                    'temperature_2m (°C)': (data['temperature_2m_max'][i] + data['temperature_2m_min'][i]) / 2,
                    'apparent_temperature (°C)': data['apparent_temperature_max'][i],
                    'precipitation (mm)': data['precipitation_sum'][i],
                    'rain (mm)': data['rain_sum'][i],
                    'snowfall (cm)': data['snowfall_sum'][i],
                    'wind_speed_10m (km/h)': data['wind_speed_10m_max'][i],
                    'wind_gusts_10m (km/h)': data['wind_gusts_10m_max'][i],
                    'et0_fao_evapotranspiration (mm)': data['et0_fao_evapotranspiration'][i],
                    'vapour_pressure_deficit (kPa)': data['vapour_pressure_deficit_max'][i],
                    'weather_code (wmo code)': data['weather_code'][i],
                })
            return forecasts
        except (requests.RequestException, KeyError) as e:
            print(f"Error fetching 7-day weather forecast: {e}")
            return None

class AQICalculatorService:
    """Calculates the US AQI standard from pollutant concentrations."""
    _calculator = None
    
    @classmethod
    def get_calculator(cls):
        """Initializes the AQI calculator, with a fallback if the custom module is not found."""
        if cls._calculator is None:
            if AQICalculator:
                cls._calculator = AQICalculator()
            else: # Provides a minimal, built-in calculator if the external one fails
                from dataclasses import dataclass
                @dataclass
                class MinimalAQICalculator:
                    pm25_breakpoints = [(0.0, 12.0, 0, 50), (12.1, 35.4, 51, 100), (35.5, 55.4, 101, 150), (55.5, 150.4, 151, 200), (150.5, 250.4, 201, 300), (250.5, 500.4, 301, 500)]
                    pm10_breakpoints = [(0, 54, 0, 50), (55, 154, 51, 100), (155, 254, 101, 150), (255, 354, 151, 200), (355, 504, 201, 500)]
                    aqi_categories = {(0, 50): "Good", (51, 100): "Moderate", (101, 150): "Unhealthy for Sensitive Groups", (151, 200): "Unhealthy", (201, 300): "Very Unhealthy", (301, 500): "Hazardous"}
                    
                    def _calc_linear(self, c, bp_lo, bp_hi, aqi_lo, aqi_hi): return round(((aqi_hi - aqi_lo) / (bp_hi - bp_lo)) * (c - bp_lo) + aqi_lo)
                    
                    def calculate_aqi_for_pollutant(self, c, breakpoints):
                        for bp_lo, bp_hi, aqi_lo, aqi_hi in breakpoints:
                            if bp_lo <= c <= bp_hi: return self._calc_linear(c, bp_lo, bp_hi, aqi_lo, aqi_hi)
                        return 500
                    
                    def calculate_aqi(self, pm25=None, pm10=None):
                        aqis = {}
                        if pm25 is not None: aqis['PM2.5'] = self.calculate_aqi_for_pollutant(pm25, self.pm25_breakpoints)
                        if pm10 is not None: aqis['PM10'] = self.calculate_aqi_for_pollutant(pm10, self.pm10_breakpoints)
                        if not aqis: return {'overall_aqi': 0, 'dominant_pollutant': 'N/A'}
                        dom = max(aqis, key=aqis.get)
                        return {'overall_aqi': aqis[dom], 'dominant_pollutant': dom}
                    
                    def get_aqi_category(self, aqi):
                        for (low, high), cat in self.aqi_categories.items():
                            if low <= aqi <= high: return cat
                        return 'Hazardous'
                cls._calculator = MinimalAQICalculator()
        return cls._calculator

    @classmethod
    def calculate_aqi_from_data(cls, sensor_data: dict) -> dict:
        """Calculates AQI and category from a dictionary of sensor readings."""
        try:
            calculator = cls.get_calculator()
            pm25 = float(sensor_data.get('pm25', 0) or 0)
            pm10 = float(sensor_data.get('pm10', 0) or 0)
            aqi_result = calculator.calculate_aqi(pm25=pm25, pm10=pm10)
            overall_aqi = aqi_result.get('overall_aqi')
            return {
                'aqi': overall_aqi,
                'category': calculator.get_aqi_category(overall_aqi),
            }
        except Exception as e:
            print(f"Error calculating AQI: {e}\n{traceback.format_exc()}")
            return {}