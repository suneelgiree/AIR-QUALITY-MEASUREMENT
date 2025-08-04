import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime, timedelta

# --- SETUP ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_model(filename):
    path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model file not found at {path}")
    return joblib.load(path)

try:
    AQI_MODELS = {
        'gbr': load_model('gbr_model.pkl'),
        'xgb': load_model('xgb_model.pkl'),
        'svr': load_model('svr_model.pkl'),
        'rf': load_model('random_forest_model.pkl'),
    }
    print("AQI models loaded successfully.")
except Exception as e:
    print(f"FATAL: Could not load a required model file. Error: {e}")
    AQI_MODELS = {}

# The correct, hard-coded feature list, based on your model's requirements.
CORRECT_FEATURE_COLUMNS = [
    'temperature_2m (°C)', 'relative_humidity_2m (%)', 'dew_point_2m (°C)', 
    'apparent_temperature (°C)', 'precipitation (mm)', 'rain (mm)', 
    'snowfall (cm)', 'snow_depth (m)', 'weather_code (wmo code)', 
    'pressure_msl (hPa)', 'surface_pressure (hPa)', 'cloud_cover (%)', 
    'cloud_cover_low (%)', 'cloud_cover_mid (%)', 'cloud_cover_high (%)', 
    'et0_fao_evapotranspiration (mm)', 'vapour_pressure_deficit (kPa)', 
    'wind_speed_10m (km/h)', 'wind_speed_100m (km/h)', 'wind_direction_10m (°)', 
    'wind_direction_100m (°)', 'wind_gusts_10m (km/h)', 
    'soil_temperature_0_to_7cm (°C)', 'soil_temperature_7_to_28cm (°C)', 
    'soil_temperature_28_to_100cm (°C)', 'soil_temperature_100_to_255cm (°C)', 
    'soil_moisture_0_to_7cm (m³/m³)', 'soil_moisture_7_to_28cm (m³/m³)', 
    'soil_moisture_28_to_100cm (m³/m³)', 'soil_moisture_100_to_255cm (m³/m³)', 
    'prev_us_aqi'
]

# --- DATA MAPPING FUNCTION ---
def get_feature_value(feature_name, reading):
    """
    Safely maps a required feature name to its value in the raw_data JSON,
    returning 0 if the value is missing to prevent NaN errors.
    """
    raw_data = reading.raw_data if isinstance(reading.raw_data, dict) else {}
    
    mapping = {
        'temperature_2m (°C)': raw_data.get('main', {}).get('temp'),
        'relative_humidity_2m (%)': raw_data.get('main', {}).get('humidity'),
        'pressure_msl (hPa)': raw_data.get('main', {}).get('pressure'),
        'apparent_temperature (°C)': raw_data.get('main', {}).get('feels_like'),
        'wind_speed_10m (km/h)': raw_data.get('wind', {}).get('speed'),
        'wind_direction_10m (°)': raw_data.get('wind', {}).get('deg'),
        'wind_gusts_10m (km/h)': raw_data.get('wind', {}).get('gust'),
        'cloud_cover (%)': raw_data.get('clouds', {}).get('all'),
        'rain (mm)': raw_data.get('rain', {}).get('1h'),
        'snowfall (cm)': raw_data.get('snow', {}).get('1h'),
        'prev_us_aqi': reading.aqi,
    }
    
    # Get the value from the mapping first
    value = mapping.get(feature_name)

    # If not in the specific mapping, try a direct key match
    if value is None:
        value = raw_data.get(feature_name)

    # --- THIS IS THE CRITICAL FIX ---
    # If the value is still None (missing), return 0. Otherwise, return the found value.
    return value if value is not None else 0

# --- MAIN FORECASTING FUNCTION ---
def generate_7_day_forecast(reading):
    if not AQI_MODELS:
        print("ERROR: AQI models are not loaded. Aborting.")
        return None

    # Step 1: Build the feature set, ensuring no NaN values
    forecast_features = {name: get_feature_value(name, reading) for name in CORRECT_FEATURE_COLUMNS}

    # Step 2: Create the 7-day DataFrame
    input_df = pd.DataFrame([forecast_features] * 7)
    
    # Step 3: Ensure column order
    X_aqi = input_df[CORRECT_FEATURE_COLUMNS]

    # Step 4: Predict AQI
    aqi_predictions_ensemble = {name: model.predict(X_aqi) for name, model in AQI_MODELS.items()}
    final_aqi_predictions = pd.DataFrame(aqi_predictions_ensemble).mean(axis=1)

    # Create the final results DataFrame
    start_date = pd.to_datetime(reading.timestamp).date()
    result_df = pd.DataFrame({
        'date': [start_date + timedelta(days=i + 1) for i in range(7)],
        'predicted_aqi': final_aqi_predictions
    })

    return result_df