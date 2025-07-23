import serial
import serial.tools.list_ports
import csv
from datetime import datetime
import time
import re
import json
import math

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

def find_arduino_port():
    ports = serial.tools.list_ports.comports()
    for port in ports:
        if "Arduino" in port.description or "CH340" in port.description or "ttyUSB" in port.device:
            print(f"[✓] Found Arduino on {port.device}")
            return port.device
    return None

def parse_pm_values(line):
    try:
        # Example input: PM1.0: 14 µg/m3 | PM2.5: 23 µg/m3 | PM10: 27 µg/m3
        match = re.findall(r"PM1\.0:\s*(\d+)\s*µg/m3\s*\|\s*PM2\.5:\s*(\d+)\s*µg/m3\s*\|\s*PM10:\s*(\d+)\s*µg/m3", line)
        if match:
            pm1, pm25, pm10 = match[0]
            return int(pm1), int(pm25), int(pm10)
    except:
        pass
    return None

def start_logging(port):
    calculator = AQICalculator()
    
    # Initialize existing data from file
    try:
        with open("aqi_log.json", "r") as f:
            existing_data = json.load(f)
        # Keep only last 100 entries
        existing_data = existing_data[-100:]
    except (FileNotFoundError, json.JSONDecodeError):
        existing_data = []

    try:
        ser = serial.Serial(port, 9600, timeout=1)
        print("[✓] Connected to Arduino. Starting log...\n")

        while True:
            line = ser.readline().decode(errors='ignore').strip()
            if not line:
                continue

            parsed = parse_pm_values(line)
            if parsed:
                pm1, pm25, pm10 = parsed
                # Calculate AQI
                aqi_result = calculator.calculate_aqi(pm25=pm25, pm10=pm10)
                if not aqi_result:
                    continue

                category_info = calculator.get_aqi_category(aqi_result['overall_aqi'])
                reading = {
                    'timestamp': datetime.now().isoformat(),
                    'overall_aqi': aqi_result['overall_aqi'],
                    'dominant_pollutant': aqi_result['dominant_pollutant'],
                    'dominant_concentration': aqi_result['dominant_concentration'],
                    'individual_aqis': aqi_result['individual_aqis'],
                    'concentrations': {
                        'PM1.0': pm1,
                        'PM2.5': pm25,
                        'PM10': pm10
                    },
                    'category_info': category_info
                }

                # Update data buffer
                existing_data.append(reading)
                if len(existing_data) > 100:
                    existing_data = existing_data[-100:]

                # Write to JSON file
                try:
                    with open("aqi_log.json", "w") as f:
                        json.dump(existing_data, f, indent=2)
                except Exception as e:
                    print(f"[!] Error writing to file: {e}")

                # Print status
                timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                print(f"{timestamp_str} → PM1.0: {pm1}, PM2.5: {pm25}, PM10: {pm10} → AQI: {reading['overall_aqi']} ({category_info['category']})")

    except serial.SerialException:
        print("[!] Arduino disconnected.")
    except KeyboardInterrupt:
        print("\n[!] Logging stopped by user.")

if __name__ == "__main__":
    print("[…] Waiting for Arduino...")
    while True:
        port = find_arduino_port()
        if port:
            start_logging(port)
            break
        time.sleep(2)