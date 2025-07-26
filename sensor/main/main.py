from machine import UART, Pin
import time
import json

# UART setup for PMS7003 sensor
uart = UART(1, baudrate=9600, tx=Pin(4), rx=Pin(5))  # Pico RX = GPIO5
FILENAME = "pm_data.csv"
AQI_LOG_FILE = "aqi_log.json"

# LCD Pins
rs = Pin(2, Pin.OUT)
e = Pin(3, Pin.OUT)
d4 = Pin(8, Pin.OUT)
d5 = Pin(9, Pin.OUT)
d6 = Pin(10, Pin.OUT)
d7 = Pin(11, Pin.OUT)

# LCD Functions
def pulse():
    e.off()
    time.sleep_us(1000)  # 1ms
    e.on()
    time.sleep_us(1000)  # 1ms
    e.off()
    time.sleep_us(1000)  # 1ms

def send_nibble(value):
    d4.value((value >> 0) & 1)
    d5.value((value >> 1) & 1)
    d6.value((value >> 2) & 1)
    d7.value((value >> 3) & 1)
    pulse()

def send_byte(value, is_data):
    rs.value(is_data)
    time.sleep_us(100)  # Setup time
    send_nibble(value >> 4)  # high nibble
    send_nibble(value & 0x0F)  # low nibble
    if not is_data:
        time.sleep_us(2000)  # Command execution time
    else:
        time.sleep_us(50)   # Data write time

def lcd_init():
    # Initial setup - all pins low
    rs.off()
    e.off()
    d4.off()
    d5.off()
    d6.off()
    d7.off()
    
    # Wait for LCD power-on reset
    time.sleep(0.05)  # 50ms
    
    # Initialize sequence for 4-bit mode
    send_nibble(0x03)
    time.sleep(0.005)  # 5ms
    send_nibble(0x03)
    time.sleep(0.001)  # 1ms
    send_nibble(0x03)
    time.sleep(0.001)  # 1ms
    send_nibble(0x02)  # Set 4-bit mode
    time.sleep(0.001)  # 1ms
    
    # Function set: 4-bit, 2 lines, 5x8 dots
    send_byte(0x28, False)
    time.sleep(0.001)
    
    # Display control: Display off
    send_byte(0x08, False)
    time.sleep(0.001)
    
    # Clear display
    send_byte(0x01, False)
    time.sleep(0.002)  # Clear needs more time
    
    # Entry mode set: Increment cursor, no shift
    send_byte(0x06, False)
    time.sleep(0.001)
    
    # Display control: Display on, cursor off, blink off
    send_byte(0x0C, False)
    time.sleep(0.001)

def lcd_goto(line, pos):
    addr = 0x80 + (0x40 * line) + pos
    send_byte(addr, False)

def lcd_print(text):
    for ch in text:
        send_byte(ord(ch), True)

def lcd_clear():
    send_byte(0x01, False)  # Clear display
    time.sleep(0.003)  # Increased clear time

