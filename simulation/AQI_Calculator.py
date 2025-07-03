#!/usr/bin/env python3
"""
Air Quality Index (AQI) Calculator
Calculates AQI from PM2.5 and PM10 values using EPA standards
"""

import json
import math
from datetime import datetime

class AQICalculator:
    def __init__(self):
        # EPA AQI breakpoints for PM2.5 (μg/m³)
        self.pm25_breakpoints = [
            (0.0, 12.0, 0, 50),      # Good
            (12.1, 35.4, 51, 100),   # Moderate
            (35.5, 55.4, 101, 150),  # Unhealthy for Sensitive Groups
            (55.5, 150.4, 151, 200), # Unhealthy
            (150.5, 250.4, 201, 300), # Very Unhealthy
            (250.5, 350.4, 301, 400), # Hazardous
            (350.5, 500.4, 401, 500)  # Hazardous
        ]
        
        # EPA AQI breakpoints for PM10 (μg/m³)
        self.pm10_breakpoints = [
            (0, 54, 0, 50),       # Good
            (55, 154, 51, 100),   # Moderate
            (155, 254, 101, 150), # Unhealthy for Sensitive Groups
            (255, 354, 151, 200), # Unhealthy
            (355, 424, 201, 300), # Very Unhealthy
            (425, 504, 301, 400), # Hazardous
            (505, 604, 401, 500)  # Hazardous
        ]
        
        # AQI categories
        self.aqi_categories = {
            (0, 50): ("Good", "Green", "Air quality is considered satisfactory"),
            (51, 100): ("Moderate", "Yellow", "Air quality is acceptable for most people"),
            (101, 150): ("Unhealthy for Sensitive Groups", "Orange", "Members of sensitive groups may experience health effects"),
            (151, 200): ("Unhealthy", "Red", "Everyone may begin to experience health effects"),
            (201, 300): ("Very Unhealthy", "Purple", "Health warnings of emergency conditions"),
            (301, 500): ("Hazardous", "Maroon", "Health alert: everyone may experience serious health effects")
        }
    
    def calculate_aqi_for_pollutant(self, concentration, breakpoints):
        """Calculate AQI for a specific pollutant"""
        for bp_lo, bp_hi, aqi_lo, aqi_hi in breakpoints:
            if bp_lo <= concentration <= bp_hi:
                # Linear interpolation formula
                aqi = ((aqi_hi - aqi_lo) / (bp_hi - bp_lo)) * (concentration - bp_lo) + aqi_lo
                return round(aqi)
        
        # If concentration is higher than highest breakpoint, return max AQI
        return 500
    
    def calculate_aqi(self, pm25=None, pm10=None):
        """Calculate overall AQI from PM2.5 and PM10 values"""
        aqi_values = []
        
        if pm25 is not None:
            pm25_aqi = self.calculate_aqi_for_pollutant(pm25, self.pm25_breakpoints)
            aqi_values.append(('PM2.5', pm25, pm25_aqi))
        
        if pm10 is not None:
            pm10_aqi = self.calculate_aqi_for_pollutant(pm10, self.pm10_breakpoints)
            aqi_values.append(('PM10', pm10, pm10_aqi))
        
        if not aqi_values:
            return None
        
        # Overall AQI is the highest individual AQI
        overall_aqi = max(aqi_values, key=lambda x: x[2])
        
        return {
            'timestamp': datetime.now().isoformat(),
            'overall_aqi': overall_aqi[2],
            'dominant_pollutant': overall_aqi[0],
            'dominant_concentration': overall_aqi[1],
            'individual_aqis': {item[0]: item[2] for item in aqi_values},
            'concentrations': {item[0]: item[1] for item in aqi_values}
        }
    
    def get_aqi_category(self, aqi_value):
        """Get AQI category information"""
        for (low, high), (category, color, description) in self.aqi_categories.items():
            if low <= aqi_value <= high:
                return {
                    'category': category,
                    'color': color,
                    'description': description,
                    'range': f"{low}-{high}"
                }
        return {
            'category': 'Hazardous',
            'color': 'Maroon',
            'description': 'Health alert: everyone may experience serious health effects',
            'range': '301-500'
        }
    
    def calculate_from_files(self, pms_file='pms7003_data.json', bme_file='bme280_data.json'):
        """Calculate AQI from saved sensor data files"""
        try:
            # Read PMS7003 data
            with open(pms_file, 'r') as f:
                pms_data = json.load(f)
            
            if not pms_data:
                print("No PMS7003 data found")
                return None
            
            # Get latest reading
            latest_pms = pms_data[-1]
            pm25 = latest_pms.get('pm2_5_standard')
            pm10 = latest_pms.get('pm10_standard')
            
            # Calculate AQI
            aqi_result = self.calculate_aqi(pm25=pm25, pm10=pm10)
            
            if aqi_result:
                # Get category information
                category_info = self.get_aqi_category(aqi_result['overall_aqi'])
                aqi_result['category_info'] = category_info
                
                # Add environmental data if available
                try:
                    with open(bme_file, 'r') as f:
                        bme_data = json.load(f)
                    if bme_data:
                        latest_bme = bme_data[-1]
                        aqi_result['environmental_data'] = {
                            'temperature': latest_bme.get('temperature'),
                            'humidity': latest_bme.get('humidity'),
                            'pressure': latest_bme.get('pressure')
                        }
                except FileNotFoundError:
                    print("BME280 data file not found, continuing without environmental data")
            
            return aqi_result
            
        except FileNotFoundError:
            print(f"PMS7003 data file '{pms_file}' not found")
            return None
        except json.JSONDecodeError:
            print("Error reading JSON data")
            return None
        except Exception as e:
            print(f"Error calculating AQI: {e}")
            return None
    
    def save_aqi_data(self, aqi_data, filename='aqi_data.json'):
        """Save AQI calculation results"""
        try:
            # Try to read existing data
            try:
                with open(filename, 'r') as f:
                    existing_data = json.load(f)
            except FileNotFoundError:
                existing_data = []
            
            # Append new data
            existing_data.append(aqi_data)
            
            # Keep only last 100 readings
            if len(existing_data) > 100:
                existing_data = existing_data[-100:]
            
            # Save back to file
            with open(filename, 'w') as f:
                json.dump(existing_data, f, indent=2)
                
        except Exception as e:
            print(f"Error saving AQI data: {e}")
    
    def print_aqi_report(self, aqi_data):
        """Print formatted AQI report"""
        if not aqi_data:
            print("No AQI data available")
            return
        
        print("\n" + "="*60)
        print("           AIR QUALITY INDEX REPORT")
        print("="*60)
        print(f"Timestamp: {aqi_data['timestamp']}")
        print(f"Overall AQI: {aqi_data['overall_aqi']}")
        print(f"Dominant Pollutant: {aqi_data['dominant_pollutant']}")
        print(f"Concentration: {aqi_data['dominant_concentration']} μg/m³")
        
        category = aqi_data.get('category_info', {})
        print(f"\nCategory: {category.get('category', 'Unknown')}")
        print(f"Color Code: {category.get('color', 'Unknown')}")
        print(f"Description: {category.get('description', 'No description')}")
        
        print(f"\nIndividual AQI Values:")
        for pollutant, aqi_val in aqi_data['individual_aqis'].items():
            concentration = aqi_data['concentrations'][pollutant]
            print(f"  {pollutant}: {aqi_val} (concentration: {concentration} μg/m³)")
        
        if 'environmental_data' in aqi_data:
            env = aqi_data['environmental_data']
            print(f"\nEnvironmental Conditions:")
            print(f"  Temperature: {env.get('temperature', 'N/A')}°C")
            print(f"  Humidity: {env.get('humidity', 'N/A')}%")
            print(f"  Pressure: {env.get('pressure', 'N/A')} hPa")
        
        print("="*60)

