#!/usr/bin/env python3
"""
PMS7003 Air Quality Sensor Simulator
Simulates PMS7003 particulate matter sensor data
"""

import time
import random
import json
from datetime import datetime

class PMS7003Simulator:
    def __init__(self):
        # Base values for different PM measurements (μg/m³)
        self.base_pm1_0 = 10
        self.base_pm2_5 = 20
        self.base_pm10 = 30
        
        # Base particle counts per 0.1L of air
        self.base_particles_0_3 = 800
        self.base_particles_0_5 = 400
        self.base_particles_1_0 = 200
        self.base_particles_2_5 = 80
        self.base_particles_5_0 = 40
        self.base_particles_10 = 20
        
    def read_sensor(self):
        """Simulate reading from PMS7003 sensor"""
        # Add realistic variations to base values
        pm1_0_std = max(0, self.base_pm1_0 + random.uniform(-5, 8))
        pm2_5_std = max(0, self.base_pm2_5 + random.uniform(-8, 12))
        pm10_std = max(0, self.base_pm10 + random.uniform(-10, 15))
        
        # Environmental readings (typically slightly higher)
        pm1_0_env = pm1_0_std * random.uniform(1.0, 1.3)
        pm2_5_env = pm2_5_std * random.uniform(1.0, 1.3)
        pm10_env = pm10_std * random.uniform(1.0, 1.3)
        
        # Particle counts with realistic variations
        particles_0_3 = max(0, int(self.base_particles_0_3 + random.uniform(-300, 500)))
        particles_0_5 = max(0, int(self.base_particles_0_5 + random.uniform(-150, 250)))
        particles_1_0 = max(0, int(self.base_particles_1_0 + random.uniform(-80, 120)))
        particles_2_5 = max(0, int(self.base_particles_2_5 + random.uniform(-30, 50)))
        particles_5_0 = max(0, int(self.base_particles_5_0 + random.uniform(-15, 25)))
        particles_10 = max(0, int(self.base_particles_10 + random.uniform(-8, 12)))
        
        return {
            'timestamp': datetime.now().isoformat(),
            'sensor': 'PMS7003',
            'pm1_0_standard': round(pm1_0_std, 1),
            'pm2_5_standard': round(pm2_5_std, 1),
            'pm10_standard': round(pm10_std, 1),
            'pm1_0_environmental': round(pm1_0_env, 1),
            'pm2_5_environmental': round(pm2_5_env, 1),
            'pm10_environmental': round(pm10_env, 1),
            'particles_0_3um': particles_0_3,
            'particles_0_5um': particles_0_5,
            'particles_1_0um': particles_1_0,
            'particles_2_5um': particles_2_5,
            'particles_5_0um': particles_5_0,
            'particles_10um': particles_10,
            'unit_pm': 'μg/m³',
            'unit_particles': 'particles/0.1L'
        }
    
    def save_data(self, data, filename='pms7003_data.json'):
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
        print(f"Starting PMS7003 simulation - readings every {interval_minutes} minutes")
        print("Press Ctrl+C to stop")
        
        try:
            while True:
                # Read sensor data
                data = self.read_sensor()
                
                # Print current reading
                print(f"\n--- PMS7003 Reading at {data['timestamp']} ---")
                print(f"PM1.0: {data['pm1_0_standard']} μg/m³")
                print(f"PM2.5: {data['pm2_5_standard']} μg/m³")
                print(f"PM10:  {data['pm10_standard']} μg/m³")
                print(f"Particles >0.3μm: {data['particles_0_3um']}")
                print(f"Particles >2.5μm: {data['particles_2_5um']}")
                
                # Save data
                self.save_data(data)
                print(f"Data saved to pms7003_data.json")
                
                # Wait for next reading
                time.sleep(interval_minutes * 60)
                
        except KeyboardInterrupt:
            print("\nPMS7003 simulation stopped by user")
        except Exception as e:
            print(f"Error in simulation: {e}")

def main():
    """Main function to run PMS7003 simulator"""
    sensor = PMS7003Simulator()
    
    # For testing, you can get a single reading
    print("PMS7003 Sensor Simulator")
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