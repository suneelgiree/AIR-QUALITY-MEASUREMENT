import json
import csv
from django.core.management.base import BaseCommand
from sensor.models import AQILog
from datetime import datetime
from django.utils import timezone

class Command(BaseCommand):
    help = 'Import AQI log data from JSON and CSV files into the database'

    def handle(self, *args, **options):
        # Import AQI JSON
        try:
            with open('aqi_log.json', 'r') as f:
                data = json.load(f)
                for entry in data:
                    # Parse timestamp and make it timezone-aware
                    dt = datetime.fromisoformat(entry['timestamp'])
                    if timezone.is_naive(dt):
                        dt = timezone.make_aware(dt)
                    AQILog.objects.update_or_create(
                        timestamp=dt,
                        defaults={
                            'overall_aqi': entry['overall_aqi'],
                            'dominant_pollutant': entry['dominant_pollutant'],
                            'dominant_concentration': entry['dominant_concentration'],
                            'individual_aqis': entry['individual_aqis'],
                            'concentrations': entry['concentrations'],
                            'category_info': entry['category_info'],
                        }
                    )
            print("Imported AQI JSON data.")
        except FileNotFoundError:
            print("aqi_log.json not found. Skipping JSON import.")

        # Import CSV (adjust columns as needed)
        try:
            with open('sensor/main/pm_data.csv', newline='') as f:
                reader = csv.reader(f)
                for row in reader:
                    # timestamp, sample_id, pm25, pm10, aqi, dominant_pollutant, dominant_concentration
                    ts = datetime.fromtimestamp(int(row[0]))
                    if timezone.is_naive(ts):
                        ts = timezone.make_aware(ts)
                    AQILog.objects.update_or_create(
                        timestamp=ts,
                        defaults={
                            'overall_aqi': int(row[4]),
                            'dominant_pollutant': row[5],
                            'dominant_concentration': float(row[6]),
                            'individual_aqis': {"PM2.5": int(row[2]), "PM10": int(row[3])},
                            'concentrations': {"PM2.5": float(row[2]), "PM10": float(row[3])},
                            'category_info': {},  # Add mapping here if needed
                        }
                    )
            print("Imported AQI CSV data.")
        except FileNotFoundError:
            print("sensor/main/pm_data.csv not found. Skipping CSV import.")