def main():
    """Main function to run AQI calculator"""
    calculator = AQICalculator()
    
    print("AQI Calculator")
    print("=" * 30)
    
    # Option 1: Calculate from manual input
    print("\n1. Manual Input")
    print("2. Calculate from sensor data files")
    choice = input("Choose option (1 or 2): ").strip()
    
    if choice == '1':
        try:
            pm25 = float(input("Enter PM2.5 concentration (μg/m³): "))
            pm10 = float(input("Enter PM10 concentration (μg/m³): "))
            
            aqi_result = calculator.calculate_aqi(pm25=pm25, pm10=pm10)
            if aqi_result:
                category_info = calculator.get_aqi_category(aqi_result['overall_aqi'])
                aqi_result['category_info'] = category_info
                calculator.print_aqi_report(aqi_result)
            
        except ValueError:
            print("Invalid input. Please enter numeric values.")
    
    elif choice == '2':
        aqi_result = calculator.calculate_from_files()
        if aqi_result:
            calculator.print_aqi_report(aqi_result)
            calculator.save_aqi_data(aqi_result)
            print(f"\nAQI data saved to aqi_data.json")
        else:
            print("Could not calculate AQI from sensor data files")
    
    else:
        print("Invalid choice")

if __name__ == "__main__":
    main()