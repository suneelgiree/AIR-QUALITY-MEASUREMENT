import pandas as pd
import numpy as np
import joblib
import datetime

# Load saved model and feature columns
model = joblib.load('ridge_multioutput_weather.joblib')
feature_cols = joblib.load('feature_columns.joblib')

def prepare_input(today_weather, date):

    day_of_year = date.timetuple().tm_yday
    day_sin = np.sin(2 * np.pi * day_of_year / 365.25)
    day_cos = np.cos(2 * np.pi * day_of_year / 365.25)
    
    data = {
        'temperature': today_weather['temperature'],
        'humidity': today_weather['humidity'],
        'precipitation': today_weather['precipitation'],
        'wind_speed': today_weather['wind_speed'],
        'day_sin': day_sin,
        'day_cos': day_cos
    }
    
    return pd.DataFrame([data])

if __name__ == "__main__":
    # Example: today's weather and date
    today_weather = {
        'temperature': 25.0,     # °C
        'humidity': 60.0,        # %
        'precipitation': 0.0,    # mm
        'wind_speed': 10.0       # km/h
    }
    
    today_date = datetime.datetime(2025, 5, 25)  # Example date
    
    # Prepare input and predict
    X_input = prepare_input(today_weather, today_date)
    prediction = model.predict(X_input)[0]
    
    # Print predictions
    features = ['temperature', 'humidity', 'precipitation', 'wind_speed']
    print("Predicted weather for tomorrow:")
    for feat, val in zip(features, prediction):
        if feat == 'precipitation':
            print(f"{feat}: {val:.2f} mm")
        elif feat == 'humidity':
            print(f"{feat}: {val:.2f} %")
        else:
            unit = '°C' if feat == 'temperature' else 'km/h'
            print(f"{feat}: {val:.2f} {unit}")
