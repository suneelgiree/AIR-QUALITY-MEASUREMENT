import requests
from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_datetime
from django.db import transaction
from air_quality.models import AirQualityReading
from authentication.models import CustomUser

# The URL for your friend's sensor API
SENSOR_API_URL = "https://f2whboqd6l.execute-api.us-east-1.amazonaws.com/default/getAQIData"

class Command(BaseCommand):
    help = "Fetches the latest AQI data from the cloud API and saves it to the database"

    def handle(self, *args, **options):
        self.stdout.write(self.style.HTTP_INFO(f"Fetching data from {SENSOR_API_URL}..."))

        try:
            response = requests.get(SENSOR_API_URL)
            response.raise_for_status()
            # The API returns a list of readings, so we name it accordingly
            readings_list = response.json()

        except requests.exceptions.RequestException as e:
            raise CommandError(f"Error fetching data from API: {e}")
        except ValueError:
            raise CommandError("Error: Invalid JSON received from the API.")

        # The API must return a list
        if not isinstance(readings_list, list):
            raise CommandError(f"Error: API response was not a list, but {type(readings_list).__name__}.")

        # Get the user to associate with the readings
        try:
            user = CustomUser.objects.get(email='suneelgiree@gmail.com')
        except CustomUser.DoesNotExist:
            user = CustomUser.objects.filter(is_superuser=True).first()
            if not user:
                raise CommandError("No superuser found to associate readings with. Please create one.")
            self.stdout.write(self.style.WARNING(f"Default user not found. Using fallback: {user.email}"))

        saved_count = 0
        skipped_count = 0

        # Loop through each reading object in the list from the API
        for reading_data in readings_list:
            timestamp_str = reading_data.get('timestamp')
            if not timestamp_str:
                self.stdout.write(self.style.WARNING("Skipping reading due to missing 'timestamp'."))
                continue

            timestamp = parse_datetime(timestamp_str)
            if not timestamp:
                self.stdout.write(self.style.WARNING(f"Skipping reading due to invalid timestamp format: {timestamp_str}"))
                continue

            # Use a transaction to ensure atomicity for each reading
            try:
                with transaction.atomic():
                    # Check if a reading with this exact timestamp and source already exists
                    if AirQualityReading.objects.filter(timestamp=timestamp, source="FRIEND_API").exists():
                        skipped_count += 1
                        continue

                    # Create the new reading in your database
                    AirQualityReading.objects.create(
                        user=user,
                        source="FRIEND_API",
                        timestamp=timestamp,
                        location_name=reading_data.get('location', 'Unknown Location'),
                        latitude=reading_data.get('latitude'),
                        longitude=reading_data.get('longitude'),
                        aqi=reading_data.get('overall_aqi'),
                        pm25=reading_data.get('pm25'),
                        pm10=reading_data.get('pm10'),
                        co=reading_data.get('co'),
                        no2=reading_data.get('no2'),
                        so2=reading_data.get('so2'),
                        o3=reading_data.get('o3'),
                        temperature=reading_data.get('temperature'),
                        humidity=reading_data.get('humidity'),
                        pressure=reading_data.get('pressure'),
                        category=reading_data.get('category', {}).get('Category', 'N/A'),
                        raw_data=reading_data
                    )
                    saved_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error saving reading for timestamp {timestamp}: {e}"))

        self.stdout.write(self.style.SUCCESS(
            f"Command finished. Successfully saved {saved_count} new reading(s). Skipped {skipped_count} duplicate(s)."
        ))