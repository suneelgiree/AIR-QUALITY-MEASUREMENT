#!/usr/bin/env python3
"""
BME280 Environmental Sensor Simulator
Simulates BME280 temperature, humidity, and pressure sensor data
"""

import time
import random
import json
import math
from datetime import datetime

class BME280Simulator:
    def __init__(self):
        # Base values for environmental conditions
        self.base_temperature = 25.0  # Celsius
        self.base_humidity = 50.0     # Percent
        self.base_pressure = 1013.25  # hPa (sea level)
        
        # Simulation parameters for daily variation
        self.temp_daily_range = 8.0   # Daily temperature variation
        self.humidity_daily_range = 20.0  # Daily humidity variation
        self.pressure_daily_range = 5.0   # Daily pressure variation
        
    def get_time_factor(self):
        """Get time-based factor for daily variations"""
        now = datetime.now()
        # Calculate hours since midnight as fraction of day
        hours_since_midnight = now.hour + now.minute / 60.0
        # Create sine wave for daily variation (peak at 2 PM, low at 2 AM)
        time_factor = math.sin((hours_since_midnight - 2) * math.pi / 12)
        return time_factor
    
    def read_sensor(self):
        """Simulate reading from BME280 sensor"""
        time_factor = self.get_time_factor()
        
        # Temperature: warmer during day, cooler at night
        temperature = (self.base_temperature + 
                      time_factor * self.temp_daily_range / 2 + 
                      random.uniform(-1.5, 1.5))
        
        # Humidity: typically inverse relationship with temperature
        humidity = (self.base_humidity - 
                   time_factor * self.humidity_daily_range / 3 + 
                   random.uniform(-8, 8))
        humidity = max(0, min(100, humidity))  # Clamp between 0-100%
        
        # Pressure: slight variations with weather patterns
        pressure = (self.base_pressure + 
                   random.uniform(-self.pressure_daily_range, self.pressure_daily_range) + 
                   random.uniform(-2, 2))
        
        # Calculate derived values
        # Dew point approximation
        dew_point = temperature - ((100 - humidity) / 5.0)
        
        # Heat index (feels like temperature)
        if temperature >= 27 and humidity >= 40:
            heat_index = self.calculate_heat_index(temperature, humidity)
        else:
            heat_index = temperature
        
        # Altitude estimation based on pressure
        altitude = 44330 * (1 - (pressure / 1013.25) ** 0.1903)
        
        return {
            'timestamp': datetime.now().isoformat(),
            'sensor': 'BME280',
            'temperature': round(temperature, 2),
            'humidity': round(humidity, 2),
            'pressure': round(pressure, 2),
            'dew_point': round(dew_point, 2),
            'heat_index': round(heat_index, 2),
            'altitude': round(altitude, 1),
            'units': {
                'temperature': '°C',
                'humidity': '%',
                'pressure': 'hPa',
                'dew_point': '°C',
                'heat_index': '°C',
                'altitude': 'm'
            }
        }
    
    def calculate_heat_index(self, temp_c, humidity):
        """Calculate heat index (feels like temperature)"""
        # Convert to Fahrenheit for calculation
        temp_f = temp_c * 9/5 + 32
        
        # Heat index formula
        hi = (16.923 + (0.185212 * temp_f) + (5.37941 * humidity) - 
              (0.100254 * temp_f * humidity) + (0.00941695 * temp_f * temp_f) + 
              (0.00728898 * humidity * humidity) + (0.000345372 * temp_f * temp_f * humidity) - 
              (0.000814971 * temp_f * humidity * humidity) + 
              (0.0000102102 * temp_f * temp_f * humidity * humidity) - 
              (0.000038646 * temp_f * temp_f * temp_f) + (0.0000291583 * humidity * humidity * humidity) + 
              (0.00000142721 * temp_f * temp_f * temp_f * humidity) + 
              (0.000000197483 * temp_f * humidity * humidity * humidity) - 
              (0.0000000218429 * temp_f * temp_f * temp_f * humidity * humidity) + 
              (0.000000000843296 * temp_f * temp_f * humidity * humidity * humidity) - 
              (0.0000000000481975 * temp_f * temp_f * temp_f * humidity * humidity * humidity))
        
        # Convert back to Celsius
        return (hi - 32) * 5/9
    
    def save_data(self, data, filename='bme280_data.json'):
        """Save sensor data to JSON file"""
        try:
            # Try to read existing data
            try:
                with open(filename, 'r') as f:
                    existing_data = json.load(f)
            except FileNotFoundError:
                existing_data = []
            
            # Append new data
            existing_data.append(data)
            
            # Keep only last 100 readings
            if len(existing_data) > 100:
                existing_data = existing_data[-100:]
            
            # Save back to file
            with open(filename, 'w') as f:
                json.dump(existing_data, f, indent=2)
                
        except Exception as e:
            print(f"Error saving data: {e}")
    
    def run_continuous(self, interval_minutes=20):
        """Run sensor simulation continuously"""
        print(f"Starting BME280 simulation - readings every {interval_minutes} minutes")
        print("Press Ctrl+C to stop")
        
        try:
            while True:
                # Read sensor data
                data = self.read_sensor()
                
                # Print current reading
                print(f"\n--- BME280 Reading at {data['timestamp']} ---")
                print(f"Temperature: {data['temperature']}°C")
                print(f"Humidity: {data['humidity']}%")
                print(f"Pressure: {data['pressure']} hPa")
                print(f"Dew Point: {data['dew_point']}°C")
                print(f"Heat Index: {data['heat_index']}°C")
                print(f"Altitude: {data['altitude']} m")
                
                # Save data
                self.save_data(data)
                print(f"Data saved to bme280_data.json")
                
                # Wait for next reading
                time.sleep(interval_minutes * 60)
                
        except KeyboardInterrupt:
            print("\nBME280 simulation stopped by user")
        except Exception as e:
            print(f"Error in simulation: {e}")

def main():
    """Main function to run BME280 simulator"""
    sensor = BME280Simulator()
    
    # For testing, you can get a single reading
    print("BME280 Sensor Simulator")
    print("=" * 30)
    
    # Single reading for testing
    data = sensor.read_sensor()
    print(json.dumps(data, indent=2))
    
    # Ask user if they want continuous mode
    choice = input("\nRun continuous mode? (y/n): ").lower()
    if choice == 'y':
        sensor.run_continuous()

if __name__ == "__main__":
    main()