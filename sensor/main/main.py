from machine import UART, Pin
import time
import json

uart = UART(1, baudrate=9600, tx=Pin(4), rx=Pin(5))  # Pico RX = GPIO5
FILENAME = "pm_data.csv"
AQI_LOG_FILE = "aqi_log.json"

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

def read_pms7003():
    if uart.any():
        buffer = uart.read(32)
        if buffer and buffer[0] == 0x42 and buffer[1] == 0x4D:
            pm1 = buffer[4] << 8 | buffer[5]
            pm25 = buffer[6] << 8 | buffer[7]
            pm10 = buffer[8] << 8 | buffer[9]
            return (pm1, pm25, pm10)
    return None

def log_to_file(pm, aqi_result):
    with open(FILENAME, "a") as f:
        t = time.time()
        f.write(f"{t},{pm[0]},{pm[1]},{pm[2]},{aqi_result['overall_aqi']},{aqi_result['dominant_pollutant']},{aqi_result['dominant_concentration']}\n")

def log_aqi_to_json(aqi_result):
    try:
        with open(AQI_LOG_FILE, "r") as f:
            existing_data = json.load(f)
    except (OSError, ValueError):  # Catch file not found or JSON decode errors
        existing_data = []

    existing_data.append(aqi_result)
    if len(existing_data) > 100:
        existing_data = existing_data[-100:]

    try:
        with open(AQI_LOG_FILE, "w") as f:
            json.dump(existing_data, f)  # Removed the indent argument
    except OSError as e:
        print(f"[!] Error writing to file: {e}")

calculator = AQICalculator()

while True:
    pm = read_pms7003()
    if pm:
        aqi_result = calculator.calculate_aqi(pm25=pm[1], pm10=pm[2])
        if aqi_result:
            category_info = calculator.get_aqi_category(aqi_result['overall_aqi'])
            aqi_result['category_info'] = category_info
            log_to_file(pm, aqi_result)
            log_aqi_to_json(aqi_result)
            timestamp = time.localtime()
            timestamp_str = f"{timestamp[0]:04d}-{timestamp[1]:02d}-{timestamp[2]:02d} {timestamp[3]:02d}:{timestamp[4]:02d}:{timestamp[5]:02d}"
            print(f"{timestamp_str} → PM1.0: {pm[0]}, PM2.5: {pm[1]}, PM10: {pm[2]} → AQI: {aqi_result['overall_aqi']} ({category_info['category']})")
    time.sleep(600)