def lcd_home():
    send_byte(0x02, False)  # Return home
    time.sleep(0.003)  # Home command needs time

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
            (0, 50): ("Good", "Green"),
            (51, 100): ("Moderate", "Yellow"),
            (101, 150): ("USG", "Orange"),  # Shortened for LCD
            (151, 200): ("Unhealthy", "Red"),
            (201, 300): ("V.Unhealthy", "Purple"),
            (301, 500): ("Hazardous", "Maroon")
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
        for (low, high), (category, color) in self.aqi_categories.items():
            if low <= aqi_value <= high:
                return {
                    'category': category,
                    'color': color,
                    'range': f"{low}-{high}"
                }
        return {
            'category': 'Hazardous',
            'color': 'Maroon',
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

def display_aqi_on_lcd(pm, aqi_result):
    """Display AQI data on LCD"""
    # Clear and go to home position
    lcd_clear()
    
    # Line 1: AQI and PM2.5 (limit to 16 characters)
    lcd_goto(0, 0)
    line1 = f"AQI:{aqi_result['overall_aqi']:3d} PM2.5:{pm[1]:3d}"
    if len(line1) > 16:
        line1 = line1[:16]
    lcd_print(line1)
    
    # Line 2: Category and PM10 (limit to 16 characters)
    lcd_goto(1, 0)
    category_info = calculator.get_aqi_category(aqi_result['overall_aqi'])
    category = category_info['category'][:6]  # Limit category length
    line2 = f"{category} PM10:{pm[2]:3d}"
    if len(line2) > 16:
        line2 = line2[:16]
    lcd_print(line2)

def display_waiting_on_lcd():
    """Display waiting message when no sensor data"""
    lcd_clear()
    lcd_goto(0, 0)
    lcd_print("  AQI Monitor   ")
    lcd_goto(1, 0)
    lcd_print("   Reading...   ")

# Initialize LCD and AQI calculator
print("Initializing LCD...")
lcd_init()
calculator = AQICalculator()

# Display startup message
lcd_goto(0, 0)
lcd_print("  AQI Monitor   ")
lcd_goto(1, 0)
lcd_print(" Initializing.. ")
time.sleep(3)

# Test LCD with simple message
lcd_clear()
lcd_goto(0, 0)
lcd_print("LCD Test: OK    ")
lcd_goto(1, 0)
lcd_print("Starting sensor ")
time.sleep(2)

# Variables for logging (every 10 minutes)
last_log_time = 0
LOG_INTERVAL = 600  # 10 minutes in seconds

print("AQI Monitor started - updating LCD every second")
# UART0 (used to talk to ESP32)
uart_esp = UART(0, baudrate=9600, tx=Pin(0), rx=Pin(1))  # Pico TX = GP0, RX = GP1

def handle_uart_command():
    if uart_esp.any():
        try:
            command = uart_esp.readline().decode().strip()
            print("ESP32 command:", command)

            if command == "GET_JSON":
                with open(AQI_LOG_FILE, "r") as f:
                    for line in f:
                        uart_esp.write(line)
                        time.sleep(0.01)  # throttle to avoid buffer overflow
                uart_esp.write("\n<END>\n")

            elif command == "GET_CSV":
                with open(FILENAME, "r") as f:
                    for line in f:
                        uart_esp.write(line)
                        time.sleep(0.01)
                uart_esp.write("\n<END>\n")

        except Exception as e:
            uart_esp.write(f"ERROR: {str(e)}\n")


while True:
    current_time = time.time()
    pm = read_pms7003()
    
    if pm:
        aqi_result = calculator.calculate_aqi(pm25=pm[1], pm10=pm[2])
        if aqi_result:
            # Display on LCD every second
            display_aqi_on_lcd(pm, aqi_result)
            
            # Log to files every 10 minutes
            if current_time - last_log_time >= LOG_INTERVAL:
                category_info = calculator.get_aqi_category(aqi_result['overall_aqi'])
                aqi_result['category_info'] = category_info
                log_to_file(pm, aqi_result)
                log_aqi_to_json(aqi_result)
                
                timestamp = time.localtime()
                timestamp_str = f"{timestamp[0]:04d}-{timestamp[1]:02d}-{timestamp[2]:02d} {timestamp[3]:02d}:{timestamp[4]:02d}:{timestamp[5]:02d}"
                print(f"{timestamp_str} → PM1.0: {pm[0]}, PM2.5: {pm[1]}, PM10: {pm[2]} → AQI: {aqi_result['overall_aqi']} ({category_info['category']}) [LOGGED]")
                
                last_log_time = current_time
            else:
                # Just print to console without logging
                timestamp = time.localtime()
                timestamp_str = f"{timestamp[0]:04d}-{timestamp[1]:02d}-{timestamp[2]:02d} {timestamp[3]:02d}:{timestamp[4]:02d}:{timestamp[5]:02d}"
                category_info = calculator.get_aqi_category(aqi_result['overall_aqi'])
                print(f"{timestamp_str} → AQI: {aqi_result['overall_aqi']} ({category_info['category']})")
    else:
        # Show waiting message when no sensor data
        display_waiting_on_lcd()
    handle_uart_command()

    
    time.sleep(1)  # Update every second
